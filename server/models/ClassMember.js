const mongoose = require('mongoose');

const classMemberSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

classMemberSchema.index({ class: 1, student: 1 }, { unique: true });

module.exports = mongoose.model('ClassMember', classMemberSchema);