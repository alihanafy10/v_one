const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  country: {
    type: String,
    required: true,
    default: 'Egypt'
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
  bounds: {
    north: { type: Number, required: true },
    south: { type: Number, required: true },
    east: { type: Number, required: true },
    west: { type: Number, required: true }
  }
}, {
  timestamps: true
});

// Geospatial index
citySchema.index({ 'coordinates.lat': 1, 'coordinates.lng': 1 });

module.exports = mongoose.model('City', citySchema);
