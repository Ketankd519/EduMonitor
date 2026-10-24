from pydantic import BaseModel, Field
from typing import Optional

class FrameAnalysisRequest(BaseModel):
    session_id: str = Field(..., description="Active Live Classroom Session ID")
    student_id: str = Field(..., description="Student User ID")
    image_base64: str = Field(..., description="Base64 encoded JPEG or PNG camera frame")
    timestamp: Optional[str] = None