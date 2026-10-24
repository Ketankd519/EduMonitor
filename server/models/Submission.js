const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  answers: [{
    question: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: String, enum: ['A', 'B', 'C', 'D'] },
    isCorrect: { type: Boolean }
  }],
  score: { type: Number, required: true },
  percentage: { type: Number, required: true },
  maxMarks: { type: Number, default: 0 },
  attemptNumber: { type: Number, default: 1 },
  correctCount: { type: Number, default: 0 },
  incorrectCount: { type: Number, default: 0 },
  unansweredCount: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

submissionSchema.index({ assignment: 1, student: 1, attemptNumber: 1 }, { unique: true });

module.exports = mongoose.model('Submission', submissionSchema);