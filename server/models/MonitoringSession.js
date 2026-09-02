const mongoose = require('mongoose');

const monitoringSessionSchema = new mongoose.Schema({
  liveClass: { type: mongoose.Schema.Types.ObjectId, ref: 'LiveClass', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  attentiveDurationSeconds: { type: Number, default: 0 },
  inattentiveDurationSeconds: { type: Number, default: 0 },
  phoneDetectedCount: { type: Number, default: 0 },
  attendancePercentage: { type: Number, default: 0 },
  attentionPercentage: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MonitoringSession', monitoringSessionSchema);