from fastapi import APIRouter, HTTPException
from app.models.request_models import FrameAnalysisRequest
from app.models.response_models import FrameAnalysisResponse
from app.utils.image_processing import decode_base64_to_cv2
from app.detection.face_detector import FaceMeshDetector
from app.detection.phone_detector import PhoneDetector
from app.detection.attention_calculator import AttentionCalculator

router = APIRouter(tags=["Frame Analysis"])
face_detector = FaceMeshDetector()
phone_detector = PhoneDetector()
attention_calc = AttentionCalculator(sampling_interval_seconds=1.5)

@router.post("/analyze-frame", response_model=FrameAnalysisResponse)
async def analyze_frame(payload: FrameAnalysisRequest):
    try:
        # Decode frame strictly in RAM
        cv2_frame = decode_base64_to_cv2(payload.image_base64)
        height, width, _ = cv2_frame.shape

        if height == 0 or width == 0:
            raise HTTPException(status_code=400, detail="Invalid frame dimensions received.")

        # 1. MediaPipe Face Mesh & Head Pose
        face_analysis = face_detector.process_frame(cv2_frame)

        # 2. YOLOv8 Mobile Phone Detection
        phone_analysis = phone_detector.detect_phone(cv2_frame)

        # 3. State Classification
        if phone_analysis["phone_detected"]:
            attention_state = "PHONE_DETECTED"
        elif not face_analysis["face_detected"]:
            attention_state = "NOT_ATTENTIVE"
        elif face_analysis["looking_away"]:
            attention_state = "LOOKING_AWAY"
        else:
            attention_state = "ATTENTIVE"

        # 4. Update Temporal Engagement Metrics
        temporal_metrics = attention_calc.update_state(
            session_id=payload.session_id,
            student_id=payload.student_id,
            attention_state=attention_state
        )

        confidence = phone_analysis["confidence"] if phone_analysis["phone_detected"] else face_analysis["confidence"]

        return FrameAnalysisResponse(
            success=True,
            session_id=payload.session_id,
            student_id=payload.student_id,
            face_detected=face_analysis["face_detected"],
            looking_away=face_analysis["looking_away"],
            attention_state=attention_state,
            phone_detected=phone_analysis["phone_detected"],
            phone_boxes=phone_analysis["boxes"],
            pose_angles=face_analysis["angles"],
            metrics=temporal_metrics,
            confidence=confidence,
            message="Temporal attention metrics accumulated successfully."
        )

    except ValueError as val_err:
        raise HTTPException(status_code=400, detail=str(val_err))
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Internal vision pipeline error: {str(err)}")