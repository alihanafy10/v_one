const crypto = require('crypto');

// Generate unique report number
const generateReportNumber = () => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `CR-${dateStr}-${random}`;
};

// Hash National ID
const hashNationalId = (nationalId) => {
  const salt = process.env.SALT_SECRET || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(nationalId + salt)
    .digest('hex');
};

// Validate coordinates
const isValidCoordinates = (lat, lng) => {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180
  );
};

// Calculate estimated response time (simplified)
const calculateResponseTime = (distance) => {
  // Assume average speed of 60 km/h in city
  const avgSpeed = 60;
  const timeInMinutes = (distance / avgSpeed) * 60;
  
  // Add buffer time for preparation
  const totalTime = timeInMinutes + 3;
  
  return Math.round(totalTime);
};

// Determine priority based on injuries
const determinePriority = (estimatedInjured) => {
  if (estimatedInjured >= 3) return 'high';
  if (estimatedInjured >= 1) return 'medium';
  return 'low';
};

module.exports = {
  generateReportNumber,
  hashNationalId,
  isValidCoordinates,
  calculateResponseTime,
  determinePriority
};
