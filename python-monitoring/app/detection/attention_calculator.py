import time
from typing import Dict

class AttentionCalculator:
    def __init__(self, sampling_interval_seconds: float = 1.5):
        self.sampling_interval = sampling_interval_seconds
        # In-memory session accumulator: { (session_id, student_id): tracker }
        self.sessions: Dict[str, Dict[str, float]] = {}

    def _get_key(self, session_id: str, student_id: str) -> str:
        return f"{session_id}_{student_id}"

    def update_state(self, session_id: str, student_id: str, attention_state: str) -> Dict[str, float]:
        """
        Updates running durations based on discrete states:
        - ATTENTIVE: Increments attentive time
        - LOOKING_AWAY, NOT_ATTENTIVE, PHONE_DETECTED: Increments inattentive time
        Uses reliable timestamp deltas to prevent double-counting rapid requests (< 0.2s)
        and prevents huge jumps if the user backgrounded the tab or disconnected (> 3.0s).
        """
        key = self._get_key(session_id, student_id)
        now = time.time()

        if key not in self.sessions:
            self.sessions[key] = {
                "attentive_seconds": 0.0,
                "inattentive_seconds": 0.0,
                "phone_incidents": 0,
                "total_present_seconds": 0.0,
                "last_timestamp": now,
                "last_phone_state": False
            }
            elapsed = self.sampling_interval
        else:
            tracker = self.sessions[key]
            raw_elapsed = now - tracker.get("last_timestamp", now)

            # Anti-double-counting: Ignore duplicate/rapid frames received under 0.2s
            if raw_elapsed < 0.2:
                elapsed = 0.0
            # Cap backgrounding / network delay to default sampling interval
            elif raw_elapsed > 3.0:
                elapsed = self.sampling_interval
            else:
                elapsed = raw_elapsed

            tracker["last_timestamp"] = now

        tracker = self.sessions[key]

        if elapsed > 0.0:
            tracker["total_present_seconds"] += elapsed

            if attention_state == "ATTENTIVE":
                tracker["attentive_seconds"] += elapsed
            else:
                tracker["inattentive_seconds"] += elapsed

        # Only increment phone incidents on transition to PHONE_DETECTED
        is_phone = (attention_state == "PHONE_DETECTED")
        if is_phone and not tracker.get("last_phone_state", False):
            tracker["phone_incidents"] += 1
        tracker["last_phone_state"] = is_phone

        # Attention Score formula: (T_attentive / T_total) * 100
        total_time = tracker["total_present_seconds"]
        attention_score = (tracker["attentive_seconds"] / total_time * 100.0) if total_time > 0 else 100.0

        return {
            "attentive_seconds": round(tracker["attentive_seconds"], 1),
            "inattentive_seconds": round(tracker["inattentive_seconds"], 1),
            "total_present_seconds": round(total_time, 1),
            "attention_score": round(attention_score, 1),
            "phone_incidents": tracker["phone_incidents"]
        }

    def reset_session(self, session_id: str, student_id: str):
        key = self._get_key(session_id, student_id)
        if key in self.sessions:
            del self.sessions[key]
