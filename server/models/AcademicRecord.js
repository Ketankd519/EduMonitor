const mongoose = require('mongoose');

const academicRecordSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attendanceMarks: { type: Number, default: 0 },
  assignmentMarks: { type: Number, default: 0 },
  internalMarks: { type: Number, default: 0 },
  examMarks: { type: Number, default: 0 },
  incentiveMarks: { type: Number, default: 0 },
  overallMarks: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('AcademicRecord', academicRecordSchema);