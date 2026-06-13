import asyncio
import httpx
from urllib.parse import urljoin
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

SENSITIVE_PATHS = [

    {
        "path": "/.env",
        "name": ".env File",
        "severity": SeverityLevel.CRITICAL,
        "why": "Contains database passwords, API keys, and secret tokens in plaintext.",
        "keywords": ["DB_PASSWORD", "SECRET_KEY", "API_KEY", "DATABASE_URL", "APP_KEY"],
    },
    {
        "path": "/.env.local",
        "name": ".env.local File",
        "severity": SeverityLevel.CRITICAL,
        "why": "Local environment override file — often contains developer credentials.",
        "keywords": ["DB_PASSWORD", "SECRET_KEY", "API_KEY"],
    },
    {
        "path": "/.env.production",
        "name": ".env.production File",
        "severity": SeverityLevel.CRITICAL,
        "why": "Production environment file with live service credentials.",
        "keywords": ["DB_PASSWORD", "SECRET_KEY", "API_KEY"],
    },
    {
        "path": "/.git/config",
        "name": ".git/config",
        "severity": SeverityLevel.CRITICAL,
        "why": (
            "Exposed Git config allows full source code reconstruction. "
            "Attackers can clone the entire repository including commit history."
        ),
        "keywords": ["[core]", "[remote", "repositoryformatversion"],
    },
    {
        "path": "/.git/HEAD",
        "name": ".git/HEAD",
        "severity": SeverityLevel.CRITICAL,
        "why": "Confirms Git repository is publicly accessible. Source code extractable.",
        "keywords": ["ref:", "refs/heads"],
    },
    {
        "path": "/config.php",
        "name": "config.php",
        "severity": SeverityLevel.CRITICAL,
        "why": "PHP configuration file often containing database credentials.",
        "keywords": ["DB_HOST", "DB_USER", "DB_PASS", "mysqli", "PDO", "define("],
    },
    {
        "path": "/wp-config.php",
        "name": "wp-config.php",
        "severity": SeverityLevel.CRITICAL,
        "why": "WordPress config with database name, username, password, and auth keys.",
        "keywords": ["DB_NAME", "DB_USER", "DB_PASSWORD", "AUTH_KEY"],
    },

   
    {
        "path": "/admin",
        "name": "Admin Panel",
        "severity": SeverityLevel.HIGH,
        "why": "Publicly accessible admin interface. Brute-force and credential stuffing risk.",
        "keywords": [],
    },
    {
        "path": "/phpinfo.php",
        "name": "phpinfo.php",
        "severity": SeverityLevel.HIGH,
        "why": (
            "Exposes full PHP configuration: server paths, loaded modules, "
            "environment variables, and PHP version vulnerabilities."
        ),
        "keywords": ["PHP Version", "phpinfo()", "php.ini"],
    },
    {
        "path": "/.htpasswd",
        "name": ".htpasswd",
        "severity": SeverityLevel.HIGH,
        "why": "Contains hashed credentials for HTTP Basic Authentication. Crackable offline.",
        "keywords": ["$apr1$", "$2y$", ":{SHA}"],
    },
    {
        "path": "/server-status",
        "name": "Apache Server Status",
        "severity": SeverityLevel.HIGH,
        "why": "Apache diagnostic page exposing active requests, IP addresses, and server uptime.",
        "keywords": ["Apache Server Status", "Server Version", "requests currently being processed"],
    },
    {
        "path": "/debug",
        "name": "Debug Endpoint",
        "severity": SeverityLevel.HIGH,
        "why": "Debug page may expose stack traces, environment variables, or internal routes.",
        "keywords": ["DEBUG", "Traceback", "stack trace"],
    },

    
    {
        "path": "/backup",
        "name": "Backup Directory",
        "severity": SeverityLevel.MEDIUM,
        "why": "Backup directories often contain unprotected copies of source code or databases.",
        "keywords": [],
        "min_content_length": 50,
    },
    {
        "path": "/backup.zip",
        "name": "backup.zip",
        "severity": SeverityLevel.MEDIUM,
        "why": "Downloadable backup archive may contain full application source or database dumps.",
        "keywords": [],
        "min_content_length": 100,
    },
    {
        "path": "/db.sql",
        "name": "db.sql",
        "severity": SeverityLevel.MEDIUM,
        "why": "Exposed SQL dump file. May contain full database schema and user data.",
        "keywords": ["CREATE TABLE", "INSERT INTO", "DROP TABLE"],
    },
    {
        "path": "/config.json",
        "name": "config.json",
        "severity": SeverityLevel.MEDIUM,
        "why": "JSON config file may contain API endpoints, keys, or internal service URLs.",
        "keywords": ["apiKey", "secret", "password", "token"],
    },
    {
        "path": "/robots.txt",
        "name": "robots.txt (Information Disclosure)",
        "severity": SeverityLevel.MEDIUM,
        "why": (
            "robots.txt reveals hidden paths the developer didn't want indexed "
            "— admin panels, API routes, staging areas."
        ),
        "keywords": ["Disallow:", "User-agent:"],
    },
    {
        "path": "/.DS_Store",
        "name": ".DS_Store File",
        "severity": SeverityLevel.MEDIUM,
        "why": (
            "macOS metadata file that reveals the directory structure of the project. "
            "Attackers can reconstruct file paths from it."
        ),
        "keywords": [],
        "min_content_length": 8,
    },


    {
        "path": "/sitemap.xml",
        "name": "Sitemap (Enumeration Risk)",
        "severity": SeverityLevel.LOW,
        "why": "Sitemaps enumerate all public routes. Useful for attackers mapping the attack surface.",
        "keywords": ["<urlset", "<loc>"],
    },
    {
        "path": "/crossdomain.xml",
        "name": "crossdomain.xml",
        "severity": SeverityLevel.LOW,
        "why": "Overly permissive Flash cross-domain policy. Legacy risk.",
        "keywords": ["allow-access-from", "domain=\"*\""],
    },
]

_SEVERITY_ORDER = {
    SeverityLevel.CRITICAL: 4,
    SeverityLevel.HIGH:     3,
    SeverityLevel.MEDIUM:   2,
    SeverityLevel.LOW:      1,
    SeverityLevel.INFO:     0,
}


class SensitiveFileScanner(BaseScanner):

    async def scan(self, target_url: str) -> ScanResult:
        base = target_url.rstrip("/")

        try:
            async with httpx.AsyncClient(
                timeout=8,
                follow_redirects=False,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"},
            ) as client:
                tasks = [
                    self._probe(client, base, path_def)
                    for path_def in SENSITIVE_PATHS
                ]
                results = await asyncio.gather(*tasks)
                all_findings = [r for r in results if r is not None]

        except httpx.RequestError as e:
            return ScanResult(
                vulnerability_name="Sensitive File Exposure",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"⚠️ SCAN SKIPPED — could not reach target: {str(e)[:80]}",
                remediation="Ensure the target URL is publicly accessible."
            )

        if not all_findings:
            return ScanResult(
                vulnerability_name="Sensitive File Exposure",
                passed=True,
                severity=SeverityLevel.INFO,
                description=(
                    f"No sensitive files or directories exposed. "
                    f"Probed {len(SENSITIVE_PATHS)} common paths."
                ),
                remediation="No action required. Continue blocking sensitive paths via your web server config."
            )

        all_findings.sort(key=lambda f: _SEVERITY_ORDER[f["severity"]], reverse=True)
        worst = all_findings[0]

        exposed_summary = "\n".join(
            f"  [{f['severity'].value}] {f['url']} — {f['name']}"
            for f in all_findings
        )

        return ScanResult(
            vulnerability_name="Sensitive File Exposure",
            passed=False,
            severity=worst["severity"],
            description=(
                f"{len(all_findings)} sensitive path(s) publicly accessible. "
                f"Most critical: {worst['name']} at {worst['url']}. "
                f"Reason: {worst['why']}\n\n"
                f"All exposed paths:\n{exposed_summary}"
            ),
            remediation=(
                "Block all sensitive paths at the web server level — never rely on "
                "application-level routing to protect them.\n\n"
                "For nginx: add 'location ~* \\.(env|git|sql|zip)$ { deny all; }' "
                "to your server block.\n"
                "For Apache: add 'Require all denied' inside a <Files> directive.\n"
                "Remove .git directories from production deployments entirely. "
                "Use a .gitignore to prevent committing .env files. "
                "OWASP Reference: A02:2025 — Security Misconfiguration."
            )
        )

    async def _probe(
        self,
        client: httpx.AsyncClient,
        base_url: str,
        path_def: dict
    ) -> dict | None:
        url = urljoin(base_url + "/", path_def["path"].lstrip("/"))

        try:
            resp = await client.get(url)
        except httpx.RequestError:
            return None

        if resp.status_code != 200:
            return None

        min_length = path_def.get("min_content_length", 0)
        if min_length and len(resp.content) < min_length:
            return None

        keywords = path_def.get("keywords", [])
        if keywords:
            body = resp.text
            keyword_hit = any(kw.lower() in body.lower() for kw in keywords)
            if not keyword_hit:
                return None

        return {
            "url":      url,
            "name":     path_def["name"],
            "severity": path_def["severity"],
            "why":      path_def["why"],
            "status":   resp.status_code,
        }