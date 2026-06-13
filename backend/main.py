import asyncio
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scanners.headers.csp_scanner import CSPScanner
from scanners.headers.hsts_scanner import HSTSScanner
from scanners.headers.x_frame_scanner import XFrameScanner 

app = FastAPI(title="Recon Scanner API")

class ScanRequest(BaseModel):
    target_url: str

@app.post("/api/scan")
async def run_scan(request: ScanRequest):
    if not request.target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    
    
    csp_probe = CSPScanner()
    hsts_probe = HSTSScanner()
    x_frame_probe = XFrameScanner() 
    
    results = await asyncio.gather(
        csp_probe.scan(request.target_url),
        hsts_probe.scan(request.target_url),
        x_frame_probe.scan(request.target_url) 
    )
    
    return {"results": results}