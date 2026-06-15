import httpx
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class XFrameScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Probes the target URL for clickjacking protections (X-Frame-Options or CSP frame-ancestors).
        """
        try:
            async with httpx.AsyncClient(
                timeout=10.0, 
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"}
            ) as client:
                response = await client.get(target_url)
                
                # 1. WAF & Anti-Bot Awareness
                if response.status_code in [403, 406, 429, 503]:
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"⚠️ SCAN SKIPPED — WAF or anti-bot mechanism intercepted the request (Status: {response.status_code}).",
                        remediation="Ensure the target URL is publicly accessible or whitelist the scanner's IP."
                    )

                
                content_type = response.headers.get("content-type", "").lower()
                if "text/html" not in content_type:
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"Scan skipped: Clickjacking protection is only required for HTML documents (Found: {content_type or 'Unknown'}).",
                        remediation=None
                    )

               
                csp_header = response.headers.get("content-security-policy", "").lower()
                has_frame_ancestors = "frame-ancestors" in csp_header
                has_xfo = "x-frame-options" in response.headers

                if has_xfo or has_frame_ancestors:
                    defense_type = "CSP 'frame-ancestors'" if has_frame_ancestors else "X-Frame-Options"
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description=f"Protection present ({defense_type}). The application is protected against UI redress attacks.",
                        remediation=None
                    )
                else:
                    return ScanResult(
                        vulnerability_name="X-Frame-Options (Clickjacking)",
                        passed=False,
                        severity=SeverityLevel.MEDIUM,
                        description="No clickjacking protection found (missing both X-Frame-Options and CSP frame-ancestors). The site could be embedded in a malicious iframe.",
                        remediation="Configure your web server to return 'X-Frame-Options: DENY' or 'SAMEORIGIN', or implement CSP 'frame-ancestors'."
                    )
                    
        except Exception as e:
            
            return ScanResult(
                vulnerability_name="X-Frame-Options (Clickjacking)",
                passed=True,
                severity=SeverityLevel.INFO,
                description=f"Scan skipped due to network error: {str(e)[:80]}",
                remediation="Verify the target URL is accessible and stable."
            )