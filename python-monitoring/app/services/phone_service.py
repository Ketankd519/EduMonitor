from app.detection.yolo_detector import YoloPhoneDetector

_detector = YoloPhoneDetector()


def analyze_phone(image_bgr) -> dict:
    """Returns phone-detection results for one frame, or an 'unavailable' result if YOLO isn't set up."""
    return _detector.detect(image_bgr)


def is_phone_detection_available() -> bool:
    return _detector.available
