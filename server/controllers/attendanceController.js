const Attendance = require('../models/Attendance');
const ClassMember = require('../models/ClassMember');
const Class = require('../models/Class');
const StudentProfile = require('../models/StudentProfile');

// @desc    Mark or update attendance for a class on a specific date (Teacher only)
// @route   POST /api/attendance
// @access  Private (Teacher)
exports.markAttendance = async (req, res, next) => {
  try {
    const { classId, date, records } = req.body; // records = [{ studentId, status: 'PRESENT' | 'ABSENT' | 'LATE' }]

    if (!classId || !date || !records || !records.length) {
      return res.status(400).json({ success: false, message: 'Classroom ID, date, and attendance records array are required.' });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to mark attendance for this classroom.' });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const bulkOps = records.map((rec) => ({
      updateOne: {
        filter: { class: classId, student: rec.studentId, date: attendanceDate },
        update: { $set: { status: rec.status } },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: 'Attendance marked successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all enrolled students in a class as PRESENT for a specific date (Teacher only)
// @route   POST /api/attendance/mark-all-present
// @access  Private (Teacher)
exports.markAllPresent = async (req, res, next) => {
  try {
    const { classId, date } = req.body;

    if (!classId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Classroom ID and date are required.'
      });
    }

    const classDoc = await Class.findById(classId);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to mark attendance for this classroom.'
      });
    }

    const members = await ClassMember.find({ class: classId });
    if (!members.length) {
      return res.status(200).json({
        success: true,
        message: 'No enrolled students to mark present.',
        count: 0
      });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    const bulkOps = members.map((mem) => ({
      updateOne: {
        filter: { class: classId, student: mem.student, date: attendanceDate },
        update: { $set: { status: 'PRESENT' } },
        upsert: true
      }
    }));

    await Attendance.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Marked all ${members.length} enrolled student(s) as Present.`,
      count: members.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get attendance records for a class on a specific date or overall summary
// @route   GET /api/attendance/class/:classId
// @access  Private
exports.getClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (req.user.role === 'TEACHER') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view attendance for this classroom.'
        });
      }

      // Fetch all enrolled students
      const members = await ClassMember.find({ class: classId }).populate('student', 'name email');
      const studentUserIds = members.map((m) => m.student?._id).filter(Boolean);

      const profiles = await StudentProfile.find({ user: { $in: studentUserIds } });
      const profileMap = new Map();
      profiles.forEach((p) => {
        if (p.user) {
          profileMap.set(p.user.toString(), p.rollNumber);
        }
      });

      // Distinct valid attendance sessions for this class
      const distinctSessionDates = await Attendance.distinct('date', { class: classId });
      const totalSessions = distinctSessionDates.length;

      // Aggregated PRESENT counts per student for the selected class
      const mongoose = require('mongoose');
      const classObjId = new mongoose.Types.ObjectId(classId);
      const presentAgg = await Attendance.aggregate([
        { $match: { class: classObjId, status: 'PRESENT' } },
        { $group: { _id: '$student', presentCount: { $sum: 1 } } }
      ]);
      const presentMap = new Map();
      presentAgg.forEach((item) => {
        if (item._id) {
          presentMap.set(item._id.toString(), item.presentCount);
        }
      });

      let dateFilter = {};
      if (date) {
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        dateFilter = { date: queryDate };
      }

      const existingLogs = await Attendance.find({ class: classId, ...dateFilter });

      const attendanceData = members
        .filter((mem) => mem.student)
        .map((mem) => {
          const sId = mem.student._id.toString();
          const log = existingLogs.find((l) => l.student.toString() === sId);
          const rollNumber = profileMap.get(sId) || '—';
          const attended = presentMap.get(sId) || 0;
          const percentage = totalSessions > 0
            ? Math.round((attended / totalSessions) * 1000) / 10
            : 0;

          return {
            student: {
              _id: mem.student._id,
              name: mem.student.name,
              rollNumber
            },
            status: log ? log.status : 'ABSENT',
            attendedSessions: attended,
            totalSessions,
            attendancePercentage: percentage
          };
        });

      return res.status(200).json({
        success: true,
        count: attendanceData.length,
        totalSessions,
        attendance: attendanceData
      });
    } else {
      // Student View: Summarize total sessions and percentage
      const totalSessions = await Attendance.countDocuments({ class: classId, student: req.user._id });
      const presentCount = await Attendance.countDocuments({ class: classId, student: req.user._id, status: 'PRESENT' });
      const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

      const history = await Attendance.find({ class: classId, student: req.user._id }).sort({ date: -1 });

      return res.status(200).json({
        success: true,
        summary: {
          totalSessions,
          presentCount,
          absentCount: totalSessions - presentCount,
          percentage
        },
        history
      });
    }
  } catch (error) {
    next(error);
  }
};