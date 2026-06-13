import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class CSPScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for the Content-Security-Policy header.
        """
        try:
            # We use an async client to prevent blocking the main thread.
            # follow_redirects ensures we hit the final resolved page.
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(target_url)
                
                # Check for the CSP header (httpx headers are case-insensitive)
                if "content-security-policy" in response.headers:
                    return ScanResult(
                        vulnerability_name="Content Security Policy (CSP)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="CSP header is present. The application is actively restricting resource loading.",
                        remediation=None
                    )
                else:
                    return ScanResult(
                        vulnerability_name="Content Security Policy (CSP)",
                        passed=False,
                        severity=SeverityLevel.HIGH,
                        description="The CSP header is missing. This leaves the application highly vulnerable to Cross-Site Scripting (XSS) and data injection.",
                        remediation="Implement a strict CSP header via your web server or backend middleware (e.g., Content-Security-Policy: default-src 'self')."
                    )
                    
        except httpx.RequestError as e:
            # Failsafe: If the URL is dead or unreachable, return a handled response, not a crash.
            return ScanResult(
                vulnerability_name="Content Security Policy (CSP)",
                passed=False,
                severity=SeverityLevel.INFO,
                description=f"Probe failed to reach the target: {str(e)}",
                remediation="Verify the target URL is accessible and includes the correct protocol (http:// or https://)."
            )