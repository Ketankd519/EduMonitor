const AcademicRecord = require('../models/AcademicRecord');
const ClassMember = require('../models/ClassMember');
const Class = require('../models/Class');

const MARK_LIMITS = {
  attendanceMarks: { min: 0, max: 10, label: 'Attendance Marks' },
  assignmentMarks: { min: 0, max: 10, label: 'Assignment Marks' },
  internalMarks: { min: 0, max: 20, label: 'Internal Marks' },
  examMarks: { min: 0, max: 60, label: 'Exam Marks' },
  mscMarks: { min: 0, max: 20, label: 'MSC Marks' },
  incentiveMarks: { min: 0, max: 10, label: 'Incentive Marks' }
};

const validateMarks = (data) => {
  const errors = {};
  const sanitized = {};

  for (const [key, rule] of Object.entries(MARK_LIMITS)) {
    const val = data[key];
    if (val === undefined || val === null || val === '') {
      sanitized[key] = 0;
      continue;
    }

    const num = Number(val);
    if (isNaN(num)) {
      errors[key] = `${rule.label} must be a valid number.`;
    } else if (num < rule.min) {
      errors[key] = `${rule.label} cannot be negative (min: ${rule.min}).`;
    } else if (num > rule.max) {
      errors[key] = `${rule.label} cannot exceed ${rule.max}.`;
    } else {
      sanitized[key] = Math.round(num * 100) / 100;
    }
  }

  sanitized.overallMarks = Math.round(
    ((sanitized.attendanceMarks || 0) +
      (sanitized.assignmentMarks || 0) +
      (sanitized.internalMarks || 0) +
      (sanitized.examMarks || 0) +
      (sanitized.mscMarks || 0) +
      (sanitized.incentiveMarks || 0)) * 100
  ) / 100;

  const isValid = Object.keys(errors).length === 0;
  return { isValid, errors, sanitized };
};

// @desc    Get or initialize academic ledger records for a class
// @route   GET /api/academic-records/class/:classId
// @access  Private
exports.getAcademicRecords = async (req, res, next) => {
  try {
    const { classId } = req.params;

    if (req.user.role === 'TEACHER') {
      const classDoc = await Class.findById(classId);
      if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to view records for this classroom.' });
      }

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
          attendanceMarks: rec.attendanceMarks || 0,
          assignmentMarks: rec.assignmentMarks || 0,
          internalMarks: rec.internalMarks || 0,
          examMarks: rec.examMarks || 0,
          mscMarks: rec.mscMarks || 0,
          incentiveMarks: rec.incentiveMarks || 0,
          overallMarks: rec.overallMarks || 0
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
    const record = await AcademicRecord.findById(recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Academic record not found.' });
    }

    const classDoc = await Class.findById(record.class);
    if (!classDoc || classDoc.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify grades.' });
    }

    const { isValid, errors, sanitized } = validateMarks(req.body);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: Object.values(errors).join(' '),
        errors
      });
    }

    Object.assign(record, sanitized);
    await record.save();
    await record.populate('student', 'name email');

    res.status(200).json({
      success: true,
      message: 'Academic record updated.',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk update multiple student academic ledger marks (Teacher only)
// @route   PUT /api/academic-records/bulk
// @access  Private (Teacher)
exports.bulkUpdateAcademicRecords = async (req, res, next) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ success: false, message: 'Records array is required for bulk update.' });
    }

    // Pre-validate all records
    const validatedUpdates = [];
    const recordIds = [];

    for (const item of records) {
      if (!item._id) {
        return res.status(400).json({ success: false, message: 'Each record must have an _id.' });
      }
      const { isValid, errors, sanitized } = validateMarks(item);
      if (!isValid) {
        const studentInfo = item.student?.name ? ` for ${item.student.name}` : '';
        return res.status(400).json({
          success: false,
          message: `Validation failed${studentInfo}: ${Object.values(errors).join(' ')}`,
          recordId: item._id,
          errors
        });
      }
      recordIds.push(item._id);
      validatedUpdates.push({ _id: item._id, sanitized });
    }

    // Fetch existing records and verify teacher owns all classes
    const existingRecords = await AcademicRecord.find({ _id: { $in: recordIds } });
    if (existingRecords.length !== recordIds.length) {
      return res.status(404).json({ success: false, message: 'One or more academic records were not found.' });
    }

    const classIds = [...new Set(existingRecords.map(r => r.class.toString()))];
    const classes = await Class.find({ _id: { $in: classIds } });
    const teacherOwnsAll = classes.every(c => c.teacher.toString() === req.user._id.toString());

    if (!teacherOwnsAll) {
      return res.status(403).json({ success: false, message: 'Not authorized to modify grades for one or more classes.' });
    }

    // Apply updates
    const updatedRecords = [];
    for (const update of validatedUpdates) {
      const rec = existingRecords.find(r => r._id.toString() === update._id.toString());
      if (rec) {
        Object.assign(rec, update.sanitized);
        await rec.save();
        await rec.populate('student', 'name email');
        updatedRecords.push(rec);
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully updated ${updatedRecords.length} academic record(s).`,
      count: updatedRecords.length,
      records: updatedRecords
    });
  } catch (error) {
    next(error);
  }
};

exports.MARK_LIMITS = MARK_LIMITS;
