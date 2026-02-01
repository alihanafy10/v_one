# Database Schema Design
## Car Crash Reporting & Ambulance Dispatch System

---

## 4. BACKEND LOGIC & DATABASE DESIGN

### 4.1 Database Schema

#### Collection: `cities`
```javascript
{
  _id: ObjectId,
  name: String,              // "Cairo"
  country: String,           // "Egypt"
  coordinates: {             // City center
    lat: Number,
    lng: Number
  },
  bounds: {                  // Geographic boundaries
    north: Number,
    south: Number,
    east: Number,
    west: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `name` (unique)
- `coordinates` (2dsphere for geospatial queries)

---

#### Collection: `areas`
```javascript
{
  _id: ObjectId,
  name: String,              // "Nasr City"
  cityId: ObjectId,          // Reference to cities
  coordinates: {             // Area center
    lat: Number,
    lng: Number
  },
  polygon: [                 // Area boundaries (optional)
    { lat: Number, lng: Number }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `cityId`
- `coordinates` (2dsphere)
- Compound: `{ cityId: 1, name: 1 }` (unique)

---

#### Collection: `ambulanceStations`
```javascript
{
  _id: ObjectId,
  name: String,              // "Cairo Central Emergency Station"
  stationCode: String,       // "CCE-001" (unique)
  cityId: ObjectId,
  areaId: ObjectId,
  coordinates: {
    lat: Number,
    lng: Number
  },
  address: String,
  contactPhone: String,
  totalAmbulances: Number,   // Total fleet size
  availableAmbulances: Number, // Currently available
  coverageRadius: Number,    // In kilometers
  status: String,            // "active", "inactive", "maintenance"
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `stationCode` (unique)
- `cityId`
- `coordinates` (2dsphere)
- Compound: `{ cityId: 1, status: 1, availableAmbulances: 1 }` (for dispatch queries)

---

#### Collection: `ambulances`
```javascript
{
  _id: ObjectId,
  vehicleNumber: String,     // "AMB-1234" (unique)
  stationId: ObjectId,
  status: String,            // "available", "dispatched", "maintenance", "offline"
  currentLocation: {         // Updated in real-time
    lat: Number,
    lng: Number,
    lastUpdated: Date
  },
  driverId: ObjectId,        // Reference to users (nullable)
  assignedReportId: ObjectId, // Current crash report (nullable)
  vehicleType: String,       // "basic", "advanced", "icu"
  equipmentLevel: Number,    // 1-5 rating
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `vehicleNumber` (unique)
- `stationId`
- `driverId`
- Compound: `{ stationId: 1, status: 1 }` (for finding available ambulances)
- `assignedReportId`

---

#### Collection: `users`
```javascript
{
  _id: ObjectId,
  username: String,          // Unique for auth
  passwordHash: String,      // Bcrypt hashed
  role: String,              // "ambulance_driver", "healthcare_admin"
  fullName: String,
  email: String,
  phone: String,
  stationId: ObjectId,       // Reference to ambulanceStations
  isActive: Boolean,
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `username` (unique)
- `stationId`
- Compound: `{ role: 1, stationId: 1, isActive: 1 }`

---

#### Collection: `crashReports`
```javascript
{
  _id: ObjectId,
  reportNumber: String,      // "CR-20260201-0001" (unique, sequential)
  
  // Location Data
  location: {
    coordinates: {
      lat: Number,
      lng: Number,
      accuracy: Number       // In meters
    },
    cityId: ObjectId,
    areaId: ObjectId,
    cityName: String,        // Denormalized for quick access
    areaName: String,
    address: String          // Reverse geocoded
  },
  
  // Identity Verification
  verification: {
    method: String,          // "face_id" or "national_id"
    faceImageId: ObjectId,   // GridFS reference (if face_id)
    nationalIdHash: String,  // SHA-256 hashed (if national_id)
    verified: Boolean,
    verifiedAt: Date
  },
  
  // Crash Details
  photos: [                  // GridFS references
    {
      fileId: ObjectId,
      filename: String,
      uploadedAt: Date
    }
  ],
  vehiclesInvolved: Number,
  estimatedInjured: Number,
  description: String,
  
  // Dispatch Information
  assignedStationId: ObjectId,
  assignedAmbulanceId: ObjectId,
  dispatchedAt: Date,
  
  // Status Tracking
  status: String,            // "pending", "dispatched", "en_route", "arrived", "resolved", "false_report"
  statusHistory: [
    {
      status: String,
      timestamp: Date,
      updatedBy: ObjectId    // User who changed status
    }
  ],
  
  // Timestamps
  reportedAt: Date,
  acknowledgedAt: Date,      // When admin/driver sees it
  arrivedAt: Date,
  resolvedAt: Date,
  
  // Priority & Flags
  priority: String,          // "high", "medium", "low" (based on injuries)
  isFake: Boolean,
  notes: String,             // Admin notes
  
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `reportNumber` (unique)
- `location.coordinates.lat, location.coordinates.lng` (2dsphere)
- `location.cityId`
- `assignedStationId`
- `assignedAmbulanceId`
- `status`
- `reportedAt` (descending, for sorting)
- Compound: `{ status: 1, location.cityId: 1, reportedAt: -1 }` (for admin dashboard)
- Compound: `{ assignedAmbulanceId: 1, status: 1 }` (for driver view)

---

#### Collection: `dispatchLogs`
```javascript
{
  _id: ObjectId,
  reportId: ObjectId,
  stationId: ObjectId,
  ambulanceId: ObjectId,
  action: String,            // "auto_dispatch", "manual_assign", "request_backup", "station_transfer"
  performedBy: ObjectId,     // User who performed action (nullable for auto)
  details: Object,           // Flexible field for action-specific data
  timestamp: Date
}
```

**Indexes**:
- `reportId`
- `stationId`
- `timestamp` (descending)
- `action`

---

#### Collection: `stationRequests`
```javascript
{
  _id: ObjectId,
  requestingStationId: ObjectId,
  targetStationId: ObjectId,
  reportId: ObjectId,
  reason: String,
  status: String,            // "pending", "approved", "denied"
  requestedBy: ObjectId,     // Admin user
  respondedBy: ObjectId,     // Admin user (nullable)
  respondedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:
- `targetStationId`
- `requestingStationId`
- `reportId`
- Compound: `{ targetStationId: 1, status: 1 }` (for pending requests)

---

### 4.2 Nearest Ambulance Station Algorithm

#### Algorithm Flow

**Input**: Crash coordinates (lat, lng)

**Process**:

**Step 1: Reverse Geocoding**
```javascript
async function resolveLocation(lat, lng) {
  // Find city by checking if coordinates are within city bounds
  const city = await db.cities.findOne({
    'bounds.north': { $gte: lat },
    'bounds.south': { $lte: lat },
    'bounds.east': { $gte: lng },
    'bounds.west': { $lte: lng }
  });
  
  if (!city) {
    throw new Error('Location not within service area');
  }
  
  // Find area within the city (nearest to coordinates)
  const area = await db.areas.findOne({
    cityId: city._id,
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [lng, lat]
        },
        $maxDistance: 10000 // 10km max
      }
    }
  });
  
  return { city, area };
}
```

**Step 2: Find Candidate Stations**
```javascript
async function findCandidateStations(cityId) {
  // Query all active stations in the same city with available ambulances
  const candidateStations = await db.ambulanceStations.find({
    cityId: cityId,
    status: "active",
    availableAmbulances: { $gt: 0 }
  }).toArray();
  
  if (candidateStations.length === 0) {
    return null; // No available stations
  }
  
  return candidateStations;
}
```

**Step 3: Calculate Distances (Haversine Formula)**
```javascript
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth radius in kilometers
  
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in kilometers
}

function sortStationsByDistance(stations, crashLat, crashLng) {
  return stations.map(station => ({
    ...station,
    distance: calculateDistance(
      crashLat,
      crashLng,
      station.coordinates.lat,
      station.coordinates.lng
    )
  })).sort((a, b) => a.distance - b.distance);
}
```

**Step 4: Dispatch Ambulance**
```javascript
async function dispatchAmbulance(station, crashReport) {
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Find first available ambulance at selected station
      const ambulance = await db.ambulances.findOne(
        { 
          stationId: station._id,
          status: "available"
        },
        { session }
      );
      
      if (!ambulance) {
        throw new Error('No available ambulance');
      }
      
      // Update ambulance status
      await db.ambulances.updateOne(
        { _id: ambulance._id },
        { 
          $set: { 
            status: "dispatched",
            assignedReportId: crashReport._id
          }
        },
        { session }
      );
      
      // Update station available count
      await db.ambulanceStations.updateOne(
        { _id: station._id },
        { $inc: { availableAmbulances: -1 } },
        { session }
      );
      
      // Update crash report
      await db.crashReports.updateOne(
        { _id: crashReport._id },
        {
          $set: {
            assignedStationId: station._id,
            assignedAmbulanceId: ambulance._id,
            status: "dispatched",
            dispatchedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: "dispatched",
              timestamp: new Date(),
              updatedBy: null // Auto-dispatch
            }
          }
        },
        { session }
      );
      
      // Log dispatch action
      await db.dispatchLogs.insertOne({
        reportId: crashReport._id,
        stationId: station._id,
        ambulanceId: ambulance._id,
        action: "auto_dispatch",
        performedBy: null,
        details: { 
          distance: station.distance,
          method: "automatic"
        },
        timestamp: new Date()
      }, { session });
      
      return ambulance;
    });
    
    // Notify driver via WebSocket (outside transaction)
    if (ambulance.driverId) {
      io.to(`driver_${ambulance.driverId}`).emit('new_assignment', {
        reportId: crashReport._id,
        reportNumber: crashReport.reportNumber,
        location: crashReport.location,
        photos: crashReport.photos,
        estimatedInjured: crashReport.estimatedInjured
      });
    }
    
  } finally {
    await session.endSession();
  }
}
```

**Complete Dispatch Flow**
```javascript
async function automaticDispatch(crashReport) {
  try {
    // Step 1: Resolve location
    const { city, area } = await resolveLocation(
      crashReport.location.coordinates.lat,
      crashReport.location.coordinates.lng
    );
    
    // Update crash report with location info
    await db.crashReports.updateOne(
      { _id: crashReport._id },
      {
        $set: {
          'location.cityId': city._id,
          'location.areaId': area._id,
          'location.cityName': city.name,
          'location.areaName': area.name
        }
      }
    );
    
    // Step 2: Find candidate stations
    const candidateStations = await findCandidateStations(city._id);
    
    if (!candidateStations || candidateStations.length === 0) {
      await handleNoAvailableAmbulances(crashReport);
      return;
    }
    
    // Step 3: Sort by distance
    const sortedStations = sortStationsByDistance(
      candidateStations,
      crashReport.location.coordinates.lat,
      crashReport.location.coordinates.lng
    );
    
    // Step 4: Dispatch from nearest station
    await dispatchAmbulance(sortedStations[0], crashReport);
    
  } catch (error) {
    console.error('Dispatch error:', error);
    await handleDispatchError(crashReport, error);
  }
}
```

---

### 4.3 Fallback Logic (Insufficient Ambulances)

#### Scenario 1: No Available Ambulances at Nearest Station

```javascript
async function handleNoAvailableAmbulances(crashReport) {
  // Update report status to pending manual review
  await db.crashReports.updateOne(
    { _id: crashReport._id },
    {
      $set: {
        status: "pending",
        priority: "high" // Escalate priority
      },
      $push: {
        statusHistory: {
          status: "pending",
          timestamp: new Date(),
          updatedBy: null
        }
      }
    }
  );
  
  // Get all admins in the city
  const stations = await db.ambulanceStations.find({
    cityId: crashReport.location.cityId,
    status: "active"
  }).toArray();
  
  const stationIds = stations.map(s => s._id);
  
  const admins = await db.users.find({
    role: "healthcare_admin",
    stationId: { $in: stationIds },
    isActive: true
  }).toArray();
  
  // Notify all admins in the city
  admins.forEach(admin => {
    io.to(`admin_${admin._id}`).emit('urgent_report', {
      reportId: crashReport._id,
      reportNumber: crashReport.reportNumber,
      location: crashReport.location,
      reason: "no_available_ambulances",
      priority: "high"
    });
  });
  
  // Log the fallback
  await db.dispatchLogs.insertOne({
    reportId: crashReport._id,
    stationId: null,
    ambulanceId: null,
    action: "manual_dispatch_required",
    performedBy: null,
    details: { 
      reason: "No available ambulances in city",
      cityId: crashReport.location.cityId
    },
    timestamp: new Date()
  });
}
```

#### Scenario 2: Expand Search to Neighboring Cities

```javascript
async function expandSearchToNeighboringCities(crashReport) {
  // Find cities within 50km radius
  const neighboringCities = await db.cities.find({
    coordinates: {
      $near: {
        $geometry: {
          type: "Point",
          coordinates: [
            crashReport.location.coordinates.lng,
            crashReport.location.coordinates.lat
          ]
        },
        $maxDistance: 50000 // 50km in meters
      }
    },
    _id: { $ne: crashReport.location.cityId } // Exclude current city
  }).limit(5).toArray();
  
  for (const city of neighboringCities) {
    const candidateStations = await findCandidateStations(city._id);
    
    if (candidateStations && candidateStations.length > 0) {
      const sortedStations = sortStationsByDistance(
        candidateStations,
        crashReport.location.coordinates.lat,
        crashReport.location.coordinates.lng
      );
      
      // Notify admin of neighboring station for approval
      const targetStation = sortedStations[0];
      const targetAdmin = await db.users.findOne({
        role: "healthcare_admin",
        stationId: targetStation._id,
        isActive: true
      });
      
      if (targetAdmin) {
        io.to(`admin_${targetAdmin._id}`).emit('cross_city_request', {
          reportId: crashReport._id,
          distance: targetStation.distance,
          requiresApproval: true
        });
        
        return; // Wait for manual approval
      }
    }
  }
  
  // If still no ambulances, escalate to manual dispatch
  await handleNoAvailableAmbulances(crashReport);
}
```

#### Scenario 3: Admin Manually Requests Ambulance from Another Station

```javascript
async function requestAmbulanceFromStation(
  targetStationId, 
  reportId, 
  requestingAdminId
) {
  const requestingAdmin = await db.users.findById(requestingAdminId);
  
  // Create request
  const request = await db.stationRequests.insertOne({
    requestingStationId: requestingAdmin.stationId,
    targetStationId: targetStationId,
    reportId: reportId,
    reason: "No available ambulances at primary station",
    status: "pending",
    requestedBy: requestingAdminId,
    createdAt: new Date()
  });
  
  // Get target station admin
  const targetAdmin = await db.users.findOne({
    role: "healthcare_admin",
    stationId: targetStationId,
    isActive: true
  });
  
  if (targetAdmin) {
    // Get crash report details
    const crashReport = await db.crashReports.findOne({ _id: reportId });
    
    // Notify target station admin
    io.to(`admin_${targetAdmin._id}`).emit('ambulance_request', {
      requestId: request.insertedId,
      fromStationId: requestingAdmin.stationId,
      reportNumber: crashReport.reportNumber,
      location: crashReport.location,
      priority: crashReport.priority
    });
  }
  
  return request.insertedId;
}

async function respondToAmbulanceRequest(requestId, respondingAdminId, approved) {
  const request = await db.stationRequests.findOne({ _id: requestId });
  
  if (!request) {
    throw new Error('Request not found');
  }
  
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      // Update request status
      await db.stationRequests.updateOne(
        { _id: requestId },
        {
          $set: {
            status: approved ? "approved" : "denied",
            respondedBy: respondingAdminId,
            respondedAt: new Date()
          }
        },
        { session }
      );
      
      if (approved) {
        // Get crash report
        const crashReport = await db.crashReports.findOne(
          { _id: request.reportId },
          { session }
        );
        
        // Get target station
        const targetStation = await db.ambulanceStations.findOne(
          { _id: request.targetStationId },
          { session }
        );
        
        // Dispatch ambulance from target station
        await dispatchAmbulance(targetStation, crashReport);
        
        // Log inter-station dispatch
        await db.dispatchLogs.insertOne({
          reportId: request.reportId,
          stationId: request.targetStationId,
          ambulanceId: crashReport.assignedAmbulanceId,
          action: "station_transfer",
          performedBy: respondingAdminId,
          details: {
            requestingStationId: request.requestingStationId,
            approved: true
          },
          timestamp: new Date()
        }, { session });
      }
    });
    
    // Notify requesting admin
    const requestingAdmin = await db.users.findById(request.requestedBy);
    io.to(`admin_${requestingAdmin._id}`).emit('request_response', {
      requestId: requestId,
      approved: approved,
      reportId: request.reportId
    });
    
  } finally {
    await session.endSession();
  }
}
```

---
