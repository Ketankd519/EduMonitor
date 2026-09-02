from fastapi import APIRouter, HTTPException

from app.schemas import AnalyzeFrameRequest, AnalyzeFrameResponse
from app.utils.image_utils import decode_base64_image
from app.services.face_service import analyze_face
from app.services.phone_service import analyze_phone

router = APIRouter()


@router.post("/analyze", response_model=AnalyzeFrameResponse)
def analyze_frame(payload: AnalyzeFrameRequest):
    """
    Analyzes a single browser-captured frame for face presence/orientation
    and phone presence. The frame is decoded in-memory, analyzed, and then
    discarded — it is never written to disk or persisted anywhere, per the
    project's privacy requirements (§47). Node owns all temporal/session
    logic (consecutive-frame thresholds, event persistence); this endpoint
    is a stateless per-frame classifier.
    """
    image = decode_base64_image(payload.frame)

    if image is None:
        raise HTTPException(status_code=400, detail="Could not decode the provided frame")

    face_result = analyze_face(image)
    phone_result = analyze_phone(image)

    return AnalyzeFrameResponse(
        face_detected=face_result["face_detected"],
        looking_away=face_result["looking_away"],
        yaw_degrees=face_result["yaw_degrees"],
        face_confidence=face_result["confidence"],
        phone_detection_available=phone_result["detection_available"],
        phone_detected=phone_result["phone_detected"],
        phone_confidence=phone_result["confidence"],
        phone_detection_note=phone_result["reason"],
    )
