const mongoose = require('mongoose');

const monitoringEventSchema = new mongoose.Schema({
  monitoringSession: { type: mongoose.Schema.Types.ObjectId, ref: 'MonitoringSession', required: true },
  eventType: { 
    type: String, 
    enum: ['FACE_DETECTED', 'FACE_NOT_DETECTED', 'LOOKING_AWAY', 'PHONE_DETECTED', 'CAMERA_OFF'],
    required: true 
  },
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MonitoringEvent', monitoringEventSchema);