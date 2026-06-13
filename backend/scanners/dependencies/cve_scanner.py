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
            # 1. Parse the GitHub URL to build the Raw Content URL
            parsed_url = urlparse(target_url)
            path_parts = [p for p in parsed_url.path.split('/') if p]
            
            if len(path_parts) < 2:
                return ScanResult(
                    vulnerability_name="Outdated Dependencies (CVEs)",
                    passed=False,
                    severity=SeverityLevel.INFO,
                    description="Invalid GitHub repository URL format.",
                    remediation="Provide a valid repository link (e.g., https://github.com/user/repo)."
                )

            owner, repo = path_parts[0], path_parts[1]
            # Try 'main' branch first
            raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/main/package.json"

            async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
                response = await client.get(raw_url)
                
                # Fallback to 'master' branch if 'main' returns 404
                if response.status_code == 404:
                    raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/master/package.json"
                    response = await client.get(raw_url)

                if response.status_code != 200:
                    return ScanResult(
                        vulnerability_name="Outdated Dependencies (CVEs)",
                        passed=False,
                        severity=SeverityLevel.INFO,
                        description="No package.json found on the main or master branch. CVE scan skipped.",
                        remediation=None
                    )

                # 2. Extract Dependencies
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

                # 3. Query Google OSV.dev API concurrently for all packages
                found_vulnerabilities = []
                
                # OSV.dev endpoint
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
                        data = res.json()
                        if "vulns" in data:
                            # Grab the first CVE ID found for this package
                            cve_id = data["vulns"][0].get("id", "Unknown Vulnerability")
                            return f"{pkg_name} ({clean_version}): {cve_id}"
                    except Exception:
                        pass
                    return None

                # Fire all OSV queries at once
                tasks = [check_package(name, version) for name, version in dependencies.items()]
                results = await asyncio.gather(*tasks)
                
                # Filter out None values
                found_vulnerabilities = [r for r in results if r]

                # 4. Return the Contract
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
                passed=False,
                severity=SeverityLevel.INFO,
                description=f"CVE scan failed due to an error: {str(e)}",
                remediation="Ensure the repository is public and accessible."
            )