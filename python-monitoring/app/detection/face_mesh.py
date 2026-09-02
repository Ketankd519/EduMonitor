import cv2
import numpy as np
import mediapipe as mp

# Landmark indices (of MediaPipe's 468-point Face Mesh) used for head-pose
# estimation, paired with a generic 3D face model in arbitrary units. This
# is the standard 6-point solvePnP approach for approximate head pose from
# a single 2D image — it estimates orientation, not identity or emotion.
_LANDMARK_IDS = {
    "nose_tip": 1,
    "chin": 152,
    "left_eye_left_corner": 33,
    "right_eye_right_corner": 263,
    "left_mouth_corner": 61,
    "right_mouth_corner": 291,
}

_MODEL_POINTS = np.array(
    [
        (0.0, 0.0, 0.0),  # Nose tip
        (0.0, -330.0, -65.0),  # Chin
        (-225.0, 170.0, -135.0),  # Left eye left corner
        (225.0, 170.0, -135.0),  # Right eye right corner
        (-150.0, -150.0, -125.0),  # Left mouth corner
        (150.0, -150.0, -125.0),  # Right mouth corner
    ],
    dtype=np.float64,
)

# Beyond this yaw angle (degrees), the student is considered to be looking
# away from the screen rather than at it. Tuned to be forgiving of normal
# head movement (checking notes, glancing at a keyboard).
YAW_LOOKING_AWAY_THRESHOLD_DEG = 30.0


class FaceMeshDetector:
    """
    Thin wrapper around MediaPipe's Face Mesh solution. One instance is
    reused across requests (creating a new FaceMesh graph per frame is
    expensive) — FastAPI's single-process model makes this safe as long as
    calls aren't run concurrently from multiple threads on the same
    instance, which they aren't here (see routes/analyze.py).
    """

    def __init__(self):
        self._mp_face_mesh = mp.solutions.face_mesh
        self._detector = self._mp_face_mesh.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=False,
            min_detection_confidence=0.5,
        )

    def analyze(self, image_bgr) -> dict:
        """
        Returns:
            {
                "face_detected": bool,
                "looking_away": bool | None,   # None if face not detected
                "yaw_degrees": float | None,
                "confidence": float,
            }
        """
        if image_bgr is None:
            return {"face_detected": False, "looking_away": None, "yaw_degrees": None, "confidence": 0.0}

        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        results = self._detector.process(image_rgb)

        if not results.multi_face_landmarks:
            return {"face_detected": False, "looking_away": None, "yaw_degrees": None, "confidence": 0.0}

        landmarks = results.multi_face_landmarks[0].landmark
        h, w = image_bgr.shape[:2]

        try:
            image_points = np.array(
                [
                    (landmarks[_LANDMARK_IDS["nose_tip"]].x * w, landmarks[_LANDMARK_IDS["nose_tip"]].y * h),
                    (landmarks[_LANDMARK_IDS["chin"]].x * w, landmarks[_LANDMARK_IDS["chin"]].y * h),
                    (
                        landmarks[_LANDMARK_IDS["left_eye_left_corner"]].x * w,
                        landmarks[_LANDMARK_IDS["left_eye_left_corner"]].y * h,
                    ),
                    (
                        landmarks[_LANDMARK_IDS["right_eye_right_corner"]].x * w,
                        landmarks[_LANDMARK_IDS["right_eye_right_corner"]].y * h,
                    ),
                    (
                        landmarks[_LANDMARK_IDS["left_mouth_corner"]].x * w,
                        landmarks[_LANDMARK_IDS["left_mouth_corner"]].y * h,
                    ),
                    (
                        landmarks[_LANDMARK_IDS["right_mouth_corner"]].x * w,
                        landmarks[_LANDMARK_IDS["right_mouth_corner"]].y * h,
                    ),
                ],
                dtype=np.float64,
            )

            focal_length = w
            center = (w / 2, h / 2)
            camera_matrix = np.array(
                [[focal_length, 0, center[0]], [0, focal_length, center[1]], [0, 0, 1]], dtype=np.float64
            )
            dist_coeffs = np.zeros((4, 1))  # assume no lens distortion

            success, rotation_vector, _translation_vector = cv2.solvePnP(
                _MODEL_POINTS, image_points, camera_matrix, dist_coeffs, flags=cv2.SOLVEPNP_ITERATIVE
            )

            if not success:
                # Landmarks were found but pose couldn't be solved — treat
                # as face-present but orientation unknown, not a failure.
                return {"face_detected": True, "looking_away": None, "yaw_degrees": None, "confidence": 0.7}

            rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
            yaw = _rotation_matrix_to_yaw_degrees(rotation_matrix)

            looking_away = abs(yaw) > YAW_LOOKING_AWAY_THRESHOLD_DEG

            return {
                "face_detected": True,
                "looking_away": looking_away,
                "yaw_degrees": round(float(yaw), 1),
                "confidence": 0.9,
            }
        except Exception:
            # Landmarks were found (face is present) but pose math failed
            # on this particular frame — report presence without a false
            # "looking away" claim.
            return {"face_detected": True, "looking_away": None, "yaw_degrees": None, "confidence": 0.6}


def _rotation_matrix_to_yaw_degrees(rotation_matrix) -> float:
    """Extracts the yaw (left-right head turn) angle from a 3x3 rotation matrix."""
    sy = np.sqrt(rotation_matrix[0, 0] ** 2 + rotation_matrix[1, 0] ** 2)
    singular = sy < 1e-6
    if not singular:
        yaw = np.degrees(np.arctan2(-rotation_matrix[2, 0], sy))
    else:
        yaw = 0.0
    return yaw
