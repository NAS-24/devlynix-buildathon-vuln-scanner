import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class XFrameScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for the X-Frame-Options header to detect Clickjacking vulnerabilities.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(target_url)
                
                # Check for the Clickjacking protection header
                if "x-frame-options" in response.headers:
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="X-Frame-Options header is present. The application is protected against UI redress attacks.",
                        remediation=None
                    )
                else:
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=False,
                        severity=SeverityLevel.MEDIUM,
                        description="The X-Frame-Options header is missing. The site could be embedded in a malicious iframe, leading to clickjacking.",
                        remediation="Configure your web server to return 'X-Frame-Options: DENY' or 'SAMEORIGIN'."
                    )
                    
        except httpx.RequestError as e:
            return ScanResult(
                vulnerability_name="X-Frame-Options (Clickjacking)",
                passed=False,
                severity=SeverityLevel.INFO,
                description=f"Probe failed to reach the target: {str(e)}",
                remediation="Verify the target URL is accessible."
            )