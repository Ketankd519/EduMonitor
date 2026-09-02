from pydantic import BaseModel
from typing import Optional


class AnalyzeFrameRequest(BaseModel):
    frame: str  # base64 JPEG, optionally with a data: URL prefix


class AnalyzeFrameResponse(BaseModel):
    face_detected: bool
    looking_away: Optional[bool] = None
    yaw_degrees: Optional[float] = None
    face_confidence: float

    phone_detection_available: bool
    phone_detected: bool
    phone_confidence: float
    phone_detection_note: Optional[str] = None
