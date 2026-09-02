const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  questionText: { type: String, required: true },
  optionA: { type: String, required: true },
  optionB: { type: String, required: true },
  optionC: { type: String, required: true },
  optionD: { type: String, required: true },
  correctOption: { type: String, enum: ['A', 'B', 'C', 'D'], required: true },
  marks: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Question', questionSchema);