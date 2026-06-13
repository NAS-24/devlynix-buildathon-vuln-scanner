import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class HSTSScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for the Strict-Transport-Security header.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                response = await client.get(target_url)
                
                # Check for the HSTS header
                if "strict-transport-security" in response.headers:
                    return ScanResult(
                        vulnerability_name="HTTP Strict Transport Security (HSTS)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="HSTS header is present. The application enforces secure connections.",
                        remediation=None
                    )
                else:
                    # If the site is HTTP, HSTS is effectively missing/invalid anyway
                    return ScanResult(
                        vulnerability_name="HTTP Strict Transport Security (HSTS)",
                        passed=False,
                        severity=SeverityLevel.MEDIUM,
                        description="The HSTS header is missing. The application is vulnerable to SSL stripping and downgrade attacks.",
                        remediation="Ensure your web server includes the 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header."
                    )
                    
        except httpx.RequestError as e:
            return ScanResult(
                vulnerability_name="HTTP Strict Transport Security (HSTS)",
                passed=False,
                severity=SeverityLevel.INFO,
                description=f"Probe failed to reach the target: {str(e)}",
                remediation="Verify the target URL is accessible."
            )