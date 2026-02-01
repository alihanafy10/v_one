const jwt = require('jsonwebtoken');

module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      // Allow anonymous connections for public users
      socket.user = { role: 'anonymous' };
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch (error) {
      return next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}, Role: ${socket.user.role}`);

    // Driver connection
    if (socket.user.role === 'ambulance_driver') {
      socket.join(`driver_${socket.user.userId}`);
      console.log(`Driver ${socket.user.userId} joined their room`);
    }

    // Admin connection
    if (socket.user.role === 'healthcare_admin') {
      socket.join(`admin_${socket.user.userId}`);
      socket.join(`station_${socket.user.stationId}`);
      console.log(`Admin ${socket.user.userId} joined their rooms`);
    }

    // Handle driver location updates
    socket.on('driver_location_update', async (data) => {
      if (socket.user.role !== 'ambulance_driver') return;

      const { ambulanceId, lat, lng } = data;
      
      // Broadcast to admins in the same station
      socket.to(`station_${socket.user.stationId}`).emit('ambulance_moved', {
        ambulanceId,
        lat,
        lng,
        timestamp: new Date()
      });
    });

    // Handle admin pings
    socket.on('admin_connect', (data) => {
      if (socket.user.role === 'healthcare_admin') {
        console.log(`Admin ${socket.user.userId} connected to station ${socket.user.stationId}`);
      }
    });

    // Handle driver pings
    socket.on('driver_connect', (data) => {
      if (socket.user.role === 'ambulance_driver') {
        console.log(`Driver ${socket.user.userId} connected`);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  // Make io available globally for emitting events from routes
  global.io = io;
};
