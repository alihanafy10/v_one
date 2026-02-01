require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');

const app = express();
const server = http.createServer(app);

// Socket.io only for local development
let io = null;
if (process.env.VERCEL !== '1') {
  const socketIo = require('socket.io');
  const allowedOrigins = [
    'http://localhost:3000',
    'https://v-one-beryl.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  io = socketIo(server, {
    cors: {
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });
  require('./src/socket/socketHandler')(io);
}

// Middleware
app.use(helmet());

// Configure CORS - allow both local and production URLs
const allowedOrigins = [
  'http://localhost:3000',
  'https://v-one-beryl.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('CORS blocked request from origin:', origin);
      callback(null, true); // Allow in production for now, can be strict later
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crash_report_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Make io accessible to routes (will be null in Vercel)
app.set('io', io);

// Routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/reports', require('./src/routes/reports'));
app.use('/api/v1/admin', require('./src/routes/admin'));
app.use('/api/v1/driver', require('./src/routes/driver'));
app.use('/api/v1/files', require('./src/routes/files'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    corsEnabled: true
  });
});

// API health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    corsEnabled: true
  });
});

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Car Crash Reporting & Ambulance Dispatch System API',
    version: '1.0.0',
    status: 'running'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Only start server if not in Vercel environment
if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
      console.log('HTTP server closed');
      mongoose.connection.close(false, () => {
        console.log('MongoDB connection closed');
        process.exit(0);
      });
    });
  });
}

// Export for Vercel serverless
module.exports = app;
