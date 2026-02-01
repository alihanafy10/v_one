const mongoose = require('mongoose');

const ambulanceSchema = new mongoose.Schema({
  vehicleNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  stationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceStation',
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['available', 'dispatched', 'en_route', 'maintenance', 'offline'],
    default: 'available',
    index: true
  },
  currentLocation: {
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  assignedReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CrashReport',
    index: true
  },
  vehicleType: {
    type: String,
    enum: ['basic', 'advanced', 'icu'],
    default: 'basic'
  },
  equipmentLevel: {
    type: Number,
    min: 1,
    max: 5,
    default: 3
  }
}, {
  timestamps: true
});

// Indexes
ambulanceSchema.index({ stationId: 1, status: 1 });

module.exports = mongoose.model('Ambulance', ambulanceSchema);
