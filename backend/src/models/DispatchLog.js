const mongoose = require('mongoose');

const dispatchLogSchema = new mongoose.Schema({
  reportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrashReport',
    required: true,
    index: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceStation',
    index: true
  },
  ambulanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'auto_dispatch',
      'manual_assign',
      'request_backup',
      'station_transfer',
      'mark_false',
      'no_ambulances_available',
      'manual_dispatch_required'
    ],
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('DispatchLog', dispatchLogSchema);
