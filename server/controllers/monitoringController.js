const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const { analyzeFrame: callPythonAnalyze } = require('../services/monitoringClient');
const { classifyFrame } = require('../services/attentionService');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/monitoring/analyze-frame
 * [student] Body: { liveClassId, frame } — frame is a base64 JPEG captured
 * client-side from the student's own video element. Only students are
 * monitored; a teacher calling this is rejected, not silently ignored.
 *
 * The raw frame is forwarded to the Python service and never stored here
 * or anywhere else — only the derived classification result is kept
 * (briefly, in memory) and returned.
 */
async function analyzeFrame(req, res, next) {
  try {
    const { liveClassId, frame } = req.body;

    if (!liveClassId || !frame) {
      return error(res, 400, 'liveClassId and frame are required');
    }

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass || liveClass.status !== 'active') {
      return error(res, 400, 'This live class is not active');
    }

    const membership = await ClassMember.findOne({ class: liveClass.class, student: req.user._id });
    if (!membership) {
      return error(res, 403, 'You are not a member of this class');
    }

    let pythonResult;
    try {
      pythonResult = await callPythonAnalyze(frame);
    } catch (err) {
      // Be explicit that monitoring is unavailable right now rather than
      // fabricating a result — the Python service being down should never
      // silently look like "everything is fine".
      return error(res, 503, 'AI monitoring service is unavailable right now');
    }

    const classification = classifyFrame(liveClassId, req.user._id.toString(), pythonResult);

    // Notify the teacher's live monitoring panel in real time.
    const targetClass = await Class.findById(liveClass.class).select('teacher');
    const io = req.app.get('io');
    if (targetClass) {
      io.to(`user:${targetClass.teacher}`).emit('live:monitoring-status', {
        liveClassId,
        studentId: req.user._id,
        studentName: req.user.fullName,
        status: classification.status,
        faceDetected: pythonResult.face_detected,
        lookingAway: pythonResult.looking_away,
        phoneDetected: pythonResult.phone_detected,
        phoneDetectionAvailable: pythonResult.phone_detection_available,
        phoneAlertCount: classification.phoneAlertCount,
      });
    }

    return success(res, 200, 'Frame analyzed', {
      status: classification.status,
      faceDetected: pythonResult.face_detected,
      lookingAway: pythonResult.looking_away,
      phoneDetected: pythonResult.phone_detected,
      phoneDetectionAvailable: pythonResult.phone_detection_available,
      phoneDetectionNote: pythonResult.phone_detection_note,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { analyzeFrame };
