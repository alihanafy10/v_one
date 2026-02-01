// Convert degrees to radians
const toRadians = (degrees) => {
  return degrees * (Math.PI / 180);
};

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
};

// Sort stations by distance from a point
const sortStationsByDistance = (stations, lat, lng) => {
  return stations.map(station => ({
    ...station.toObject(),
    distance: calculateDistance(
      lat,
      lng,
      station.coordinates.lat,
      station.coordinates.lng
    )
  })).sort((a, b) => a.distance - b.distance);
};

module.exports = {
  calculateDistance,
  sortStationsByDistance,
  toRadians
};
