const mongoose = require('mongoose');

const stationRequestSchema = new mongoose.Schema({
  requestingStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceStation',
    required: true,
    index: true
  },
  targetStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceStation',
    required: true,
    index: true
  },
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrashReport',
    required: true,
    index: true
  },
  reason: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'denied'],
    default: 'pending',
    index: true
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  respondedAt: Date
}, {
  timestamps: true
});

// Index for querying pending requests
stationRequestSchema.index({ targetStationId: 1, status: 1 });

module.exports = mongoose.model('StationRequest', stationRequestSchema);
