import os
import secrets
import string
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
from dotenv import load_dotenv

# Load variables from .env
load_dotenv()

# Get URI from .env, fallback to localhost if missing
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

# Initialize the async client EXACTLY once
client = AsyncIOMotorClient(MONGO_URI)
db = client.recon
scans_collection = db.scans

def generate_report_id(length=8):
    """Generates a secure, URL-safe alphanumeric ID."""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for i in range(length))

async def save_scan_result(target_url: str, risk_score: int, radar_scores: dict, vulnerabilities: list, user_id: str = None):
    """Saves the completed scan to MongoDB and returns the unique report ID."""
    report_id = generate_report_id()
    
    document = {
        "report_id": report_id,
        "target_url": target_url,
        "timestamp": datetime.now(timezone.utc),
        "risk_score": risk_score,
        "radar_scores": radar_scores,
        "vulnerabilities": vulnerabilities,
        "user_id": user_id 
    }
    
    await scans_collection.insert_one(document)
    return report_id

async def get_scan_result(report_id: str):
    """Fetches a scan by its unique ID (for the shareable link)."""
    document = await scans_collection.find_one({"report_id": report_id}, {"_id": 0})
    return document

async def get_recent_scans_by_user(user_id: str, limit: int = 5):
    """Fetches the N most recent scans for a specific user."""
    cursor = scans_collection.find(
        {"user_id": user_id}, 
        {"_id": 0, "report_id": 1, "target_url": 1, "timestamp": 1}
    ).sort("timestamp", -1).limit(limit)
    
    return await cursor.to_list(length=limit)