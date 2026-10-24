const LiveClass = require('../models/LiveClass');
const Class = require('../models/Class');
const ClassMember = require('../models/ClassMember');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const MonitoringSession = require('../models/MonitoringSession');
const { getIO } = require('../services/socketService');

// @desc    Start or resume a live classroom session (Teacher only)
// @route   POST /api/live-classes/start
// @access  Private (Teacher)
exports.startLiveClass = async (req, res, next) => {
  try {
    const { classId, title } = req.body;

    if (!classId) {
      return res.status(400).json({ success: false, message: 'Classroom ID is required.' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to initiate live classes for this classroom.' });
    }

    // Check if an active session exists
    let liveSession = await LiveClass.findOne({ class: classId, status: 'LIVE' });

    if (!liveSession) {
      // Use atomic findOneAndUpdate with upsert to prevent duplicate concurrent creations
      try {
        liveSession = await LiveClass.findOneAndUpdate(
          { class: classId, status: 'LIVE' },
          {
            $setOnInsert: {
              class: classId,
              hostTeacher: req.user._id,
              title: title || `${classDoc.subjectTitle} Live Lecture`,
              status: 'LIVE',
              startTime: new Date()
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (err) {
        // Fallback in case of duplicate key race
        liveSession = await LiveClass.findOne({ class: classId, status: 'LIVE' });
      }
    }

    // Consolidate: if any other older duplicate LIVE sessions exist for this class, mark them ENDED
    await LiveClass.updateMany(
      { class: classId, status: 'LIVE', _id: { $ne: liveSession._id } },
      { $set: { status: 'ENDED', endTime: new Date() } }
    );

    // Notify all participants in this classroom room and enrolled students
    const io = req.app.get('io') || getIO();
    if (io) {
      const roomKey = classId.toString();
      io.to(roomKey).emit('live-class-started', {
        classId: roomKey,
        liveSessionId: liveSession?._id ? liveSession._id.toString() : undefined,
        subjectTitle: classDoc.subjectTitle
      });

      // Broadcast globally to trigger ticker refresh across all active student panels
      io.emit('live-ticker-update', {
        type: 'live-class',
        action: 'started',
        classId: roomKey,
        subjectTitle: classDoc.subjectTitle
      });

      // Targeted notification for enrolled students
      ClassMember.find({ class: classId })
        .select('student')
        .then((members) => {
          members.forEach((m) => {
            io.to(`user:${m.student}`).emit('live-ticker-update', {
              type: 'live-class',
              action: 'started',
              classId: roomKey,
              subjectTitle: classDoc.subjectTitle
            });
          });
        })
        .catch((err) => console.error('Error emitting live-class-started to members:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Live class session active.',
      liveSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active live session for a class
// @route   GET /api/live-classes/active/:classId
// @access  Private
exports.getActiveLiveClass = async (req, res, next) => {
  try {
    const { classId } = req.params;

    // Find any active live sessions for this class (most recent first)
    const activeSessions = await LiveClass.find({ class: classId, status: 'LIVE' })
      .sort({ createdAt: -1 })
      .populate('hostTeacher', 'name email avatar');

    if (!activeSessions || activeSessions.length === 0) {
      return res.status(200).json({
        success: true,
        liveSession: null
      });
    }

    // If duplicate LIVE sessions exist, keep the latest one and close the rest
    if (activeSessions.length > 1) {
      const latest = activeSessions[0];
      const duplicateIds = activeSessions.slice(1).map(s => s._id);
      await LiveClass.updateMany(
        { _id: { $in: duplicateIds } },
        { $set: { status: 'ENDED', endTime: new Date() } }
      );
      return res.status(200).json({
        success: true,
        liveSession: latest
      });
    }

    res.status(200).json({
      success: true,
      liveSession: activeSessions[0]
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all live class sessions (active and past) for a classroom (Teacher only)
// @route   GET /api/live-classes/class/:classId
// @access  Private (Teacher)
exports.getClassLiveSessions = async (req, res, next) => {
  try {
    const { classId } = req.params;

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to access live sessions for this classroom.' });
    }

    const sessions = await LiveClass.find({ class: classId })
      .sort({ createdAt: -1 })
      .populate('hostTeacher', 'name email avatar');

    res.status(200).json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    End a live classroom session (Teacher only)
// @route   POST /api/live-classes/end/:id or /api/live-classes/:id/end
// @access  Private (Teacher)
exports.endLiveClass = async (req, res, next) => {
  try {
    const { id } = req.params;

    // The id parameter could be either a LiveClass._id or a Class._id
    let liveSession = await LiveClass.findById(id);
    let classId;

    if (liveSession) {
      classId = liveSession.class;
      if (liveSession.hostTeacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to terminate this session.' });
      }
    } else {
      // Check if id is a Class id
      const classDoc = await Class.findById(id);
      if (classDoc) {
        classId = classDoc._id;
        if (classDoc.teacher.toString() !== req.user._id.toString()) {
          return res.status(403).json({ success: false, message: 'Not authorized to terminate this session.' });
        }
        liveSession = await LiveClass.findOne({ class: classId, status: 'LIVE' });
      }
    }

    if (!liveSession && !classId) {
      return res.status(404).json({ success: false, message: 'Live class session not found.' });
    }

    const now = new Date();

    // Mark ALL LIVE sessions for this classroom as ENDED in database
    await LiveClass.updateMany(
      { class: classId, status: 'LIVE' },
      { $set: { status: 'ENDED', endTime: now } }
    );

    if (liveSession) {
      liveSession.status = 'ENDED';
      if (!liveSession.endTime) {
        liveSession.endTime = now;
      }
      await liveSession.save();

      // Finalize student monitoring attendance percentages based on total session duration
      if (liveSession.startTime) {
        const totalDurationSeconds = Math.max(1, Math.floor((now.getTime() - new Date(liveSession.startTime).getTime()) / 1000));
        const monitoringSessions = await MonitoringSession.find({ liveClass: liveSession._id });
        for (const ms of monitoringSessions) {
          const presentSec = (ms.attentiveDurationSeconds || 0) + (ms.inattentiveDurationSeconds || 0);
          ms.attendancePercentage = Math.min(100, Math.round((presentSec / totalDurationSeconds) * 100));
          await ms.save();
        }
      }
    }

    // Notify all participants in this classroom room
    const io = req.app.get('io') || getIO();
    if (io && classId) {
      const roomKey = classId.toString();
      io.to(roomKey).emit('session-ended', {
        classId: roomKey,
        liveSessionId: liveSession?._id ? liveSession._id.toString() : undefined,
        message: 'The teacher has ended this session.'
      });

      // Broadcast globally to trigger ticker refresh across all active student panels
      io.emit('live-ticker-update', {
        type: 'live-class',
        action: 'ended',
        classId: roomKey
      });

      // Targeted notification for enrolled students
      ClassMember.find({ class: classId })
        .select('student')
        .then((members) => {
          members.forEach((m) => {
            io.to(`user:${m.student}`).emit('live-ticker-update', {
              type: 'live-class',
              action: 'ended',
              classId: roomKey
            });
          });
        })
        .catch((err) => console.error('Error emitting live-class-ended to members:', err));
    }

    res.status(200).json({
      success: true,
      message: 'Live classroom session ended successfully.',
      liveSession
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active live classes & live assignments for authenticated student
// @route   GET /api/live-classes/live-ticker
// @access  Private (Student)
exports.getStudentLiveTicker = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'STUDENT') {
      return res.status(200).json({
        success: true,
        serverTime: new Date().toISOString(),
        liveItems: []
      });
    }

    const studentId = req.user._id;

    // 1. Get student's enrolled classes
    const memberships = await ClassMember.find({ student: studentId }).select('class');
    const classIds = memberships.map((m) => m.class);

    if (classIds.length === 0) {
      return res.status(200).json({
        success: true,
        serverTime: new Date().toISOString(),
        liveItems: []
      });
    }

    const now = new Date();

    // 2. Fetch active live class sessions for enrolled classes
    const activeSessions = await LiveClass.find({
      class: { $in: classIds },
      status: 'LIVE'
    })
      .populate('class', 'subjectTitle subjectCode section')
      .sort({ createdAt: -1 });

    // Deduplicate in case of duplicate live entries for the same class (keep latest)
    const seenClasses = new Set();
    const liveClassesList = [];
    for (const session of activeSessions) {
      if (!session.class) continue;
      const classIdStr = session.class._id.toString();
      if (!seenClasses.has(classIdStr)) {
        seenClasses.add(classIdStr);
        liveClassesList.push({
          id: `class-${classIdStr}`,
          type: 'live-class',
          text: `${session.class.subjectTitle} class is live`,
          classId: classIdStr,
          sessionId: session._id.toString(),
          subjectTitle: session.class.subjectTitle,
          subjectCode: session.class.subjectCode,
          startTime: session.startTime
        });
      }
    }

    // 3. Fetch currently active assignments
    const activeAssignments = await Assignment.find({
      class: { $in: classIds },
      startDate: { $lte: now },
      $or: [
        { endDate: { $gt: now } },
        { endDate: null },
        { endDate: { $exists: false } }
      ]
    })
      .populate('class', 'subjectTitle subjectCode section')
      .sort({ endDate: 1, createdAt: 1 });

    // Check submission and retake eligibility for each assignment
    const seenAssignments = new Set();
    const eligibleAssignments = [];
    for (const assign of activeAssignments) {
      if (!assign.class) continue;
      const assignIdStr = assign._id.toString();
      if (seenAssignments.has(assignIdStr)) continue;
      seenAssignments.add(assignIdStr);

      const submissions = await Submission.find({
        assignment: assign._id,
        student: studentId
      }).select('_id');

      const attemptCount = submissions.length;

      // If already submitted and retakes are NOT allowed, student cannot take it
      if (attemptCount > 0 && !assign.allowRetake) {
        continue;
      }

      eligibleAssignments.push(assign);
    }

    // Count eligible assignments per class to format titles cleanly
    const assignmentCountsByClass = {};
    for (const assign of eligibleAssignments) {
      const cId = assign.class._id.toString();
      assignmentCountsByClass[cId] = (assignmentCountsByClass[cId] || 0) + 1;
    }

    const liveAssignmentsList = eligibleAssignments.map((assign) => {
      const cId = assign.class._id.toString();
      const hasMultiple = (assignmentCountsByClass[cId] || 0) > 1;
      const subjectTitle = assign.class.subjectTitle;
      const text = hasMultiple
        ? `${subjectTitle} (${assign.title}) assignment is live`
        : `${subjectTitle} assignment is live`;

      return {
        id: `assignment-${assign._id.toString()}`,
        type: 'live-assignment',
        text,
        classId: cId,
        assignmentId: assign._id.toString(),
        subjectTitle,
        title: assign.title,
        startDate: assign.startDate,
        endDate: assign.endDate
      };
    });

    // 4. Deterministic sorting:
    // Sort live classes by subjectTitle, then classId
    liveClassesList.sort((a, b) =>
      a.subjectTitle.localeCompare(b.subjectTitle) || a.classId.localeCompare(b.classId)
    );

    // Sort assignments by subjectTitle, then title, then assignmentId
    liveAssignmentsList.sort((a, b) =>
      a.subjectTitle.localeCompare(b.subjectTitle) ||
      a.title.localeCompare(b.title) ||
      a.assignmentId.localeCompare(b.assignmentId)
    );

    const liveItems = [...liveClassesList, ...liveAssignmentsList];

    res.status(200).json({
      success: true,
      serverTime: now.toISOString(),
      liveItems
    });
  } catch (error) {
    next(error);
  }
};
