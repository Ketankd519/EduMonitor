const Attendance = require('../models/Attendance');
const ClassMember = require('../models/ClassMember');
const Class = require('../models/Class');

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

// @desc    Get attendance records for a class on a specific date or overall summary
// @route   GET /api/attendance/class/:classId
// @access  Private
exports.getClassAttendance = async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { date } = req.query;

    if (req.user.role === 'TEACHER') {
      // Fetch all enrolled students
      const members = await ClassMember.find({ class: classId }).populate('student', 'name email');

      let dateFilter = {};
      if (date) {
        const queryDate = new Date(date);
        queryDate.setHours(0, 0, 0, 0);
        dateFilter = { date: queryDate };
      }

      const existingLogs = await Attendance.find({ class: classId, ...dateFilter });

      const attendanceData = members.map((mem) => {
        const log = existingLogs.find((l) => l.student.toString() === mem.student._id.toString());
        return {
          student: mem.student,
          status: log ? log.status : 'ABSENT'
        };
      });

      return res.status(200).json({
        success: true,
        count: attendanceData.length,
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