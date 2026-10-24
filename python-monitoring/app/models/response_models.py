from pydantic import BaseModel
from typing import Optional, Dict, List

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float
    confidence: float

class TemporalMetrics(BaseModel):
    attentive_seconds: float
    inattentive_seconds: float
    total_present_seconds: float
    attention_score: float
    phone_incidents: int

class FrameAnalysisResponse(BaseModel):
    success: bool
    session_id: str
    student_id: str
    face_detected: bool
    looking_away: bool
    attention_state: str  # "ATTENTIVE", "NOT_ATTENTIVE", "LOOKING_AWAY", "PHONE_DETECTED"
    phone_detected: bool
    phone_boxes: Optional[List[BoundingBox]] = None
    pose_angles: Optional[Dict[str, float]] = None
    metrics: TemporalMetrics
    confidence: float
    message: Optional[str] = None