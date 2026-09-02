import base64
import numpy as np
import cv2


def decode_base64_image(data: str):
    """
    Decodes a base64 JPEG (optionally with a data URL prefix like
    'data:image/jpeg;base64,...') into an OpenCV BGR image array.
    Returns None if decoding fails, rather than raising — callers treat
    an undecodable frame the same as "no face visible" instead of a 500.
    """
    try:
        if "," in data and data.strip().startswith("data:"):
            data = data.split(",", 1)[1]

        raw = base64.b64decode(data)
        arr = np.frombuffer(raw, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        return image
    except Exception:
        return None
