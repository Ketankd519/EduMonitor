const MonitoringSession = require('../models/MonitoringSession');
const MonitoringEvent = require('../models/MonitoringEvent');
const LiveClass = require('../models/LiveClass');
const Attendance = require('../models/Attendance');
const Submission = require('../models/Submission');
const AcademicRecord = require('../models/AcademicRecord');
const ClassMember = require('../models/ClassMember');
const { getIO } = require('../services/socketService');

// @desc    Log a detected monitoring event and sync temporal metrics
// @route   POST /api/monitoring/event
// @access  Private
exports.logMonitoringEvent = async (req, res, next) => {
  try {
    const { liveClassId, eventType, confidence, metrics } = req.body;
    const studentId = req.user._id;

    if (!liveClassId || !eventType) {
      return res.status(400).json({ success: false, message: 'Live class ID and event type are required.' });
    }

    let session = await MonitoringSession.findOne({
      liveClass: liveClassId,
      student: studentId
    });

    if (!session) {
      session = await MonitoringSession.create({
        liveClass: liveClassId,
        student: studentId
      });
    }

    const event = await MonitoringEvent.create({
      monitoringSession: session._id,
      eventType,
      confidence: confidence || 1.0
    });

    if (metrics) {
      session.attentiveDurationSeconds = metrics.attentive_seconds ?? session.attentiveDurationSeconds;
      session.inattentiveDurationSeconds = metrics.inattentive_seconds ?? session.inattentiveDurationSeconds;
      session.attentionPercentage = metrics.attention_score ?? session.attentionPercentage;
      session.phoneDetectedCount = metrics.phone_incidents ?? session.phoneDetectedCount;

      const liveClass = await LiveClass.findById(liveClassId);
      if (liveClass && liveClass.startTime) {
        const sessionElapsedSeconds = Math.max(1, Math.floor((Date.now() - new Date(liveClass.startTime).getTime()) / 1000));
        const presentSeconds = session.attentiveDurationSeconds + session.inattentiveDurationSeconds;
        session.attendancePercentage = Math.min(100, Math.round((presentSeconds / sessionElapsedSeconds) * 100));
      }

      await session.save();

      const io = req.app.get('io') || getIO();
      if (io && liveClass) {
        io.to(liveClass.class.toString()).emit('student-monitoring-update', {
          studentId: studentId.toString(),
          studentName: req.user.name,
          eventType,
          metrics,
          session
        });
      }
    }

    res.status(201).json({ success: true, event, session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all student monitoring sessions for a live lecture (Teacher View)
// @route   GET /api/monitoring/live/:liveClassId
// @access  Private (Teacher)
exports.getLiveClassMonitoring = async (req, res, next) => {
  try {
    const { liveClassId } = req.params;

    const sessions = await MonitoringSession.find({ liveClass: liveClassId })
      .populate('student', 'name email avatar')
      .sort({ updatedAt: -1 });

    res.status(200).json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post-session aggregated report for completed live class
// @route   GET /api/monitoring/report/:liveClassId
// @access  Private
exports.getLiveClassReport = async (req, res, next) => {
  try {
    const { liveClassId } = req.params;

    let liveClass = await LiveClass.findById(liveClassId)
      .populate('class', 'subjectTitle subjectCode section')
      .populate('hostTeacher', 'name email');

    // Fallback: check if liveClassId was a classroom ID
    if (!liveClass) {
      liveClass = await LiveClass.findOne({ class: liveClassId })
        .sort({ createdAt: -1 })
        .populate('class', 'subjectTitle subjectCode section')
        .populate('hostTeacher', 'name email');
    }

    if (!liveClass) {
      return res.status(404).json({ success: false, message: 'Live class session not found.' });
    }

    const targetSessionId = liveClass._id;

    const sessions = await MonitoringSession.find({ liveClass: targetSessionId })
      .populate('student', 'name email');

    // Authoritative calculation of Total Class Duration in seconds
    let totalDurationSeconds = 0;
    if (liveClass.startTime) {
      const endTimestamp = liveClass.endTime
        ? new Date(liveClass.endTime).getTime()
        : (liveClass.status === 'LIVE' ? Date.now() : new Date(liveClass.updatedAt).getTime());
      totalDurationSeconds = Math.max(0, Math.floor((endTimestamp - new Date(liveClass.startTime).getTime()) / 1000));
    }

    // Finalize session attendance percentage if duration is known
    if (totalDurationSeconds > 0) {
      sessions.forEach(s => {
        const presentSec = (s.attentiveDurationSeconds || 0) + (s.inattentiveDurationSeconds || 0);
        if (presentSec > 0) {
          s.attendancePercentage = Math.min(100, Math.round((presentSec / totalDurationSeconds) * 100));
        }
      });
    }

    const totalStudents = sessions.length;
    const avgAttendance = totalStudents > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.attendancePercentage || 0), 0) / totalStudents)
      : 100;

    const avgAttention = totalStudents > 0
      ? Math.round(sessions.reduce((acc, s) => acc + (s.attentionPercentage || 0), 0) / totalStudents)
      : 100;

    const totalPhoneAlerts = sessions.reduce((acc, s) => acc + (s.phoneDetectedCount || 0), 0);

    res.status(200).json({
      success: true,
      liveClass,
      totalDurationSeconds,
      summary: {
        totalDurationSeconds,
        totalStudents,
        avgAttendance,
        avgAttention,
        totalPhoneAlerts
      },
      sessions
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get holistic student progress analytics
// @route   GET /api/monitoring/student/progress
// @access  Private (Student)
exports.getStudentProgressAnalytics = async (req, res, next) => {
  try {
    const studentId = req.user._id;

    const memberships = await ClassMember.find({ student: studentId }).select('class');
    const classIds = memberships.map((m) => m.class);

    // Attendance Calculation
    const totalAttendance = await Attendance.countDocuments({ student: studentId });
    const presentAttendance = await Attendance.countDocuments({ student: studentId, status: 'PRESENT' });
    const attendanceScore = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 100;

    // Attention Calculation across past live sessions
    const monitoringSessions = await MonitoringSession.find({ student: studentId });
    const attentionScore = monitoringSessions.length > 0
      ? Math.round(monitoringSessions.reduce((acc, s) => acc + s.attentionPercentage, 0) / monitoringSessions.length)
      : 100;

    // MCQ Assignment Average
    const submissions = await Submission.find({ student: studentId }).select('percentage');
    const assignmentScore = submissions.length > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.percentage, 0) / submissions.length)
      : 0;

    // Academic Record Marks
    const records = await AcademicRecord.find({ student: studentId });
    const academicScore = records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.overallMarks, 0) / records.length)
      : 0;

    res.status(200).json({
      success: true,
      analytics: {
        attendanceScore,
        attentionScore,
        assignmentScore,
        academicScore,
        totalClassesJoined: classIds.length,
        totalSessionsMonitored: monitoringSessions.length,
        totalAssignmentsSubmitted: submissions.length
      }
    });
  } catch (error) {
    next(error);
  }
};