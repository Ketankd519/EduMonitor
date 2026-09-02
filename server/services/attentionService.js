/**
 * Tracks short-term consecutive-frame state per (liveClass, student) so a
 * single noisy frame (a blink, a brief glance away, one dropped frame)
 * doesn't flip a student's status. This is intentionally ephemeral,
 * in-memory-only state for the duration of a live session — permanent
 * MonitoringEvent/MonitoringSession history and reporting is Phase 10.
 *
 * Rules (§25):
 *   - Face missing for a sustained run of frames -> NOT_ATTENTIVE
 *   - Looking away for a sustained run of frames -> NOT_ATTENTIVE
 *   - Otherwise, if a face is visible and facing the screen -> ATTENTIVE
 */

const sessionState = new Map(); // key: `${liveClassId}:${studentId}` -> state

const NO_FACE_THRESHOLD = 2; // consecutive missed-face frames before flagging
const LOOKING_AWAY_THRESHOLD = 2; // consecutive looking-away frames before flagging

function key(liveClassId, studentId) {
  return `${liveClassId}:${studentId}`;
}

/**
 * Feeds one frame's raw Python classification through the temporal rules
 * and returns the smoothed status for this student in this session.
 */
function classifyFrame(liveClassId, studentId, frameResult) {
  const k = key(liveClassId, studentId);
  const state = sessionState.get(k) || { consecutiveNoFace: 0, consecutiveLookingAway: 0, phoneAlertCount: 0 };

  if (!frameResult.face_detected) {
    state.consecutiveNoFace += 1;
    state.consecutiveLookingAway = 0;
  } else if (frameResult.looking_away) {
    state.consecutiveLookingAway += 1;
    state.consecutiveNoFace = 0;
  } else {
    state.consecutiveNoFace = 0;
    state.consecutiveLookingAway = 0;
  }

  if (frameResult.phone_detected) {
    state.phoneAlertCount += 1;
  }

  let status;
  if (state.consecutiveNoFace >= NO_FACE_THRESHOLD) {
    status = 'NOT_ATTENTIVE';
  } else if (state.consecutiveLookingAway >= LOOKING_AWAY_THRESHOLD) {
    status = 'NOT_ATTENTIVE';
  } else if (!frameResult.face_detected || frameResult.looking_away === null) {
    // Not yet enough consecutive frames to declare NOT_ATTENTIVE, but we
    // also can't honestly say ATTENTIVE this frame.
    status = 'UNKNOWN';
  } else {
    status = 'ATTENTIVE';
  }

  state.lastStatus = status;
  sessionState.set(k, state);

  return {
    status,
    consecutiveNoFace: state.consecutiveNoFace,
    consecutiveLookingAway: state.consecutiveLookingAway,
    phoneAlertCount: state.phoneAlertCount,
  };
}

function clearStudentSession(liveClassId, studentId) {
  sessionState.delete(key(liveClassId, studentId));
}

/** Clears all per-student state for a live class (called when it ends). */
function clearLiveClassSessions(liveClassId) {
  const prefix = `${liveClassId}:`;
  for (const k of sessionState.keys()) {
    if (k.startsWith(prefix)) sessionState.delete(k);
  }
}

module.exports = { classifyFrame, clearStudentSession, clearLiveClassSessions };
