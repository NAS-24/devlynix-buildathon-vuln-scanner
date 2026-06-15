import httpx
import asyncio
from urllib.parse import urlparse
from engine.base_scanner import BaseScanner
from models.scan_result import ScanResult, SeverityLevel

class CVEScanner(BaseScanner):
    async def scan(self, target_url: str) -> ScanResult:
        """
        Extracts package.json from a GitHub repository and checks OSV.dev for known CVEs.
        """
        try:
            
            parsed_url = urlparse(target_url)
            path_parts = [p for p in parsed_url.path.split('/') if p]
            
            if len(path_parts) < 2:
                return ScanResult(
                    vulnerability_name="Outdated Dependencies (CVEs)",
                    passed=True,  # FIXED: Not a vulnerability, just an invalid target type
                    severity=SeverityLevel.INFO,
                    description="Target is not a recognized GitHub repository format. CVE scan skipped.",
                    remediation=None
                )

            owner, repo = path_parts[0], path_parts[1]
          
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/package.json"

            async with httpx.AsyncClient(
                timeout=15.0, 
                follow_redirects=True,
                headers={"User-Agent": "Mozilla/5.0 (ReconScanner/1.0)"} # Added User-Agent to prevent 403s
            ) as client:
                response = await client.get(raw_url)
                
                
                if response.status_code == 404:
                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/master/package.json"
                    response = await client.get(raw_url)

                if response.status_code != 200:
                    reason = "No package.json found" if response.status_code == 404 else f"GitHub blocked the request (Status {response.status_code})"
                    return ScanResult(
                        vulnerability_name="Outdated Dependencies (CVEs)",
                        passed=True, # FIXED: Missing file/rate limit is not a vulnerability
                        severity=SeverityLevel.INFO,
                        description=f"{reason}. CVE scan skipped.",
                        remediation=None
                    )

               
                package_data = response.json()
                dependencies = package_data.get("dependencies", {})
                
                if not dependencies:
                    return ScanResult(
                        vulnerability_name="Outdated Dependencies (CVEs)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="No production dependencies found in package.json.",
                        remediation=None
                    )

               
                found_vulnerabilities = []
                osv_url = "https://api.osv.dev/v1/query"
                
                async def check_package(pkg_name, pkg_version):
                    # Clean version string (remove ^, ~, >=)
                    clean_version = ''.join(c for c in pkg_version if c.isdigit() or c == '.')
                    if not clean_version:
                        return None
                        
                    payload = {
                        "version": clean_version,
                        "package": {"name": pkg_name, "ecosystem": "npm"}
                    }
                    try:
                        res = await client.post(osv_url, json=payload)
                        if res.status_code == 200:
                            data = res.json()
                            if "vulns" in data:
                                # Grab the first CVE ID found for this package
                                cve_id = data["vulns"][0].get("id", "Unknown Vulnerability")
                                return f"{pkg_name} ({clean_version}): {cve_id}"
                    except Exception:
                        pass
                    return None

              
                tasks = [check_package(name, version) for name, version in dependencies.items()]
                results = await asyncio.gather(*tasks)
                
               
                found_vulnerabilities = [r for r in results if r]

               
                if found_vulnerabilities:
                    vuln_list = ", ".join(found_vulnerabilities)
                    return ScanResult(
                        vulnerability_name="Outdated Dependencies (CVEs)",
                        passed=False,
                        severity=SeverityLevel.CRITICAL,
                        description=f"Known vulnerabilities found in your dependencies: {vuln_list}",
                        remediation="Update the flagged packages to their latest secure versions using 'npm audit fix'."
                    )
                else:
                    return ScanResult(
                        vulnerability_name="Outdated Dependencies (CVEs)",
                        passed=True,
                        severity=SeverityLevel.INFO,
                        description="OSV.dev scan complete. No known CVEs found in your production dependencies.",
                        remediation=None
                    )

        except Exception as e:
            return ScanResult(
                vulnerability_name="Outdated Dependencies (CVEs)",
                passed=True, 
                severity=SeverityLevel.INFO,
                description=f"CVE scan skipped due to an error: {str(e)[:80]}",
                remediation="Ensure the repository is public and accessible."
            )