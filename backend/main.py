import asyncio
from datetime import datetime, timezone
from nanoid import generate
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Tier 1 — Headers
from scanners.headers.csp_scanner       import CSPScanner
from scanners.headers.hsts_scanner      import HSTSScanner
from scanners.headers.x_frame_scanner   import XFrameScanner

# Tier 2 — Supply Chain
from scanners.dependencies.cve_scanner  import CVEScanner

# Tier 2 — Injection & Exposure
from scanners.injection.xss_scanner             import XSSScanner
from scanners.injection.sqli_scanner            import SQLiScanner
from scanners.injection.sensitive_file_scanner  import SensitiveFileScanner

# Severity weights for risk score calculation
SEVERITY_WEIGHTS = {
    "Critical": 40,
    "High":     20,
    "Medium":   10,
    "Low":       5,
    "Info":      0,
}

app = FastAPI(title="Recon Scanner API", version="1.0.0")

# ── CORS ──────────────────────────────────────────────────────────
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

    # ── Input validation ──────────────────────────────────────────
    if not request.target_url.startswith(("http://", "https://")):
        raise HTTPException(
            status_code=400,
            detail="URL must start with http:// or https://"
        )

    # ── Routing switch ────────────────────────────────────────────
    is_github = "github.com" in request.target_url.lower()

    # ── Build scanner list ────────────────────────────────────────
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

    # ── Fire all scanners concurrently ────────────────────────────
    raw_results = await asyncio.gather(*scanners, return_exceptions=True)

    # ── Sanitise results ──────────────────────────────────────────
    serialized = []
    for r in raw_results:
        if isinstance(r, Exception):
            serialized.append({
                "vulnerability_name": "Scanner Error",
                "passed":      True,
                "severity":    "Info",
                "description": f"⚠️ A scanner failed unexpectedly: {str(r)[:100]}",
                "remediation": "This is an internal error. Please report it."
            })
        else:
            serialized.append(r.model_dump())

    # ── Build response ────────────────────────────────────────────
    return {
        "scan_id":      generate(size=10),  # kept — frontend needs this for routing
        "target_url":   request.target_url,
        "target_type":  "repository" if is_github else "website",
        "scanned_at":   datetime.now(timezone.utc).isoformat(),
        "total_checks": len(serialized),
        "risk_score":   calculate_risk_score(serialized),
        "results":      serialized,
    }