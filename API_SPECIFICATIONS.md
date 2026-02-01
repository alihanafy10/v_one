# API Specifications
## Car Crash Reporting & Ambulance Dispatch System

---

## 7. REST API ENDPOINTS

### Base URL
```
https://api.crashreport.com/api/v1
```

### Authentication
- **JWT Token** required for protected endpoints
- Header: `Authorization: Bearer <token>`

---

## 7.1 Public Endpoints (No Auth Required)

### POST /reports/create
**Description**: Submit a new crash report (User/Citizen)

**Request Body**:
```json
{
  "location": {
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357,
      "accuracy": 10
    }
  },
  "photos": [
    "base64_encoded_image_1",
    "base64_encoded_image_2"
  ],
  "verification": {
    "method": "face_id",
    "faceImage": "base64_encoded_face_image"
  },
  "vehiclesInvolved": 2,
  "estimatedInjured": 3,
  "description": "Two cars collision at intersection"
}
```

**OR**:
```json
{
  "location": {
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357,
      "accuracy": 10
    }
  },
  "photos": ["base64_encoded_image"],
  "verification": {
    "method": "national_id",
    "nationalId": "29501011234567"
  },
  "vehiclesInvolved": 1,
  "estimatedInjured": 1,
  "description": "Single vehicle crash"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "reportId": "65abc123def456789",
  "reportNumber": "CR-20260201-0001",
  "message": "Report submitted successfully. Help is on the way.",
  "estimatedResponseTime": "8-12 minutes"
}
```

**Error Response** (400 Bad Request):
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "GPS coordinates required",
    "At least one photo required",
    "Identity verification required"
  ]
}
```

---

### GET /cities
**Description**: Get list of all supported cities

**Response** (200 OK):
```json
{
  "cities": [
    {
      "id": "65abc123",
      "name": "Cairo",
      "country": "Egypt",
      "coordinates": { "lat": 30.0444, "lng": 31.2357 }
    }
  ]
}
```

---

## 7.2 Authentication Endpoints

### POST /auth/login
**Description**: Login for admins and drivers

**Request Body**:
```json
{
  "username": "admin_cairo01",
  "password": "securePassword123"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "65abc456",
    "username": "admin_cairo01",
    "fullName": "Ahmed Hassan",
    "role": "healthcare_admin",
    "stationId": "65xyz789",
    "stationName": "Cairo Central Emergency Station"
  }
}
```

**Error Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

### POST /auth/logout
**Description**: Logout user (optional endpoint for cleanup)

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /auth/verify
**Description**: Verify JWT token validity

**Headers**: `Authorization: Bearer <token>`

**Response** (200 OK):
```json
{
  "valid": true,
  "user": {
    "id": "65abc456",
    "username": "admin_cairo01",
    "role": "healthcare_admin"
  }
}
```

---

## 7.3 Healthcare Admin Endpoints

### GET /admin/reports
**Description**: Get incoming crash reports for admin's area

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Query Parameters**:
- `status` (optional): "pending", "dispatched", "en_route", "arrived"
- `priority` (optional): "high", "medium", "low"
- `limit` (optional): Number of reports (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response** (200 OK):
```json
{
  "reports": [
    {
      "id": "65abc123",
      "reportNumber": "CR-20260201-0001",
      "location": {
        "cityName": "Cairo",
        "areaName": "Nasr City",
        "address": "123 Main Street",
        "coordinates": { "lat": 30.0444, "lng": 31.2357 }
      },
      "status": "pending",
      "priority": "high",
      "vehiclesInvolved": 2,
      "estimatedInjured": 3,
      "reportedAt": "2026-02-01T14:30:00Z",
      "assignedAmbulance": null
    }
  ],
  "total": 15,
  "hasMore": false
}
```

---

### GET /admin/reports/:reportId
**Description**: Get detailed information about a specific report

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response** (200 OK):
```json
{
  "report": {
    "id": "65abc123",
    "reportNumber": "CR-20260201-0001",
    "location": {
      "cityName": "Cairo",
      "areaName": "Nasr City",
      "address": "123 Main Street",
      "coordinates": { "lat": 30.0444, "lng": 31.2357 }
    },
    "photos": [
      { "id": "65photo1", "url": "/api/files/65photo1" },
      { "id": "65photo2", "url": "/api/files/65photo2" }
    ],
    "verification": {
      "method": "face_id",
      "verified": true,
      "verifiedAt": "2026-02-01T14:30:05Z"
    },
    "vehiclesInvolved": 2,
    "estimatedInjured": 3,
    "description": "Two cars collision at intersection",
    "status": "dispatched",
    "priority": "high",
    "assignedStation": {
      "id": "65xyz789",
      "name": "Cairo Central Emergency Station"
    },
    "assignedAmbulance": {
      "id": "65amb001",
      "vehicleNumber": "AMB-1234",
      "driver": { "name": "Mohamed Ali", "phone": "+201234567890" }
    },
    "statusHistory": [
      { "status": "pending", "timestamp": "2026-02-01T14:30:00Z" },
      { "status": "dispatched", "timestamp": "2026-02-01T14:31:00Z", "updatedBy": "65admin1" }
    ],
    "reportedAt": "2026-02-01T14:30:00Z",
    "dispatchedAt": "2026-02-01T14:31:00Z"
  }
}
```

---

### GET /admin/ambulances
**Description**: Get all ambulances in admin's station

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response** (200 OK):
```json
{
  "summary": {
    "total": 10,
    "available": 6,
    "dispatched": 3,
    "maintenance": 1,
    "offline": 0
  },
  "ambulances": [
    {
      "id": "65amb001",
      "vehicleNumber": "AMB-1234",
      "status": "available",
      "vehicleType": "advanced",
      "driver": {
        "id": "65drv001",
        "name": "Mohamed Ali",
        "phone": "+201234567890"
      },
      "currentLocation": {
        "lat": 30.0444,
        "lng": 31.2357,
        "lastUpdated": "2026-02-01T14:35:00Z"
      },
      "assignedReport": null
    },
    {
      "id": "65amb002",
      "vehicleNumber": "AMB-1235",
      "status": "dispatched",
      "vehicleType": "basic",
      "driver": {
        "id": "65drv002",
        "name": "Ahmed Hassan",
        "phone": "+201234567891"
      },
      "currentLocation": {
        "lat": 30.0450,
        "lng": 31.2360,
        "lastUpdated": "2026-02-01T14:40:00Z"
      },
      "assignedReport": {
        "id": "65abc123",
        "reportNumber": "CR-20260201-0001"
      }
    }
  ]
}
```

---

### POST /admin/reports/:reportId/assign
**Description**: Manually assign an ambulance to a report

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "ambulanceId": "65amb001"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Ambulance AMB-1234 assigned to report CR-20260201-0001",
  "report": {
    "id": "65abc123",
    "status": "dispatched",
    "assignedAmbulanceId": "65amb001"
  }
}
```

---

### PUT /admin/reports/:reportId/mark-false
**Description**: Mark a report as false/fake

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "reason": "No crash found at location, verified by patrol"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Report marked as false"
}
```

---

### GET /admin/stations/nearby
**Description**: Get nearby ambulance stations for requesting backup

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Query Parameters**:
- `reportId`: Report ID to calculate distance from

**Response** (200 OK):
```json
{
  "stations": [
    {
      "id": "65xyz790",
      "name": "Nasr City Emergency Station",
      "distance": 5.2,
      "availableAmbulances": 4,
      "contactPhone": "+201234567892"
    },
    {
      "id": "65xyz791",
      "name": "Heliopolis Emergency Station",
      "distance": 8.7,
      "availableAmbulances": 2,
      "contactPhone": "+201234567893"
    }
  ]
}
```

---

### POST /admin/requests/create
**Description**: Request ambulance from another station

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "targetStationId": "65xyz790",
  "reportId": "65abc123",
  "reason": "No available ambulances at our station"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "requestId": "65req001",
  "message": "Request sent to Nasr City Emergency Station"
}
```

---

### GET /admin/requests/incoming
**Description**: Get incoming ambulance requests to this station

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response** (200 OK):
```json
{
  "requests": [
    {
      "id": "65req001",
      "requestingStation": {
        "id": "65xyz789",
        "name": "Cairo Central Emergency Station"
      },
      "report": {
        "id": "65abc123",
        "reportNumber": "CR-20260201-0001",
        "location": { "cityName": "Cairo", "areaName": "Nasr City" },
        "priority": "high"
      },
      "reason": "No available ambulances at our station",
      "requestedAt": "2026-02-01T14:45:00Z",
      "status": "pending"
    }
  ]
}
```

---

### PUT /admin/requests/:requestId/respond
**Description**: Approve or deny an ambulance request

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "approved": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Request approved. Ambulance AMB-5678 dispatched.",
  "ambulanceId": "65amb005"
}
```

---

### GET /admin/analytics
**Description**: Get station performance analytics

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Query Parameters**:
- `timeRange`: "today", "week", "month" (default: "today")

**Response** (200 OK):
```json
{
  "timeRange": "today",
  "metrics": {
    "totalReports": 25,
    "resolvedReports": 20,
    "pendingReports": 3,
    "falseReports": 2,
    "avgResponseTime": 9.5,
    "minResponseTime": 5.2,
    "maxResponseTime": 18.3
  },
  "statusBreakdown": [
    { "status": "resolved", "count": 20 },
    { "status": "en_route", "count": 2 },
    { "status": "pending", "count": 3 }
  ],
  "busiestHours": [
    { "hour": 14, "count": 5 },
    { "hour": 18, "count": 4 },
    { "hour": 10, "count": 3 }
  ]
}
```

---

## 7.4 Ambulance Driver Endpoints

### GET /driver/assignment
**Description**: Get current active assignment for driver

**Headers**: `Authorization: Bearer <token>` (Driver only)

**Response** (200 OK):
```json
{
  "hasAssignment": true,
  "assignment": {
    "reportId": "65abc123",
    "reportNumber": "CR-20260201-0001",
    "location": {
      "cityName": "Cairo",
      "areaName": "Nasr City",
      "address": "123 Main Street",
      "coordinates": { "lat": 30.0444, "lng": 31.2357 }
    },
    "photos": [
      { "id": "65photo1", "url": "/api/files/65photo1" }
    ],
    "vehiclesInvolved": 2,
    "estimatedInjured": 3,
    "description": "Two cars collision at intersection",
    "reportedAt": "2026-02-01T14:30:00Z",
    "status": "dispatched"
  }
}
```

**Response when no assignment** (200 OK):
```json
{
  "hasAssignment": false,
  "assignment": null
}
```

---

### PUT /driver/reports/:reportId/status
**Description**: Update report status (en_route, arrived, resolved)

**Headers**: `Authorization: Bearer <token>` (Driver only)

**Request Body**:
```json
{
  "status": "en_route"
}
```

**Valid status values**: "en_route", "arrived", "resolved"

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Status updated to en_route",
  "report": {
    "id": "65abc123",
    "status": "en_route",
    "updatedAt": "2026-02-01T14:32:00Z"
  }
}
```

---

### POST /driver/reports/:reportId/request-backup
**Description**: Request backup ambulance

**Headers**: `Authorization: Bearer <token>` (Driver only)

**Request Body**:
```json
{
  "reason": "Multiple casualties - need additional support"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Backup request sent to station admin"
}
```

---

### POST /driver/location
**Description**: Update driver's current location (alternative to WebSocket)

**Headers**: `Authorization: Bearer <token>` (Driver only)

**Request Body**:
```json
{
  "lat": 30.0450,
  "lng": 31.2360
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Location updated"
}
```

---

## 7.5 File/Media Endpoints

### GET /files/:fileId
**Description**: Download a file (photo) from GridFS

**Headers**: `Authorization: Bearer <token>` (Admin/Driver only)

**Response**: Binary image data with appropriate Content-Type header

---

### POST /files/upload
**Description**: Upload a file to GridFS (used internally by report creation)

**Headers**: `Authorization: Bearer <token>`

**Request Body**: multipart/form-data with file

**Response** (201 Created):
```json
{
  "success": true,
  "fileId": "65file123",
  "filename": "crash_photo_1.jpg"
}
```

---

## 7.6 Utility Endpoints

### POST /geocode/reverse
**Description**: Reverse geocode coordinates to address

**Request Body**:
```json
{
  "lat": 30.0444,
  "lng": 31.2357
}
```

**Response** (200 OK):
```json
{
  "address": "123 Main Street, Nasr City, Cairo",
  "city": { "id": "65city1", "name": "Cairo" },
  "area": { "id": "65area1", "name": "Nasr City" }
}
```

---

## 7.7 WebSocket Events

### Connection
```javascript
// Client connects
const socket = io('wss://api.crashreport.com', {
  auth: {
    token: 'JWT_TOKEN_HERE'
  }
});
```

---

### Events (Client → Server)

#### `driver_connect`
**Emitted by**: Driver after login
```json
{
  "userId": "65drv001"
}
```

#### `admin_connect`
**Emitted by**: Admin after login
```json
{
  "userId": "65admin1",
  "stationId": "65xyz789"
}
```

#### `driver_location_update`
**Emitted by**: Driver (real-time location tracking)
```json
{
  "ambulanceId": "65amb001",
  "lat": 30.0450,
  "lng": 31.2360
}
```

---

### Events (Server → Client)

#### `new_assignment` (to driver)
**Triggered when**: Ambulance is assigned to a report
```json
{
  "reportId": "65abc123",
  "reportNumber": "CR-20260201-0001",
  "location": {
    "cityName": "Cairo",
    "areaName": "Nasr City",
    "coordinates": { "lat": 30.0444, "lng": 31.2357 }
  },
  "photos": [...],
  "estimatedInjured": 3
}
```

#### `assignment_cancelled` (to driver)
**Triggered when**: Report marked as false or reassigned
```json
{
  "reportId": "65abc123",
  "reason": "Marked as false report"
}
```

#### `urgent_report` (to admin)
**Triggered when**: No available ambulances for a report
```json
{
  "reportId": "65abc123",
  "reportNumber": "CR-20260201-0001",
  "reason": "no_available_ambulances",
  "priority": "high",
  "location": {...}
}
```

#### `ambulance_request` (to admin)
**Triggered when**: Another station requests an ambulance
```json
{
  "requestId": "65req001",
  "fromStationId": "65xyz789",
  "reportNumber": "CR-20260201-0001",
  "location": {...},
  "priority": "high"
}
```

#### `request_response` (to admin)
**Triggered when**: Request to another station is approved/denied
```json
{
  "requestId": "65req001",
  "approved": true,
  "reportId": "65abc123"
}
```

#### `report_status_changed` (to admin)
**Triggered when**: Driver updates report status
```json
{
  "reportId": "65abc123",
  "status": "en_route",
  "updatedAt": "2026-02-01T14:32:00Z"
}
```

#### `ambulance_arrived` (to admin)
**Triggered when**: Driver confirms arrival
```json
{
  "reportId": "65abc123",
  "arrivedAt": "2026-02-01T14:40:00Z"
}
```

#### `ambulance_moved` (to admin)
**Triggered when**: Driver's location updates
```json
{
  "ambulanceId": "65amb001",
  "lat": 30.0450,
  "lng": 31.2360
}
```

#### `backup_requested` (to admin)
**Triggered when**: Driver requests backup
```json
{
  "reportId": "65abc123",
  "reportNumber": "CR-20260201-0001",
  "driverName": "Mohamed Ali",
  "reason": "Multiple casualties - need additional support",
  "location": {...}
}
```

---

## 7.8 Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional details
}
```

### HTTP Status Codes
- `200 OK`: Successful GET/PUT request
- `201 Created`: Successful POST request (resource created)
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., ambulance already assigned)
- `500 Internal Server Error`: Server error

### Common Error Codes
- `AUTH_REQUIRED`: Authentication required
- `INVALID_TOKEN`: JWT token invalid or expired
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `VALIDATION_FAILED`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `AMBULANCE_UNAVAILABLE`: Ambulance not available for assignment
- `REPORT_ALREADY_ASSIGNED`: Report already has an ambulance
- `LOCATION_OUT_OF_BOUNDS`: Location outside service area
- `INVALID_STATUS_TRANSITION`: Invalid status change
- `NO_ACTIVE_ASSIGNMENT`: Driver has no active assignment

---

## 7.9 Rate Limiting

- **Public endpoints**: 100 requests per 15 minutes per IP
- **Authenticated endpoints**: 1000 requests per 15 minutes per user
- **File upload**: 20 requests per hour per user

**Rate limit headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1706803200
```

---

## 7.10 API Versioning

- Current version: `v1`
- Base URL includes version: `/api/v1/...`
- Breaking changes require new version
- Deprecated versions supported for 6 months minimum

---
