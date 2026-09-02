const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  subjectTitle: { type: String, required: true, trim: true },
  subjectCode: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true },
  classCode: { type: String, required: true, unique: true, uppercase: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);