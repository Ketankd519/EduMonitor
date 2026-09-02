from fastapi import APIRouter
from datetime import datetime, timezone

router = APIRouter()


@router.get("/health")
def health_check():
    """
    Basic liveness check for the AI monitoring microservice.
    Node's monitoringClient.js pings this on startup so failures
    are visible immediately rather than surfacing as a mysterious
    500 the first time a live class tries to analyze a frame.
    """
    return {
        "success": True,
        "message": "EduMonitor AI Monitoring service is running",
        "time": datetime.now(timezone.utc).isoformat(),
    }
