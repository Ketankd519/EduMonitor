from fastapi import APIRouter
from datetime import datetime

router = APIRouter(tags=["Health"])

@router.get("/health")
def health_check():
    return {
        "status": "OK",
        "service": "EduMonitor AI Computer Vision Engine",
        "timestamp": datetime.utcnow().isoformat()
    }