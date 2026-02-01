# Quick Start Guide for Developers
## Car Crash Reporting & Ambulance Dispatch System

---

## 🚀 Getting Started

This guide provides a quick reference for developers starting implementation of the system.

---

## 📋 Prerequisites

- **Node.js**: v18+ 
- **MongoDB**: v6.0+
- **npm** or **yarn**
- **Git**
- Basic knowledge of React, Node.js, Express, and MongoDB

---

## 🏗️ Project Structure (Recommended)

```
crash-report-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js
│   │   │   ├── jwt.js
│   │   │   └── socket.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── CrashReport.js
│   │   │   ├── Ambulance.js
│   │   │   ├── AmbulanceStation.js
│   │   │   ├── City.js
│   │   │   ├── Area.js
│   │   │   └── DispatchLog.js
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── reportController.js
│   │   │   ├── adminController.js
│   │   │   └── driverController.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── rateLimiter.js
│   │   │   └── errorHandler.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── reports.js
│   │   │   ├── admin.js
│   │   │   └── driver.js
│   │   ├── services/
│   │   │   ├── dispatchService.js
│   │   │   ├── geocodingService.js
│   │   │   ├── faceVerificationService.js
│   │   │   └── notificationService.js
│   │   ├── utils/
│   │   │   ├── distance.js
│   │   │   ├── validation.js
│   │   │   └── helpers.js
│   │   ├── socket/
│   │   │   ├── socketHandler.js
│   │   │   └── events.js
│   │   └── app.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   ├── manifest.json
│   │   └── service-worker.js
│   ├── src/
│   │   ├── components/
│   │   │   ├── user/
│   │   │   │   ├── CrashReportForm.jsx
│   │   │   │   ├── PhotoCapture.jsx
│   │   │   │   ├── FaceIDCapture.jsx
│   │   │   │   └── ConfirmationScreen.jsx
│   │   │   ├── admin/
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── ReportsQueue.jsx
│   │   │   │   ├── FleetManagement.jsx
│   │   │   │   ├── MapView.jsx
│   │   │   │   └── Analytics.jsx
│   │   │   └── driver/
│   │   │       ├── AssignmentView.jsx
│   │   │       ├── NavigationButton.jsx
│   │   │       └── StatusControls.jsx
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ReportCrashPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   └── DriverDashboardPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── socket.js
│   │   │   └── geolocation.js
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   ├── useGeolocation.js
│   │   │   └── useSocket.js
│   │   ├── utils/
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   ├── App.jsx
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── docs/
    ├── README.md
    ├── SYSTEM_ARCHITECTURE.md
    ├── USER_ROLES_AND_FLOWS.md
    ├── DATABASE_SCHEMA.md
    ├── ADMIN_AND_DRIVER_WORKFLOWS.md
    ├── API_SPECIFICATIONS.md
    ├── SECURITY_AND_EDGE_CASES.md
    ├── EDGE_CASES_HANDLING.md
    ├── SEQUENCE_DIAGRAMS_AND_SUMMARY.md
    └── QUICK_START_GUIDE.md
```

---

## 🔧 Backend Setup

### 1. Initialize Project

```bash
mkdir crash-report-system
cd crash-report-system
mkdir backend frontend
cd backend
npm init -y
```

### 2. Install Dependencies

```bash
npm install express mongoose dotenv bcrypt jsonwebtoken
npm install socket.io cors helmet express-validator
npm install multer sharp morgan
npm install --save-dev nodemon
```

### 3. Create .env File

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/crash_report_system
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ENCRYPTION_KEY=your-encryption-key-hex-64-chars
SALT_SECRET=your-salt-secret-for-hashing
```

### 4. Basic Server Setup (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Socket.io
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/v1/auth', require('./src/routes/auth'));
app.use('/api/v1/reports', require('./src/routes/reports'));
app.use('/api/v1/admin', require('./src/routes/admin'));
app.use('/api/v1/driver', require('./src/routes/driver'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 5. Example Model (CrashReport.js)

```javascript
const mongoose = require('mongoose');

const crashReportSchema = new mongoose.Schema({
  reportNumber: {
    type: String,
    required: true,
    unique: true
  },
  location: {
    coordinates: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      accuracy: Number
    },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: 'City' },
    areaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Area' },
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
    verified: Boolean,
    verifiedAt: Date
  },
  photos: [{
    fileId: mongoose.Schema.Types.ObjectId,
    filename: String,
    uploadedAt: Date
  }],
  vehiclesInvolved: Number,
  estimatedInjured: Number,
  description: String,
  assignedStationId: { type: mongoose.Schema.Types.ObjectId, ref: 'AmbulanceStation' },
  assignedAmbulanceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ambulance' },
  dispatchedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'pending_review', 'dispatched', 'en_route', 'arrived', 'resolved', 'false_report'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  reportedAt: { type: Date, default: Date.now },
  acknowledgedAt: Date,
  arrivedAt: Date,
  resolvedAt: Date,
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  isFake: { type: Boolean, default: false },
  notes: String
}, {
  timestamps: true
});

// Indexes
crashReportSchema.index({ reportNumber: 1 });
crashReportSchema.index({ 'location.coordinates.lat': 1, 'location.coordinates.lng': 1 });
crashReportSchema.index({ 'location.cityId': 1 });
crashReportSchema.index({ status: 1 });
crashReportSchema.index({ reportedAt: -1 });
crashReportSchema.index({ status: 1, 'location.cityId': 1, reportedAt: -1 });

module.exports = mongoose.model('CrashReport', crashReportSchema);
```

### 6. Example Route (reports.js)

```javascript
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const CrashReport = require('../models/CrashReport');
const { automaticDispatch } = require('../services/dispatchService');

// POST /api/v1/reports/create
router.post('/create', [
  body('location.coordinates.lat').isFloat({ min: -90, max: 90 }),
  body('location.coordinates.lng').isFloat({ min: -180, max: 180 }),
  body('photos').isArray({ min: 1, max: 5 }),
  body('verification.method').isIn(['face_id', 'national_id'])
], async (req, res) => {
  try {
    // Validate
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    // Generate report number
    const reportNumber = `CR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    // Create report
    const report = new CrashReport({
      reportNumber,
      location: req.body.location,
      verification: req.body.verification,
      photos: req.body.photos,
      vehiclesInvolved: req.body.vehiclesInvolved,
      estimatedInjured: req.body.estimatedInjured,
      description: req.body.description,
      reportedAt: new Date()
    });

    await report.save();

    // Trigger automatic dispatch
    await automaticDispatch(report);

    res.status(201).json({
      success: true,
      reportId: report._id,
      reportNumber: report.reportNumber,
      message: 'Report submitted successfully. Help is on the way.'
    });

  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create report' });
  }
});

module.exports = router;
```

---

## 🎨 Frontend Setup

### 1. Create React App

```bash
cd ../frontend
npx create-react-app .
```

### 2. Install Dependencies

```bash
npm install axios socket.io-client react-router-dom
npm install leaflet react-leaflet
npm install @mui/material @emotion/react @emotion/styled
```

### 3. Create .env File

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
REACT_APP_SOCKET_URL=http://localhost:5000
```

### 4. Example Component (CrashReportForm.jsx)

```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CrashReportForm() {
  const [location, setLocation] = useState(null);
  const [photos, setPhotos] = useState([]);
  const [verificationMethod, setVerificationMethod] = useState('face_id');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy
          });
        },
        (error) => {
          console.error('Geolocation error:', error);
          alert('Please enable location services');
        }
      );
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/reports/create`,
        {
          location: { coordinates: location },
          photos: photos,
          verification: {
            method: verificationMethod,
            // Add face image or national ID
          },
          vehiclesInvolved: 2,
          estimatedInjured: 3,
          description: 'Crash description'
        }
      );

      if (response.data.success) {
        alert(`Report submitted! ID: ${response.data.reportNumber}`);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Report a Car Crash</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <p>Location: {location ? `${location.lat}, ${location.lng}` : 'Getting location...'}</p>
        </div>
        
        {/* Photo capture */}
        <div>
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={(e) => setPhotos([...photos, e.target.files[0]])}
            multiple
          />
        </div>

        {/* Verification method */}
        <div>
          <label>
            <input 
              type="radio" 
              value="face_id" 
              checked={verificationMethod === 'face_id'}
              onChange={(e) => setVerificationMethod(e.target.value)}
            />
            Face ID
          </label>
          <label>
            <input 
              type="radio" 
              value="national_id"
              checked={verificationMethod === 'national_id'}
              onChange={(e) => setVerificationMethod(e.target.value)}
            />
            National ID
          </label>
        </div>

        <button type="submit" disabled={loading || !location}>
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  );
}

export default CrashReportForm;
```

---

## 🔑 Key Implementation Checklist

### Phase 1: Foundation
- [ ] Set up project structure
- [ ] Configure MongoDB connection
- [ ] Create all database models
- [ ] Implement authentication (JWT)
- [ ] Set up basic routes

### Phase 2: Core Features
- [ ] Crash report submission endpoint
- [ ] GPS capture on frontend
- [ ] Photo upload (GridFS)
- [ ] Identity verification
- [ ] Automatic dispatch algorithm

### Phase 3: Admin Features
- [ ] Admin dashboard layout
- [ ] Reports queue display
- [ ] Fleet management interface
- [ ] Manual assignment functionality
- [ ] Map visualization

### Phase 4: Driver Features
- [ ] Driver mobile interface
- [ ] WebSocket notifications
- [ ] Status update controls
- [ ] Navigation integration
- [ ] Backup request

### Phase 5: Advanced Features
- [ ] Inter-station communication
- [ ] Analytics dashboard
- [ ] Real-time location tracking
- [ ] Advanced security measures

### Phase 6: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] Security audit
- [ ] Performance testing
- [ ] Production deployment

---

## 🧪 Testing Examples

### Backend Unit Test (Jest)

```javascript
const { calculateDistance } = require('../utils/distance');

describe('Distance Calculation', () => {
  test('calculates distance between two coordinates', () => {
    const lat1 = 30.0444;
    const lng1 = 31.2357;
    const lat2 = 30.0500;
    const lng2 = 31.2400;
    
    const distance = calculateDistance(lat1, lng1, lat2, lng2);
    
    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(10); // Should be less than 10km
  });
});
```

### Frontend Component Test (React Testing Library)

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import CrashReportForm from './CrashReportForm';

test('renders crash report form', () => {
  render(<CrashReportForm />);
  const heading = screen.getByText(/Report a Car Crash/i);
  expect(heading).toBeInTheDocument();
});
```

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution**: Check MongoDB is running and connection string is correct

### Issue: CORS Error
**Solution**: Add frontend URL to CORS whitelist in backend

### Issue: JWT Token Expired
**Solution**: Implement token refresh mechanism

### Issue: WebSocket Not Connecting
**Solution**: Check Socket.io client/server versions match

### Issue: Large Image Upload Fails
**Solution**: Increase body-parser limit and compress images

---

## 📚 Essential Resources

- **MongoDB Documentation**: https://docs.mongodb.com/
- **Express.js Guide**: https://expressjs.com/
- **React Documentation**: https://react.dev/
- **Socket.io Docs**: https://socket.io/docs/
- **JWT Guide**: https://jwt.io/introduction

---

## 🎯 Next Steps

1. Review all documentation files in the `docs/` folder
2. Set up development environment
3. Create database models following DATABASE_SCHEMA.md
4. Implement authentication system
5. Build crash report submission feature
6. Implement dispatch algorithm
7. Create admin dashboard
8. Build driver interface
9. Add WebSocket real-time features
10. Test thoroughly and deploy

---

**Good luck with implementation! Refer to the detailed documentation files for comprehensive information on each component.**
