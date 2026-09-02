const LiveClass = require('../models/LiveClass');
const { checkClassAccess } = require('../middleware/classAccessMiddleware');
const { clearLiveClassSessions } = require('../services/attentionService');
const { success, error } = require('../utils/apiResponse');

/**
 * POST /api/live-classes/class/:classId/start
 * [teacher, own class] Creates the LiveClass record and broadcasts
 * live:class-started to everyone currently viewing that classroom
 * (anyone who has joined the `class:<classId>` Socket.IO room).
 */
async function startLiveClass(req, res, next) {
  try {
    const { classId } = req.params;

    if (!req.isClassOwner) {
      return error(res, 403, 'Only the class teacher can start a live class');
    }

    const existing = await LiveClass.findOne({ class: classId, status: 'active' });
    if (existing) {
      return error(res, 400, 'A live class is already in progress for this class.');
    }

    const liveClass = await LiveClass.create({
      class: classId,
      startedBy: req.user._id,
    });

    const io = req.app.get('io');
    io.to(`class:${classId}`).emit('live:class-started', {
      liveClassId: liveClass._id,
      classId,
    });

    return success(res, 201, 'Live class started', { liveClass });
  } catch (err) {
    if (err.code === 11000) {
      return error(res, 400, 'A live class is already in progress for this class.');
    }
    next(err);
  }
}

/**
 * POST /api/live-classes/:liveClassId/end
 * [teacher, own class] Ends the session, kicks everyone currently in the
 * WebRTC room, and notifies the classroom page. Socket-side participant
 * tracking cleanup happens in the live-class socket handler in response
 * to this broadcast.
 */
async function endLiveClass(req, res, next) {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId);
    if (!liveClass) {
      return error(res, 404, 'Live class not found');
    }

    const { isOwner } = await checkClassAccess(liveClass.class, req.user);
    if (!isOwner) {
      return error(res, 403, 'Only the class teacher can end this live class');
    }

    if (liveClass.status === 'ended') {
      return error(res, 400, 'This live class has already ended');
    }

    liveClass.status = 'ended';
    liveClass.endTime = new Date();
    await liveClass.save();

    const io = req.app.get('io');
    io.to(`live:${liveClassId}`).emit('live:class-ended', { liveClassId });
    io.to(`class:${liveClass.class}`).emit('live:class-ended', { liveClassId, classId: liveClass.class });
    if (io.liveRooms) io.liveRooms.delete(liveClassId.toString());
    clearLiveClassSessions(liveClassId.toString());

    return success(res, 200, 'Live class ended', { liveClass });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live-classes/:liveClassId
 * [owner or member] Session detail.
 */
async function getLiveClassById(req, res, next) {
  try {
    const { liveClassId } = req.params;

    const liveClass = await LiveClass.findById(liveClassId).populate(
      'class',
      'subjectTitle subjectCode section teacher'
    );
    if (!liveClass) {
      return error(res, 404, 'Live class not found');
    }

    const { isMember } = await checkClassAccess(liveClass.class._id, req.user);
    if (!isMember) {
      return error(res, 403, 'You do not have access to this live class');
    }

    return success(res, 200, 'Live class fetched', { liveClass });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/live-classes/class/:classId/active
 * [owner or member] Returns the currently active session for a class, or
 * null — used by the classroom's Live Class tab to decide whether to show
 * "Start"/"Join"/"nothing running" without polling a list endpoint.
 */
async function getActiveLiveClass(req, res, next) {
  try {
    const { classId } = req.params;

    const liveClass = await LiveClass.findOne({ class: classId, status: 'active' });

    return success(res, 200, 'Active live class fetched', { liveClass: liveClass || null });
  } catch (err) {
    next(err);
  }
}

module.exports = { startLiveClass, endLiveClass, getLiveClassById, getActiveLiveClass };
