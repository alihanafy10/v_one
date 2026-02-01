# Healthcare Admin & Ambulance Driver Workflows
## Car Crash Reporting & Ambulance Dispatch System

---

## 5. HEALTHCARE ADMIN WORKFLOW

### 5.1 Authentication
**Login Process**:
```
1. Admin navigates to /admin/login
2. Enters username + password
3. Backend validates credentials:
   - Check username exists in users collection
   - Verify passwordHash using bcrypt.compare()
   - Verify role === "healthcare_admin"
   - Verify isActive === true
4. Generate JWT token with payload:
   {
     userId: admin._id,
     username: admin.username,
     role: "healthcare_admin",
     stationId: admin.stationId,
     exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
   }
5. Return token to client
6. Client stores token in localStorage
7. Redirect to admin dashboard
```

**Authorization Middleware**:
```javascript
function requireAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role !== 'healthcare_admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

---

### 5.2 Admin Dashboard Components

#### A. Incoming Reports Queue

**Display Logic**:
```javascript
async function getIncomingReports(adminStationId) {
  // Get admin's station
  const station = await db.ambulanceStations.findById(adminStationId);
  
  // Get all reports in the station's city
  const reports = await db.crashReports.find({
    'location.cityId': station.cityId,
    status: { $in: ['pending', 'dispatched', 'en_route'] },
    isFake: false
  }).sort({ 
    priority: -1,      // High priority first
    reportedAt: -1     // Most recent first
  }).limit(50).toArray();
  
  return reports;
}
```

**UI Components**:
- **Report Card** for each crash:
  - Report number (CR-YYYYMMDD-XXXX)
  - Status badge (pending/dispatched/en_route)
  - Priority indicator (color-coded)
  - Location (city, area, address)
  - Timestamp (time since report)
  - Quick actions (View Details, Assign Ambulance, Mark False)
  
- **Filters**:
  - Status (All, Pending, Dispatched, En Route)
  - Priority (All, High, Medium, Low)
  - Time Range (Last hour, Last 4 hours, Today, All)

---

#### B. Ambulance Fleet Overview

**Display Logic**:
```javascript
async function getFleetStatus(stationId) {
  const ambulances = await db.ambulances.find({
    stationId: stationId
  }).toArray();
  
  // Enrich with driver and report info
  for (const ambulance of ambulances) {
    if (ambulance.driverId) {
      ambulance.driver = await db.users.findOne({
        _id: ambulance.driverId
      }, { projection: { fullName: 1, phone: 1 } });
    }
    
    if (ambulance.assignedReportId) {
      ambulance.assignedReport = await db.crashReports.findOne({
        _id: ambulance.assignedReportId
      }, { projection: { reportNumber: 1, location: 1, status: 1 } });
    }
  }
  
  return {
    total: ambulances.length,
    available: ambulances.filter(a => a.status === 'available').length,
    dispatched: ambulances.filter(a => a.status === 'dispatched').length,
    maintenance: ambulances.filter(a => a.status === 'maintenance').length,
    offline: ambulances.filter(a => a.status === 'offline').length,
    ambulances: ambulances
  };
}
```

**UI Components**:
- **Status Summary Cards**:
  - Total Ambulances: X
  - Available: Y (green)
  - Dispatched: Z (yellow)
  - Maintenance: M (orange)
  - Offline: N (red)

- **Ambulance Grid**:
  - Vehicle number
  - Driver name
  - Status badge
  - Current assignment (if any)
  - Last location update
  - Actions (View, Set Maintenance, Reassign)

---

#### C. Map View

**Features**:
- Station location (blue marker)
- All crash reports in city (red markers)
- Dispatched ambulances (green moving markers)
- Coverage radius circle
- Clickable markers showing details

**Implementation**:
```javascript
// Using Leaflet or Google Maps API
function initializeMap(stationData, reportsData, ambulancesData) {
  const map = L.map('map-container').setView(
    [stationData.coordinates.lat, stationData.coordinates.lng],
    12
  );
  
  // Add station marker
  L.marker([stationData.coordinates.lat, stationData.coordinates.lng], {
    icon: stationIcon
  }).bindPopup(`<b>${stationData.name}</b>`).addTo(map);
  
  // Add coverage radius
  L.circle([stationData.coordinates.lat, stationData.coordinates.lng], {
    radius: stationData.coverageRadius * 1000, // Convert to meters
    color: 'blue',
    fillColor: '#3388ff',
    fillOpacity: 0.1
  }).addTo(map);
  
  // Add crash report markers
  reportsData.forEach(report => {
    L.marker([report.location.coordinates.lat, report.location.coordinates.lng], {
      icon: crashIcon
    }).bindPopup(`
      <b>${report.reportNumber}</b><br>
      Status: ${report.status}<br>
      <a href="/admin/reports/${report._id}">View Details</a>
    `).addTo(map);
  });
  
  // Add ambulance markers (real-time updated)
  ambulancesData.filter(a => a.status === 'dispatched').forEach(ambulance => {
    if (ambulance.currentLocation) {
      const marker = L.marker(
        [ambulance.currentLocation.lat, ambulance.currentLocation.lng],
        { icon: ambulanceIcon }
      ).bindPopup(`
        <b>${ambulance.vehicleNumber}</b><br>
        Driver: ${ambulance.driver.fullName}
      `).addTo(map);
      
      // Store marker reference for real-time updates
      ambulanceMarkers[ambulance._id] = marker;
    }
  });
}
```

---

#### D. Manual Ambulance Assignment

**Process**:
```javascript
async function manualAssignAmbulance(reportId, ambulanceId, adminId) {
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Verify ambulance is available
      const ambulance = await db.ambulances.findOne(
        { _id: ambulanceId },
        { session }
      );
      
      if (ambulance.status !== 'available') {
        throw new Error('Ambulance not available');
      }
      
      // Get crash report
      const crashReport = await db.crashReports.findOne(
        { _id: reportId },
        { session }
      );
      
      // Update ambulance
      await db.ambulances.updateOne(
        { _id: ambulanceId },
        {
          $set: {
            status: 'dispatched',
            assignedReportId: reportId
          }
        },
        { session }
      );
      
      // Update station available count
      await db.ambulanceStations.updateOne(
        { _id: ambulance.stationId },
        { $inc: { availableAmbulances: -1 } },
        { session }
      );
      
      // Update crash report
      await db.crashReports.updateOne(
        { _id: reportId },
        {
          $set: {
            assignedStationId: ambulance.stationId,
            assignedAmbulanceId: ambulanceId,
            status: 'dispatched',
            dispatchedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: 'dispatched',
              timestamp: new Date(),
              updatedBy: adminId
            }
          }
        },
        { session }
      );
      
      // Log dispatch
      await db.dispatchLogs.insertOne({
        reportId: reportId,
        stationId: ambulance.stationId,
        ambulanceId: ambulanceId,
        action: 'manual_assign',
        performedBy: adminId,
        details: { method: 'manual' },
        timestamp: new Date()
      }, { session });
    });
    
    // Notify driver
    const ambulance = await db.ambulances.findById(ambulanceId);
    if (ambulance.driverId) {
      const crashReport = await db.crashReports.findById(reportId);
      io.to(`driver_${ambulance.driverId}`).emit('new_assignment', {
        reportId: crashReport._id,
        reportNumber: crashReport.reportNumber,
        location: crashReport.location,
        photos: crashReport.photos
      });
    }
    
    return { success: true };
    
  } finally {
    await session.endSession();
  }
}
```

**UI Flow**:
1. Admin clicks on pending report
2. Modal opens showing report details
3. Admin clicks "Assign Ambulance"
4. Dropdown shows available ambulances at their station
5. Admin selects ambulance and confirms
6. System processes assignment
7. Success notification displayed
8. Report moves from pending to dispatched

---

#### E. Inter-Station Communication

**Request Ambulance Interface**:
```javascript
// Admin UI Component
function RequestAmbulanceForm({ reportId }) {
  const [nearbyStations, setNearbyStations] = useState([]);
  const [selectedStation, setSelectedStation] = useState(null);
  const [reason, setReason] = useState('');
  
  useEffect(() => {
    // Fetch nearby stations
    fetch(`/api/admin/stations/nearby?reportId=${reportId}`)
      .then(res => res.json())
      .then(data => setNearbyStations(data.stations));
  }, [reportId]);
  
  const handleSubmit = async () => {
    await fetch('/api/admin/requests/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetStationId: selectedStation,
        reportId: reportId,
        reason: reason
      })
    });
    
    // Show success message
    alert('Request sent to target station');
  };
  
  return (
    <div>
      <h3>Request Ambulance from Another Station</h3>
      <select onChange={(e) => setSelectedStation(e.target.value)}>
        <option>Select Station</option>
        {nearbyStations.map(station => (
          <option key={station._id} value={station._id}>
            {station.name} - {station.distance.toFixed(1)} km away
            ({station.availableAmbulances} available)
          </option>
        ))}
      </select>
      <textarea 
        placeholder="Reason for request"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <button onClick={handleSubmit}>Send Request</button>
    </div>
  );
}
```

**Incoming Requests Panel**:
```javascript
// Display pending requests to this station
async function getIncomingRequests(stationId) {
  return await db.stationRequests.find({
    targetStationId: stationId,
    status: 'pending'
  }).sort({ createdAt: -1 }).toArray();
}

// UI shows notification badge with count of pending requests
// Admin can approve/deny each request
```

---

#### F. Mark Report as False

**Process**:
```javascript
async function markReportAsFalse(reportId, adminId, reason) {
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      const report = await db.crashReports.findOne(
        { _id: reportId },
        { session }
      );
      
      // If ambulance was dispatched, make it available again
      if (report.assignedAmbulanceId) {
        await db.ambulances.updateOne(
          { _id: report.assignedAmbulanceId },
          {
            $set: {
              status: 'available',
              assignedReportId: null
            }
          },
          { session }
        );
        
        // Increment station available count
        await db.ambulanceStations.updateOne(
          { _id: report.assignedStationId },
          { $inc: { availableAmbulances: 1 } },
          { session }
        );
        
        // Notify driver
        const ambulance = await db.ambulances.findById(report.assignedAmbulanceId);
        if (ambulance.driverId) {
          io.to(`driver_${ambulance.driverId}`).emit('assignment_cancelled', {
            reportId: reportId,
            reason: 'Marked as false report'
          });
        }
      }
      
      // Update report
      await db.crashReports.updateOne(
        { _id: reportId },
        {
          $set: {
            status: 'false_report',
            isFake: true,
            notes: reason,
            resolvedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: 'false_report',
              timestamp: new Date(),
              updatedBy: adminId
            }
          }
        },
        { session }
      );
      
      // Log action
      await db.dispatchLogs.insertOne({
        reportId: reportId,
        stationId: report.assignedStationId,
        ambulanceId: report.assignedAmbulanceId,
        action: 'mark_false',
        performedBy: adminId,
        details: { reason: reason },
        timestamp: new Date()
      }, { session });
    });
    
  } finally {
    await session.endSession();
  }
}
```

---

#### G. Analytics Dashboard

**Metrics Displayed**:
```javascript
async function getStationAnalytics(stationId, timeRange) {
  const startDate = getStartDate(timeRange); // Today, Week, Month
  
  // Total reports handled
  const totalReports = await db.crashReports.countDocuments({
    assignedStationId: stationId,
    reportedAt: { $gte: startDate }
  });
  
  // Average response time (dispatch to arrival)
  const responseTimeData = await db.crashReports.aggregate([
    {
      $match: {
        assignedStationId: stationId,
        arrivedAt: { $exists: true },
        reportedAt: { $gte: startDate }
      }
    },
    {
      $project: {
        responseTime: {
          $divide: [
            { $subtract: ['$arrivedAt', '$dispatchedAt'] },
            60000 // Convert to minutes
          ]
        }
      }
    },
    {
      $group: {
        _id: null,
        avgResponseTime: { $avg: '$responseTime' },
        minResponseTime: { $min: '$responseTime' },
        maxResponseTime: { $max: '$responseTime' }
      }
    }
  ]).toArray();
  
  // Reports by status
  const statusBreakdown = await db.crashReports.aggregate([
    {
      $match: {
        assignedStationId: stationId,
        reportedAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]).toArray();
  
  // False reports count
  const falseReports = await db.crashReports.countDocuments({
    assignedStationId: stationId,
    isFake: true,
    reportedAt: { $gte: startDate }
  });
  
  // Busiest hours
  const busiestHours = await db.crashReports.aggregate([
    {
      $match: {
        assignedStationId: stationId,
        reportedAt: { $gte: startDate }
      }
    },
    {
      $project: {
        hour: { $hour: '$reportedAt' }
      }
    },
    {
      $group: {
        _id: '$hour',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]).toArray();
  
  return {
    totalReports,
    avgResponseTime: responseTimeData[0]?.avgResponseTime,
    statusBreakdown,
    falseReports,
    busiestHours
  };
}
```

---

## 6. AMBULANCE DRIVER WORKFLOW

### 6.1 Authentication

**Login Process**:
```javascript
// Same as admin but with role check
async function driverLogin(username, password) {
  const user = await db.users.findOne({ username });
  
  if (!user || user.role !== 'ambulance_driver') {
    throw new Error('Invalid credentials');
  }
  
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  
  if (!passwordMatch) {
    throw new Error('Invalid credentials');
  }
  
  if (!user.isActive) {
    throw new Error('Account inactive');
  }
  
  // Generate token
  const token = jwt.sign({
    userId: user._id,
    username: user.username,
    role: 'ambulance_driver',
    stationId: user.stationId
  }, process.env.JWT_SECRET, { expiresIn: '24h' });
  
  // Update last login
  await db.users.updateOne(
    { _id: user._id },
    { $set: { lastLogin: new Date() } }
  );
  
  return { token, user };
}
```

**WebSocket Connection**:
```javascript
// After login, driver connects to WebSocket
io.on('connection', (socket) => {
  socket.on('driver_connect', async (data) => {
    const { userId } = data;
    
    // Join driver's personal room
    socket.join(`driver_${userId}`);
    
    // Update driver online status (optional)
    await db.users.updateOne(
      { _id: userId },
      { $set: { isOnline: true } }
    );
  });
});
```

---

### 6.2 Driver Dashboard

#### A. Active Assignment View

**Fetch Current Assignment**:
```javascript
async function getCurrentAssignment(driverId) {
  // Find ambulance assigned to this driver
  const ambulance = await db.ambulances.findOne({
    driverId: driverId,
    status: { $in: ['dispatched', 'en_route'] }
  });
  
  if (!ambulance || !ambulance.assignedReportId) {
    return null; // No active assignment
  }
  
  // Get crash report details
  const report = await db.crashReports.findOne({
    _id: ambulance.assignedReportId
  });
  
  // Get photo URLs
  const photos = await Promise.all(
    report.photos.map(async (photo) => {
      const bucket = new mongodb.GridFSBucket(db);
      const downloadStream = bucket.openDownloadStream(photo.fileId);
      // Convert to base64 or return URL
      return { id: photo.fileId, url: `/api/files/${photo.fileId}` };
    })
  );
  
  return {
    reportNumber: report.reportNumber,
    location: report.location,
    coordinates: report.location.coordinates,
    photos: photos,
    estimatedInjured: report.estimatedInjured,
    vehiclesInvolved: report.vehiclesInvolved,
    description: report.description,
    reportedAt: report.reportedAt,
    status: report.status
  };
}
```

**UI Components**:
```
┌─────────────────────────────────────────┐
│  Active Assignment                       │
├─────────────────────────────────────────┤
│  Report: CR-20260201-0001               │
│  Status: [Dispatched] or [En Route]    │
│                                         │
│  📍 Location:                           │
│  Nasr City, Cairo                       │
│  123 Main Street                        │
│                                         │
│  🚗 Vehicles: 2                         │
│  🤕 Estimated Injured: 3                │
│                                         │
│  📷 Photos: [Gallery View]              │
│                                         │
│  ⏱️ Reported: 5 minutes ago            │
│                                         │
│  [Navigate to Scene]                    │
│  [Mark En Route]                        │
│  [Confirm Arrival]                      │
│  [Request Backup]                       │
└─────────────────────────────────────────┘
```

---

#### B. Navigation to Crash Site

**Integration**:
```javascript
function navigateToCrashSite(lat, lng) {
  // Option 1: Deep link to native maps app
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // iOS: Apple Maps
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}`;
    }
    // Android: Google Maps
    else if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `google.navigation:q=${lat},${lng}`;
    }
  } else {
    // Desktop: Open Google Maps in new tab
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
  }
}
```

**Real-time Location Tracking** (Optional):
```javascript
// Driver's location is tracked and sent to backend
navigator.geolocation.watchPosition(
  (position) => {
    const { latitude, longitude } = position.coords;
    
    // Send to backend via WebSocket
    socket.emit('driver_location_update', {
      ambulanceId: currentAmbulanceId,
      lat: latitude,
      lng: longitude
    });
  },
  (error) => console.error('Location error:', error),
  { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
);

// Backend handler
socket.on('driver_location_update', async (data) => {
  await db.ambulances.updateOne(
    { _id: data.ambulanceId },
    {
      $set: {
        'currentLocation.lat': data.lat,
        'currentLocation.lng': data.lng,
        'currentLocation.lastUpdated': new Date()
      }
    }
  );
  
  // Broadcast to admins watching this ambulance
  socket.broadcast.to(`station_${ambulance.stationId}`).emit('ambulance_moved', data);
});
```

---

#### C. Status Updates

**Mark En Route**:
```javascript
async function markEnRoute(reportId, driverId) {
  await db.crashReports.updateOne(
    { _id: reportId },
    {
      $set: {
        status: 'en_route',
        acknowledgedAt: new Date()
      },
      $push: {
        statusHistory: {
          status: 'en_route',
          timestamp: new Date(),
          updatedBy: driverId
        }
      }
    }
  );
  
  // Update ambulance status
  const ambulance = await db.ambulances.findOne({ driverId: driverId });
  await db.ambulances.updateOne(
    { _id: ambulance._id },
    { $set: { status: 'en_route' } }
  );
  
  // Notify admin
  io.to(`station_${ambulance.stationId}`).emit('report_status_changed', {
    reportId: reportId,
    status: 'en_route'
  });
}
```

**Confirm Arrival**:
```javascript
async function confirmArrival(reportId, driverId) {
  await db.crashReports.updateOne(
    { _id: reportId },
    {
      $set: {
        status: 'arrived',
        arrivedAt: new Date()
      },
      $push: {
        statusHistory: {
          status: 'arrived',
          timestamp: new Date(),
          updatedBy: driverId
        }
      }
    }
  );
  
  // Notify admin
  const ambulance = await db.ambulances.findOne({ driverId: driverId });
  io.to(`station_${ambulance.stationId}`).emit('ambulance_arrived', {
    reportId: reportId,
    arrivedAt: new Date()
  });
}
```

**Mark Resolved (Patient Transported)**:
```javascript
async function markResolved(reportId, driverId) {
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Update report
      await db.crashReports.updateOne(
        { _id: reportId },
        {
          $set: {
            status: 'resolved',
            resolvedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: 'resolved',
              timestamp: new Date(),
              updatedBy: driverId
            }
          }
        },
        { session }
      );
      
      // Make ambulance available again
      const ambulance = await db.ambulances.findOne(
        { driverId: driverId },
        { session }
      );
      
      await db.ambulances.updateOne(
        { _id: ambulance._id },
        {
          $set: {
            status: 'available',
            assignedReportId: null
          }
        },
        { session }
      );
      
      // Increment station available count
      await db.ambulanceStations.updateOne(
        { _id: ambulance.stationId },
        { $inc: { availableAmbulances: 1 } },
        { session }
      );
    });
    
  } finally {
    await session.endSession();
  }
}
```

---

#### D. Request Backup/Reinforcement

**Process**:
```javascript
async function requestBackup(reportId, driverId, reason) {
  const driver = await db.users.findById(driverId);
  const report = await db.crashReports.findById(reportId);
  
  // Update report priority
  await db.crashReports.updateOne(
    { _id: reportId },
    {
      $set: {
        priority: 'high',
        notes: `Backup requested by driver: ${reason}`
      }
    }
  );
  
  // Notify all admins in the station
  const admins = await db.users.find({
    role: 'healthcare_admin',
    stationId: driver.stationId,
    isActive: true
  }).toArray();
  
  admins.forEach(admin => {
    io.to(`admin_${admin._id}`).emit('backup_requested', {
      reportId: reportId,
      reportNumber: report.reportNumber,
      driverName: driver.fullName,
      reason: reason,
      location: report.location
    });
  });
  
  // Log action
  await db.dispatchLogs.insertOne({
    reportId: reportId,
    stationId: driver.stationId,
    ambulanceId: null,
    action: 'request_backup',
    performedBy: driverId,
    details: { reason: reason },
    timestamp: new Date()
  });
}
```

**UI**:
```
[Request Backup] button opens modal:

┌─────────────────────────────────────┐
│  Request Backup Ambulance           │
├─────────────────────────────────────┤
│  Reason:                            │
│  ┌─────────────────────────────┐   │
│  │ Multiple casualties         │   │
│  │ Additional equipment needed │   │
│  └─────────────────────────────┘   │
│                                     │
│  This will notify your station     │
│  admin to dispatch another         │
│  ambulance to this location.       │
│                                     │
│  [Cancel]  [Send Request]          │
└─────────────────────────────────────┘
```

---
