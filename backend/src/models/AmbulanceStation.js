const mongoose = require('mongoose');

const ambulanceStationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  stationCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  cityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'City',
    required: true,
    index: true
  },
  areaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Area',
    required: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  contactPhone: {
    type: String,
    required: true
  },
  totalAmbulances: {
    type: Number,
    required: true,
    default: 0
  },
  availableAmbulances: {
    type: Number,
    required: true,
    default: 0
  },
  coverageRadius: {
    type: Number,
    required: true,
    default: 10,
    comment: 'Coverage radius in kilometers'
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

// Indexes
ambulanceStationSchema.index({ cityId: 1, status: 1, availableAmbulances: 1 });
ambulanceStationSchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('AmbulanceStation', ambulanceStationSchema);
