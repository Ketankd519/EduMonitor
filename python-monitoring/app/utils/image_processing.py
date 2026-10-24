import base64
import cv2
import numpy as np

def decode_base64_to_cv2(image_base64_str: str) -> np.ndarray:
    """
    Decodes an incoming base64-encoded image string into an OpenCV BGR numpy array.
    Guarantees in-memory processing with no physical disk storage.
    """
    try:
        # Strip header if data URI scheme is included (e.g., 'data:image/jpeg;base64,...')
        if ',' in image_base64_str:
            image_base64_str = image_base64_str.split(',')[1]

        image_bytes = base64.b64decode(image_base64_str)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if frame is None:
            raise ValueError("Failed to decode image bytes into valid OpenCV frame.")

        return frame
    except Exception as e:
        raise ValueError(f"Error decoding base64 image: {str(e)}")