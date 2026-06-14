import asyncio
import json
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from nanoid import generate
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from database import save_scan_result, get_scan_result

from scanners.headers.csp_scanner import CSPScanner
from scanners.headers.hsts_scanner import HSTSScanner
from scanners.headers.x_frame_scanner import XFrameScanner

from scanners.dependencies.cve_scanner import CVEScanner

from scanners.injection.xss_scanner import XSSScanner
from scanners.injection.sqli_scanner import SQLiScanner
from scanners.injection.sensitive_file_scanner import SensitiveFileScanner

SEVERITY_WEIGHTS = {
    "Critical": 40,
    "High":     20,
    "Medium":   10,
    "Low":      5,
    "Info":     0,
}

app = FastAPI(title="Recon Scanner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanRequest(BaseModel):
    target_url: str

def calculate_risk_score(results: list) -> int:
    deductions = sum(
        SEVERITY_WEIGHTS.get(r.get("severity", "Info"), 0)
        for r in results
        if not r.get("passed", True)
    )
    return max(0, 100 - deductions)

@app.get("/")
async def health_check():
    return {"status": "Recon API is live", "version": "1.0.0"}

@app.post("/api/scan")
async def run_scan(request: ScanRequest):
    if not request.target_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="URL must start with http:// or https://"
        )

    is_github = "github.com" in request.target_url.lower()

    scanners = [
        CSPScanner().scan(request.target_url),
        HSTSScanner().scan(request.target_url),
        XFrameScanner().scan(request.target_url),
        XSSScanner().scan(request.target_url),
        SQLiScanner().scan(request.target_url),
        SensitiveFileScanner().scan(request.target_url),
    ]

    if is_github:
        scanners.append(CVEScanner().scan(request.target_url))

    raw_results = await asyncio.gather(*scanners, return_exceptions=True)

    serialized = []
    for r in raw_results:
        if isinstance(r, Exception):
            serialized.append({
                "vulnerability_name": "Scanner Error",
                "passed":        True,
                "severity":      "Info",
                "description": f"A scanner failed unexpectedly: {str(r)[:100]}",
                "remediation": "This is an internal error. Please report it."
            })
        else:
            serialized.append(r.model_dump())

    risk_score = calculate_risk_score(serialized)
    radar_scores = {"headers": 20, "injection": 40, "deps": 30, "auth": 90, "tls": 85}

    report_id = await save_scan_result(
        target_url=request.target_url,
        risk_score=risk_score,
        radar_scores=radar_scores,
        vulnerabilities=serialized
    )

    return {
        "scan_id":      generate(size=10),
        "report_id":    report_id,
        "target_url":   request.target_url,
        "target_type":  "repository" if is_github else "website",
        "scanned_at":   datetime.now(timezone.utc).isoformat(),
        "total_checks": len(serialized),
        "risk_score":   risk_score,
        "radar_scores": radar_scores,
        "results":      serialized,
    }
@app.get("/api/report/{report_id}")
async def get_report(report_id: str):
    """Fetches a saved scan report by its ID."""
    document = await get_scan_result(report_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return document


def generate_radar_scores(vulnerabilities: list) -> dict:
    """
    Calculates security scores (0-100) per category based on scan results.
    100 = Perfect security, 0 = High risk.
    """
    # Initialize with perfect scores
    scores = {
        "headers": 100,
        "injection": 100,
        "deps": 100,
        "auth": 100,
        "tls": 100
    }

    # Map your vulnerability names to radar categories
    # Adjust these keys based on what your scanners return
    mapping = {
        "Content Security Policy (CSP)": "headers",
        "HTTP Strict Transport Security (HSTS)": "headers",
        "X-Frame-Options (Clickjacking)": "headers",
        "Reflected XSS": "injection",
        "SQL Injection (SQLi)": "injection",
        "Sensitive File Exposure": "injection", # Or a new category
        "Outdated Dependencies (CVEs)": "deps"
    }

    for vuln in vulnerabilities:
        category = mapping.get(vuln.get("vulnerability_name"), "headers")
        
        # If the check failed, deduct points based on severity
        if not vuln.get("passed", True):
            sev = vuln.get("severity", "Medium").lower()
            deduction = 0
            if sev == "critical": deduction = 40
            elif sev == "high": deduction = 25
            elif sev == "medium": deduction = 15
            elif sev == "low": deduction = 10
            
            # Apply deduction and keep floor at 0
            scores[category] = max(0, scores[category] - deduction)

    return scores

@app.get("/api/stream-scan")
async def stream_scan(target_url: str):
    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'started', 'target': target_url})}\n\n"
            
            # Initialize real scanners
            scanners = {
                "headers": [CSPScanner(), HSTSScanner(), XFrameScanner()],
                "injection": [XSSScanner(), SQLiScanner()],
                "sensitive": [SensitiveFileScanner()],
                "deps": [CVEScanner()] # Note: Only run if github.com is in URL
            }

            all_results = []

            # Run Headers
            for scanner in scanners["headers"]:
                res = await scanner.scan(target_url)
                all_results.append(res.model_dump())
                yield f"data: {json.dumps({'status': 'progress', 'result': res.model_dump()})}\n\n"
                await asyncio.sleep(0.5)

            # Run Injection
            for scanner in scanners["injection"]:
                res = await scanner.scan(target_url)
                all_results.append(res.model_dump())
                yield f"data: {json.dumps({'status': 'progress', 'result': res.model_dump()})}\n\n"
                await asyncio.sleep(0.5)

            # Run Sensitive
            for scanner in scanners["sensitive"]:
                res = await scanner.scan(target_url)
                all_results.append(res.model_dump())
                yield f"data: {json.dumps({'status': 'progress', 'result': res.model_dump()})}\n\n"

            # Finalize
            risk_score = calculate_risk_score(all_results)
            radar_scores = generate_radar_scores(all_results)
            
            report_id = await save_scan_result(
                target_url=target_url,
                risk_score=risk_score,
                radar_scores=radar_scores,
                vulnerabilities=all_results,
                user_id="anonymous"
            )

            yield f"data: {json.dumps({'status': 'complete', 'report_id': report_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")