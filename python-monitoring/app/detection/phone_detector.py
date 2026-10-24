import torch
import functools
import numpy as np

# Patch torch.load to set weights_only=False for trusted local Ultralytics models (PyTorch 2.6+)
_original_torch_load = torch.load

@functools.wraps(_original_torch_load)
def _patched_torch_load(*args, **kwargs):
    if "weights_only" not in kwargs:
        kwargs["weights_only"] = False
    return _original_torch_load(*args, **kwargs)

torch.load = _patched_torch_load

from ultralytics import YOLO


class PhoneDetector:
    def __init__(self, model_weight: str = "yolov8n.pt", confidence_threshold: float = 0.50):
        """
        Initializes the YOLOv8 model for cell phone detection.
        COCO Dataset Class Index 67 corresponds to 'cell phone'.
        """
        self.conf_threshold = confidence_threshold
        self.model = YOLO(model_weight)
        self.target_class_id = 67  # COCO index for 'cell phone'

    def detect_phone(self, frame_bgr: np.ndarray):
        """
        Runs object inference on an OpenCV BGR frame.
        Returns:
            phone_detected (bool)
            confidence (float)
            boxes (list of dicts containing coordinates)
        """
        results = self.model.predict(
            source=frame_bgr,
            conf=self.conf_threshold,
            classes=[self.target_class_id],
            verbose=False
        )

        phone_detected = False
        max_confidence = 0.0
        detected_boxes = []

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0].item())
                conf = float(box.conf[0].item())

                if cls_id == self.target_class_id and conf >= self.conf_threshold:
                    phone_detected = True
                    if conf > max_confidence:
                        max_confidence = conf

                    coords = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
                    detected_boxes.append({
                        "x1": round(coords[0], 1),
                        "y1": round(coords[1], 1),
                        "x2": round(coords[2], 1),
                        "y2": round(coords[3], 1),
                        "confidence": round(conf, 2)
                    })

        return {
            "phone_detected": phone_detected,
            "confidence": round(max_confidence, 2) if phone_detected else 0.0,
            "boxes": detected_boxes
        }