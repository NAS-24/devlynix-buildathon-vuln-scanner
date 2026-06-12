from abc import ABC, abstractmethod
from models.scan_result import ScanResult

class BaseScanner(ABC):
    """
    The rigid contract for all vulnerability modules.
    Every new scanner built in Phase 2 & 3 must inherit from this class.
    """
    
    @abstractmethod
    async def scan(self, target_url: str) -> ScanResult:
        """
        Executes the specific vulnerability check.
        Must return a validated ScanResult Pydantic object.
        """
        pass