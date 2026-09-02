const mongoose = require('mongoose');

const liveClassSchema = new mongoose.Schema({
  class: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  hostTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  status: { type: String, enum: ['SCHEDULED', 'LIVE', 'ENDED'], default: 'SCHEDULED' },
  startTime: { type: Date },
  endTime: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LiveClass', liveClassSchema);