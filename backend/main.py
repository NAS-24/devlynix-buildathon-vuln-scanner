import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scanners.headers.csp_scanner import CSPScanner
from scanners.headers.hsts_scanner import HSTSScanner
from scanners.headers.x_frame_scanner import XFrameScanner
from scanners.dependencies.cve_scanner import CVEScanner # <-- Import added

app = FastAPI(title="Recon Scanner API")

class ScanRequest(BaseModel):
    target_url: str

@app.post("/api/scan")
async def run_scan(request: ScanRequest):
    if not request.target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    
    # 1. The Routing Switch
    is_github_repo = "github.com" in request.target_url.lower()
    
    # 2. Base Scanners (Run on EVERYTHING)
    scanners_to_run = [
        CSPScanner().scan(request.target_url),
        HSTSScanner().scan(request.target_url),
        XFrameScanner().scan(request.target_url)
    ]
    
    # 3. Conditional Scanners (Run ONLY on Repositories)
    if is_github_repo:
        print("GitHub Repository detected. Queuing Tier 2 OSV.dev sequence...")
        scanners_to_run.append(CVEScanner().scan(request.target_url)) # <-- Integration added
        
    # 4. Fire the Engine
    results = await asyncio.gather(*scanners_to_run)
    
    return {
        "target_type": "repository" if is_github_repo else "website",
        "results": results
    }