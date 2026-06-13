from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from scanners.headers.csp_scanner import CSPScanner

app = FastAPI(title="Recon Scanner API")

# Define what the frontend will send us
class ScanRequest(BaseModel):
    target_url: str

@app.post("/api/scan")
async def run_scan(request: ScanRequest):
    # Basic validation
    if not request.target_url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL must start with http:// or https://")
    
    # Instantiate the Phase 2 scanner
    csp_probe = CSPScanner()
    
    # Execute the async scan
    result = await csp_probe.scan(request.target_url)
    
    # FastAPI automatically serializes our Pydantic ScanResult to JSON
    return {"results": [result]}