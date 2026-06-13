import httpx
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse, urlencode, parse_qs, urlunparse
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

XSS_PAYLOAD = "<script>xssrecon</script>"
XSS_PAYLOAD_LOWER = xss_payload_lower = XSS_PAYLOAD.lower()
XSS_ENCODED = "&lt;script&gt;xssrecon&lt;/script&gt;"

INJECTABLE_TYPES = {"text", "search", "email", "url", "tel", "number", ""}


class XSSScanner(BaseScanner):

    async def scan(self, target_url: str) -> ScanResult:
        try:
            async with httpx.AsyncClient(
                timeout=15,
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"}
            ) as client:

                response = await client.get(target_url)
                soup = BeautifulSoup(response.text, "html.parser")

                url_result = await self._test_url_params(client, target_url)
                if url_result:
                    return self._build_fail_result(url_result)

                forms = soup.find_all("form")

                for form in forms:
                    form_result = await self._test_form(client, target_url, form)
                    if form_result:
                        return self._build_fail_result(form_result)

                return ScanResult(
                    vulnerability_name="Reflected XSS",
                    passed=True,
                    severity=SeverityLevel.INFO,
                    description=(
                        f"No reflected XSS detected. "
                        f"Tested {len(forms)} form(s) and URL parameters. "
                        f"Note: If this is a JavaScript SPA, forms are rendered "
                        f"dynamically and are not visible to a static HTTP scanner. "
                        f"Manual testing or Burp Suite recommended for full SPA coverage."
                    ),
                    remediation=(
                        "Continue sanitising all user input and encoding output. "
                        "Implement a strict Content-Security-Policy header."
                    )
                )

        except httpx.RequestError as e:
            return ScanResult(
                vulnerability_name="Reflected XSS",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"SCAN SKIPPED — could not reach target: {str(e)[:80]}",
                remediation="Ensure the target URL is publicly accessible."
            )

    async def _test_url_params(
        self, client: httpx.AsyncClient, url: str
    ) -> dict | None:
        parsed = urlparse(url)
        params = parse_qs(parsed.query)

        if not params:
            return None

        for param_name in params:
            injected_params = {k: v[0] for k, v in params.items()}
            injected_params[param_name] = XSS_PAYLOAD
            new_query  = urlencode(injected_params)
            injected_url = urlunparse(parsed._replace(query=new_query))

            try:
                resp = await client.get(injected_url)
                hit  = self._check_response(resp.text)
                if hit:
                    return {
                        "location": f"URL parameter '{param_name}'",
                        "evidence": f"GET {injected_url}",
                        "encoded":  hit == "encoded",
                    }
            except httpx.RequestError:
                continue

        return None

    async def _test_form(
        self, client: httpx.AsyncClient, base_url: str, form
    ) -> dict | None:
        action   = form.get("action", "")
        method   = form.get("method", "get").lower()
        form_url = urljoin(base_url, action) if action else base_url
        inputs   = form.find_all(["input", "textarea"])

        data = {}
        for inp in inputs:
            input_type = inp.get("type", "").lower()
            name = inp.get("name")
            if not name:
                continue
            if input_type == "hidden":
                data[name] = inp.get("value", "")
            elif input_type in ("submit", "button", "image", "reset", "checkbox", "radio"):
                continue
            elif input_type in INJECTABLE_TYPES:
                data[name] = XSS_PAYLOAD

        if not data:
            return None

        try:
            if method == "post":
                resp = await client.post(form_url, data=data)
            else:
                resp = await client.get(form_url, params=data)

            hit = self._check_response(resp.text)
            if hit:
                return {
                    "location": f"form input at {form_url}",
                    "evidence": f"{method.upper()} {form_url}",
                    "encoded":  hit == "encoded",
                }
        except httpx.RequestError:
            pass

        return None

    def _check_response(self, response_text: str) -> str | None:
        if XSS_PAYLOAD in response_text:
            return "reflected"
        if XSS_ENCODED in response_text.lower():
            return "encoded"
        return None

    def _build_fail_result(self, finding: dict) -> ScanResult:
        return ScanResult(
            vulnerability_name="Reflected XSS",
            passed=False,
            severity=SeverityLevel.HIGH,
            description=(
                f"Reflected XSS confirmed at {finding['location']}. "
                f"The payload '{XSS_PAYLOAD}' was reflected back unescaped in the response. "
                f"Evidence: {finding['evidence']}. "
                f"This means any script injected via this input will execute in the victim's browser."
            ),
            remediation=(
                "Sanitise all user input server-side and encode all output before rendering. "
                "Use context-aware encoding: HTML encode <, >, &, \", ' in HTML context. "
                "Implement a strict Content-Security-Policy header to block inline script execution. "
                "Use a templating engine that auto-escapes output (e.g. Jinja2 with autoescaping ON). "
                "OWASP Reference: A05:2025 — Injection."
            )
        )