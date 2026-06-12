from pydantic import BaseModel
from enum import Enum
from typing import Optional

class SeverityLevel(str, Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFO = "Info" # Used when a check passes securely

class ScanResult(BaseModel):
    vulnerability_name: str
    passed: bool
    severity: SeverityLevel
    description: str
    remediation: Optional[str] = None