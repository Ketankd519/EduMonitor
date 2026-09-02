import os

# COCO class name for a mobile phone, as used by stock YOLOv8 weights.
PHONE_CLASS_NAME = "cell phone"

DEFAULT_MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "app/models/yolov8n.pt")
DEFAULT_CONFIDENCE = float(os.getenv("PHONE_DETECTION_CONFIDENCE", "0.5"))


class YoloPhoneDetector:
    """
    Wraps an Ultralytics YOLO model for phone detection. Loading is lazy
    and defensive: if `ultralytics` isn't installed, or the weights file
    isn't present at YOLO_MODEL_PATH, `self.available` is False and every
    call to `detect()` reports phone_detected=False with
    detection_available=False — the API layer surfaces this as "phone
    detection unavailable" rather than a false "no phone detected", per
    the project's "do not fake AI" requirement.
    """

    def __init__(self, model_path: str = DEFAULT_MODEL_PATH, confidence: float = DEFAULT_CONFIDENCE):
        self.model_path = model_path
        self.confidence = confidence
        self.available = False
        self._model = None
        self._unavailable_reason = None

        self._try_load()

    def _try_load(self):
        try:
            from ultralytics import YOLO  # imported lazily so the whole
            # service doesn't fail to start if ultralytics/torch aren't
            # installed — only phone detection degrades, per §46.
        except ImportError:
            self._unavailable_reason = (
                "ultralytics is not installed. Run: pip install ultralytics "
                "(see requirements.txt for a CPU-only install tip)."
            )
            return

        if not os.path.isfile(self.model_path):
            self._unavailable_reason = (
                f"YOLO weights not found at '{self.model_path}'. Download yolov8n.pt "
                "(see python-monitoring/README.md) and place it there, or set "
                "YOLO_MODEL_PATH in .env."
            )
            return

        try:
            self._model = YOLO(self.model_path)
            self.available = True
        except Exception as e:
            self._unavailable_reason = f"Failed to load YOLO model: {e}"

    def detect(self, image_bgr) -> dict:
        """
        Returns:
            {
                "detection_available": bool,
                "phone_detected": bool,
                "confidence": float,
                "reason": str | None,   # populated only when unavailable
            }
        """
        if not self.available or image_bgr is None:
            return {
                "detection_available": False,
                "phone_detected": False,
                "confidence": 0.0,
                "reason": self._unavailable_reason,
            }

        results = self._model.predict(image_bgr, verbose=False, conf=self.confidence)

        best_confidence = 0.0
        phone_found = False

        for result in results:
            names = result.names
            for box in result.boxes:
                class_id = int(box.cls[0])
                class_name = names.get(class_id, "")
                conf = float(box.conf[0])
                if class_name == PHONE_CLASS_NAME and conf >= self.confidence:
                    phone_found = True
                    best_confidence = max(best_confidence, conf)

        return {
            "detection_available": True,
            "phone_detected": phone_found,
            "confidence": round(best_confidence, 3),
            "reason": None,
        }
