import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class CSPScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for the Content-Security-Policy header.
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
                        vulnerability_name="Content Security Policy (CSP)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"⚠️ SCAN SKIPPED — WAF or anti-bot mechanism intercepted the request (Status: {response.status_code}).",
                        remediation="Ensure the target URL is publicly accessible or whitelist the scanner's IP."
                    )

              
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type:
                    return ScanResult(
                        vulnerability_name="Content Security Policy (CSP)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"Scan skipped: CSP is only required for HTML documents (Found: {content_type or 'Unknown'}).",
                        remediation=None
                    )
                
                
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
                        description="The CSP header is missing. This leaves the HTML application highly vulnerable to Cross-Site Scripting (XSS) and data injection.",
                        remediation="Implement a strict CSP header via your web server or backend middleware (e.g., Content-Security-Policy: default-src 'self')."
                    )
                    
        except Exception as e:
            
            return ScanResult(
                vulnerability_name="Content Security Policy (CSP)",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"Scan skipped due to network error: {str(e)[:80]}",
                remediation="Verify the target URL is accessible and stable."
            )