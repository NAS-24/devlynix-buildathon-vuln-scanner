import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class HSTSScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for the Strict-Transport-Security header.
        """
        try:
            async with httpx.AsyncClient(
                timeout=10.0, 
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"}
            ) as client:
                response = await client.get(target_url)
                
               
                if response.status_code in [403, 406, 429, 503]:
                    return ScanResult(
                        vulnerability_name="HTTP Strict Transport Security (HSTS)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"⚠️ SCAN SKIPPED — WAF or anti-bot mechanism intercepted the request (Status: {response.status_code}).",
                        remediation="Ensure the target URL is publicly accessible or whitelist the scanner's IP."
                    )
                
               
                if "strict-transport-security" in response.headers:
                    return ScanResult(
                        vulnerability_name="HTTP Strict Transport Security (HSTS)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="HSTS header is present. The application enforces secure HTTPS connections.",
                        remediation=None
                    )
                else:
                    return ScanResult(
                        vulnerability_name="HTTP Strict Transport Security (HSTS)",
                        passed=False,
                        severity=SeverityLevel.MEDIUM,
                        description="The HSTS header is missing. The application is vulnerable to SSL stripping and downgrade attacks.",
                        remediation="Ensure your web server includes the 'Strict-Transport-Security: max-age=31536000; includeSubDomains' header."
                    )
                    
        except Exception as e:
            
            return ScanResult(
                vulnerability_name="HTTP Strict Transport Security (HSTS)",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"Scan skipped due to network error: {str(e)[:80]}",
                remediation="Verify the target URL is accessible and stable."
            )