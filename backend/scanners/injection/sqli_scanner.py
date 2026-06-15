import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlencode, parse_qs, urlunparse
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

SQLI_PAYLOADS = [
    "'",
    "\"",
    "' OR '1'='1",
    "' OR 1=1--",
    "'; DROP TABLE--",
]

DB_ERRORS = {
    "you have an error in your sql syntax":  "MySQL",
    "warning: mysql":                        "MySQL",
    "mysql_fetch":                           "MySQL",

    "unclosed quotation mark":               "MSSQL",
    "microsoft ole db provider":             "MSSQL",
    "sqlserver error":                       "MSSQL",

    "ora-":                                  "Oracle",
    "quoted string not properly terminated": "Oracle",

    "postgresql error":                      "PostgreSQL",
    "pg_query():":                           "PostgreSQL",

    "sql syntax error":                      "Unknown DB",
    "syntax error in query":                 "Unknown DB",
    "sql error":                             "Unknown DB",
    "database error":                        "Unknown DB",
}


class SQLiScanner(BaseScanner):

    async def scan(self, target_url: str) -> ScanResult:
        try:
            async with httpx.AsyncClient(
                timeout=10,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"}
            ) as client:

                response = await client.get(target_url)
                
                # 1. WAF & Anti-Bot Awareness
                if response.status_code in [403, 406, 429, 503]:
                    return ScanResult(
                        vulnerability_name="SQL Injection (SQLi)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"⚠️ SCAN SKIPPED — WAF or anti-bot mechanism intercepted the request (Status: {response.status_code}).",
                        remediation="Ensure the target URL is publicly accessible or whitelist the scanner's IP."
                    )

                # Capture baseline to prevent false positives on tech blogs/docs
                baseline_text = response.text.lower()
                soup = BeautifulSoup(response.text, "html.parser")

                # Test URL Parameters
                url_result = await self._test_url_params(client, target_url, baseline_text)
                if url_result:
                    return self._build_fail_result(url_result, "URL parameter")

                # Test HTML Forms
                forms = soup.find_all("form")
                for form in forms:
                    form_result = await self._test_form(client, target_url, form, baseline_text)
                    if form_result:
                        return self._build_fail_result(form_result, "form input")

                # ── PASS ──────────────
                return ScanResult(
                    vulnerability_name="SQL Injection (SQLi)",
                    passed=True,
                    severity=SeverityLevel.INFO,
                    description=(
                        f"No SQL injection signals detected. "
                        f"Tested {len(forms)} form(s) and URL parameters with "
                        f"{len(SQLI_PAYLOADS)} payloads each. "
                        f"Note: If this is a JavaScript SPA, forms are rendered "
                        f"dynamically and are not visible to a static HTTP scanner. "
                        f"Manual testing recommended for full coverage."
                    ),
                    remediation=(
                        "No action required. Continue using parameterised "
                        "queries or an ORM."
                    )
                )

        except Exception as e:
            # Broadened catch to prevent stream death from bizarre network drops
            return ScanResult(
                vulnerability_name="SQL Injection (SQLi)",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"⚠️ SCAN SKIPPED — could not complete scan: {str(e)[:80]}",
                remediation="Ensure the target URL is publicly accessible and stable."
            )

    async def _test_url_params(self, client: httpx.AsyncClient, url: str, baseline_text: str) -> dict | None:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        if not params:
            return None

        for param_name in params:
            for payload in SQLI_PAYLOADS:
                injected_params = {k: v[0] for k, v in params.items()}
                injected_params[param_name] = payload
                new_query = urlencode(injected_params)
                injected_url = urlunparse(parsed._replace(query=new_query))

                try:
                    resp = await client.get(injected_url)
                    # 2. Differential Analysis
                    db_match = self._check_response(resp.text, baseline_text)
                    if db_match:
                        return {
                            "payload": payload,
                            "param":   param_name,
                            "db":      db_match,
                            "evidence": f"GET {injected_url}"
                        }
                except Exception:
                    continue

        return None

    async def _test_form(
        self, client: httpx.AsyncClient, base_url: str, form, baseline_text: str
    ) -> dict | None:
        action   = form.get("action", "")
        method   = form.get("method", "get").lower()
        form_url = urljoin(base_url, action)
        inputs   = form.find_all(["input", "textarea", "select"])

        for payload in SQLI_PAYLOADS:
            data = {}
            for inp in inputs:
                input_type = inp.get("type", "text").lower()
                name = inp.get("name")
                if not name:
                    continue
                if input_type == "hidden":
                    data[name] = inp.get("value", "")
                elif input_type in ("submit", "button", "image", "reset"):
                    continue
                else:
                    data[name] = payload

            if not data:
                continue

            try:
                if method == "post":
                    resp = await client.post(form_url, data=data)
                else:
                    resp = await client.get(form_url, params=data)

                # 2. Differential Analysis
                db_match = self._check_response(resp.text, baseline_text)
                if db_match:
                    return {
                        "payload": payload,
                        "param":   "form field",
                        "db":      db_match,
                        "evidence": f"{method.upper()} {form_url}"
                    }
            except Exception:
                continue

        return None

    def _check_response(self, response_text: str, baseline_text: str) -> str | None:
        lowered = response_text.lower()
        for error_string, db_name in DB_ERRORS.items():
            # The core false-positive fix: Only flag if the error wasn't already on the page!
            if error_string in lowered and error_string not in baseline_text:
                return db_name
        return None

    def _build_fail_result(self, finding: dict, location: str) -> ScanResult:
        # ── FAIL — this runs when a real SQLi signal is found ─────
        return ScanResult(
            vulnerability_name="SQL Injection (SQLi)",
            passed=False,
            severity=SeverityLevel.CRITICAL,
            description=(
                f"SQL injection signal detected in a {location}. "
                f"Payload '{finding['payload']}' triggered a {finding['db']} "
                f"error response at: {finding['evidence']}. "
                f"This indicates raw user input is being concatenated into SQL queries."
            ),
            remediation=(
                "Immediately replace all raw SQL string concatenation with parameterised "
                "queries (e.g. cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))) "
                "or use an ORM (SQLAlchemy, Django ORM). "
                "Never build SQL queries using f-strings, .format(), or + concatenation. "
                "OWASP Reference: A05:2025 — Injection."
            )
        )