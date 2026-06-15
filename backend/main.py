import os
import asyncio
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone
from nanoid import generate
from pydantic import BaseModel
from groq import Groq
from dotenv import load_dotenv
from database import save_scan_result, get_scan_result

# Scanner imports
from scanners.headers.csp_scanner import CSPScanner
from scanners.headers.hsts_scanner import HSTSScanner
from scanners.headers.x_frame_scanner import XFrameScanner
from scanners.dependencies.cve_scanner import CVEScanner
from scanners.injection.xss_scanner import XSSScanner
from scanners.injection.sqli_scanner import SQLiScanner
from scanners.injection.sensitive_file_scanner import SensitiveFileScanner

load_dotenv()

# Initialize Groq client
api_key = os.getenv("GROQ_API_KEY")
if not api_key:
    raise RuntimeError("CRITICAL: GROQ_API_KEY is not set in environment variables.")
groq_client = Groq(api_key=api_key)

app = FastAPI(title="Recon Scanner API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Map for targeted verification
SCANNER_MAP = {
    "Content Security Policy (CSP)": CSPScanner(),
    "HTTP Strict Transport Security (HSTS)": HSTSScanner(),
    "X-Frame-Options (Clickjacking)": XFrameScanner(),
    "Reflected XSS": XSSScanner(),
    "SQL Injection (SQLi)": SQLiScanner(),
    "Sensitive File Exposure": SensitiveFileScanner(),
    "Outdated Dependencies (CVEs)": CVEScanner()
}

SEVERITY_WEIGHTS = {"Critical": 40, "High": 20, "Medium": 10, "Low": 5, "Info": 0}

class ScanRequest(BaseModel):
    target_url: str

def calculate_risk_score(results: list) -> int:
    deductions = sum(SEVERITY_WEIGHTS.get(r.get("severity", "Info"), 0) for r in results if not r.get("passed", True))
    return max(0, 100 - deductions)

async def get_ai_analysis(vuln_name: str, description: str):
    """Fetches concise AI analysis from Groq."""
    try:
        loop = asyncio.get_event_loop()
        completion = await loop.run_in_executor(
            None, 
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{
                    "role": "system", 
                    "content": "You are a concise security analyst. Output only the most important technical fix in under 100 characters. If the risk is a false positive, say 'FALSE_POSITIVE'."
                }, {
                    "role": "user", 
                    "content": f"Vulnerability: {vuln_name}. Description: {description}. Provide a 1-line configuration fix."
                }],
                temperature=0.1 
            )
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"AI Enrichment Error: {e}")
        return "Remediation analysis unavailable."

@app.get("/api/verify")
async def verify_vuln(target_url: str, vuln_name: str):
    """Triggers a targeted re-scan for a specific vulnerability."""
    scanner = SCANNER_MAP.get(vuln_name)
    if not scanner:
        # Fallback if specific scanner map lookup fails
        raise HTTPException(status_code=400, detail=f"No dedicated scanner found for: {vuln_name}")
    
    result = await scanner.scan(target_url)
    return {
        "status": "PASS" if result.passed else "FAIL", 
        "result": result.model_dump()
    }

@app.get("/api/stream-scan")
async def stream_scan(target_url: str):
    async def event_generator():
        try:
            yield f"data: {json.dumps({'status': 'started', 'target': target_url})}\n\n"
            
            scanners = {
                "headers": [CSPScanner(), HSTSScanner(), XFrameScanner()],
                "injection": [XSSScanner(), SQLiScanner()],
                "sensitive": [SensitiveFileScanner()],
                "deps": [CVEScanner()] if "github.com" in target_url else []
            }

            all_results = []

            async def run_and_enrich(scanner):
                res_obj = await scanner.scan(target_url)
                res_dict = res_obj.model_dump()
                if not res_dict.get("passed", True):
                    res_dict["remediation"] = await get_ai_analysis(
                        res_dict.get("vulnerability_name", "Unknown"),
                        res_dict.get("description", "")
                    )
                return res_dict

            for category in ["headers", "injection", "sensitive", "deps"]:
                for scanner in scanners[category]:
                    res = await run_and_enrich(scanner)
                    all_results.append(res)
                    yield f"data: {json.dumps({'status': 'progress', 'result': res})}\n\n"
                    await asyncio.sleep(0.2)

            report_id = await save_scan_result(
                target_url=target_url,
                risk_score=calculate_risk_score(all_results),
                vulnerabilities=all_results,
                user_id="anonymous"
            )
            yield f"data: {json.dumps({'status': 'complete', 'report_id': report_id})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'status': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.get("/api/report/{report_id}")
async def get_report(report_id: str):
    doc = await get_scan_result(report_id)
    if not doc: raise HTTPException(status_code=404, detail="Report not found")
    return doc