import cv2
import mediapipe as mp
import numpy as np
from collections import deque

class FaceMeshDetector:
    def __init__(self, min_detection_confidence=0.5, min_tracking_confidence=0.5):
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        )

        # 3D reference model coordinates aligned with OpenCV camera coordinates:
        # +X points right, +Y points down (chin direction), +Z points forward into scene away from camera
        self.model_points_68 = np.array([
            (0.0, 0.0, 0.0),          # Nose tip (Landmark 1)
            (0.0, 330.0, 65.0),       # Chin (Landmark 152)
            (-225.0, -170.0, 135.0),  # Right eye outer (Landmark 33)
            (225.0, -170.0, 135.0),   # Left eye outer (Landmark 263)
            (-150.0, 150.0, 125.0),   # Right mouth corner (Landmark 61)
            (150.0, 150.0, 125.0)     # Left mouth corner (Landmark 291)
        ], dtype=np.float64)

        # Corresponding MediaPipe FaceMesh landmark indices
        self.landmark_indices = [1, 152, 33, 263, 61, 291]

        # Recent angle history for temporal smoothing (prevents noisy single-frame flickers)
        self.angle_history = deque(maxlen=3)

    def process_frame(self, frame_bgr: np.ndarray):
        """
        Processes a single BGR OpenCV frame.
        Returns:
            face_detected (bool)
            looking_away (bool)
            pose_angles (dict: yaw, pitch, roll)
            confidence (float)
        """
        img_h, img_w, _ = frame_bgr.shape
        rgb_frame = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
        results = self.face_mesh.process(rgb_frame)

        if not results.multi_face_landmarks:
            self.angle_history.clear()
            return {
                "face_detected": False,
                "looking_away": False,
                "angles": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0},
                "confidence": 0.0
            }

        face_landmarks = results.multi_face_landmarks[0]

        # Extract 2D image coordinates for the selected 6 landmarks
        image_points = []
        for idx in self.landmark_indices:
            lm = face_landmarks.landmark[idx]
            x, y = int(lm.x * img_w), int(lm.y * img_h)
            image_points.append([x, y])

        image_points = np.array(image_points, dtype=np.float64)

        # Approximate Camera Internals
        focal_length = img_w
        center = (img_w / 2, img_h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1)) # Assuming minimal lens distortion

        # Solve Perspective-n-Point
        success, rotation_vector, translation_vector = cv2.solvePnP(
            self.model_points_68,
            image_points,
            camera_matrix,
            dist_coeffs,
            flags=cv2.SOLVEPNP_ITERATIVE
        )

        if not success:
            return {
                "face_detected": True,
                "looking_away": False,
                "angles": {"yaw": 0.0, "pitch": 0.0, "roll": 0.0},
                "confidence": 0.8
            }

        # Convert rotation vector to Euler Angles
        rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
        proj_matrix = np.hstack((rotation_matrix, translation_vector))
        _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(proj_matrix)

        pitch = float(euler_angles[0][0])
        yaw = float(euler_angles[1][0])
        roll = float(euler_angles[2][0])

        self.angle_history.append((yaw, pitch, roll))

        # Smoothed angles over recent window
        avg_yaw = sum(a[0] for a in self.angle_history) / len(self.angle_history)
        avg_pitch = sum(a[1] for a in self.angle_history) / len(self.angle_history)
        avg_roll = sum(a[2] for a in self.angle_history) / len(self.angle_history)

        # Angular gaze deviation threshold check:
        # |yaw| > 25 deg or |pitch| > 20 deg represents looking away from the monitor
        looking_away = abs(avg_yaw) > 25.0 or abs(avg_pitch) > 20.0

        return {
            "face_detected": True,
            "looking_away": looking_away,
            "angles": {
                "yaw": round(avg_yaw, 2),
                "pitch": round(avg_pitch, 2),
                "roll": round(avg_roll, 2)
            },
            "confidence": 0.95
        }
