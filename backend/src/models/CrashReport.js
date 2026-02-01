const mongoose = require('mongoose');

const crashReportSchema = new mongoose.Schema({
  reportNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  location: {
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      accuracy: Number
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'City',
      index: true
    },
    areaId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Area'
    },
    cityName: String,
    areaName: String,
    address: String
  },
  verification: {
    method: {
      type: String,
      enum: ['face_id', 'national_id'],
      required: true
    },
    faceImageId: mongoose.Schema.Types.ObjectId,
    nationalIdHash: String,
    verified: {
      type: Boolean,
      default: true
    },
    verifiedAt: Date
  },
  photos: [{
    fileId: String,
    filename: String,
    uploadedAt: Date
  }],
  vehiclesInvolved: {
    type: Number,
    min: 1,
    default: 1
  },
  estimatedInjured: {
    type: Number,
    min: 0,
    default: 0
  },
  description: {
    type: String,
    maxlength: 500
  },
  assignedStationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AmbulanceStation',
    index: true
  },
  assignedAmbulanceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ambulance',
    index: true
  },
  dispatchedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'pending_review', 'dispatched', 'en_route', 'arrived', 'resolved', 'false_report'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  reportedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  acknowledgedAt: Date,
  arrivedAt: Date,
  resolvedAt: Date,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  isFake: {
    type: Boolean,
    default: false
  },
  notes: String
}, {
  timestamps: true
});

// Indexes
crashReportSchema.index({ status: 1, 'location.cityId': 1, reportedAt: -1 });
crashReportSchema.index({ assignedAmbulanceId: 1, status: 1 });

module.exports = mongoose.model('CrashReport', crashReportSchema);
