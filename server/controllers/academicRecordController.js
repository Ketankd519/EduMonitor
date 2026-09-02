const AcademicRecord = require('../models/AcademicRecord');
const ClassMember = require('../models/ClassMember');
const Class = require('../models/Class');

// @desc    Get or initialize academic ledger records for a class
// @route   GET /api/academic-records/class/:classId
// @access  Private
exports.getAcademicRecords = async (req, res, next) => {
  try {
    const { classId } = req.params;

    if (req.user.role === 'TEACHER') {
      const members = await ClassMember.find({ class: classId }).populate('student', 'name email');

      const existingRecords = await AcademicRecord.find({ class: classId });

      // Upsert missing records for enrolled students
      const recordPromises = members.map(async (mem) => {
        let rec = existingRecords.find((r) => r.student.toString() === mem.student._id.toString());
        if (!rec) {
          rec = await AcademicRecord.create({
            class: classId,
            student: mem.student._id
          });
        }
        return {
          _id: rec._id,
          student: mem.student,
          attendanceMarks: rec.attendanceMarks,
          assignmentMarks: rec.assignmentMarks,
          internalMarks: rec.internalMarks,
          examMarks: rec.examMarks,
          incentiveMarks: rec.incentiveMarks,
          overallMarks: rec.overallMarks
        };
      });

      const records = await Promise.all(recordPromises);

      res.status(200).json({
        success: true,
        count: records.length,
        records
      });
    } else {
      let record = await AcademicRecord.findOne({ class: classId, student: req.user._id });
      if (!record) {
        record = await AcademicRecord.create({ class: classId, student: req.user._id });
      }

      res.status(200).json({
        success: true,
        record
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update student academic ledger marks (Teacher only)
// @route   PUT /api/academic-records/:recordId
// @access  Private (Teacher)
exports.updateAcademicRecord = async (req, res, next) => {
  try {
    const { recordId } = req.params;
    const { attendanceMarks, assignmentMarks, internalMarks, examMarks, incentiveMarks } = req.body;

    const record = await AcademicRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' });
    }

    const classDoc = await Class.findById(record.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify grades.' });
    }

    record.attendanceMarks = Number(attendanceMarks) || 0;
    record.assignmentMarks = Number(assignmentMarks) || 0;
    record.internalMarks = Number(internalMarks) || 0;
    record.examMarks = Number(examMarks) || 0;
    record.incentiveMarks = Number(incentiveMarks) || 0;

    // Automatic Overall Mark Ledger Summation
    record.overallMarks =
      record.attendanceMarks +
      record.assignmentMarks +
      record.internalMarks +
      record.examMarks +
      record.incentiveMarks;

    await record.save();

    res.status(200).json({
      success: true,
      message: 'Academic record updated.',
      record
    });
  } catch (error) {
    next(error);
  }
};