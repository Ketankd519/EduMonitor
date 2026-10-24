const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  title: { type: String, required: true },
  description: { type: String },
  durationMinutes: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  totalMarks: { type: Number, required: true },
  marksPerQuestion: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 },
  allowRetake: { type: Boolean, default: false },
  answersReleased: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);