from app.detection.face_mesh import FaceMeshDetector

_detector = FaceMeshDetector()


def analyze_face(image_bgr) -> dict:
    """Returns face presence + head-orientation results for one frame."""
    return _detector.analyze(image_bgr)
