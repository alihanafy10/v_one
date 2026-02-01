# User Roles and Workflows
## Car Crash Reporting & Ambulance Dispatch System

---

## 2. USER ROLES DEFINITION

### 2.1 User (Citizen)
**Purpose**: Report car crashes and provide critical information for emergency response.

**Capabilities**:
- Access the crash reporting form (no authentication required for emergency)
- Capture and upload photos of the crash scene
- Provide GPS coordinates (automatic)
- Verify identity via Face ID (webcam) OR National ID number
- Submit crash report
- Receive confirmation of report submission

**Limitations**:
- Cannot view dispatch status after submission
- Cannot communicate with ambulance drivers
- Single-use interaction (report and exit)

**Authentication**: None required (emergency access), but identity verification mandatory

---

### 2.2 Ambulance Driver
**Purpose**: Respond to assigned crash reports and navigate to accident sites.

**Capabilities**:
- Login with username + password
- View assigned crash reports in real-time
- Access crash location with GPS coordinates
- View crash photos and details
- Navigate to crash site (integration with maps)
- Confirm arrival at scene
- Request backup/reinforcement ambulances
- Update report status (En Route → Arrived → Patient Transported)

**Authentication**: Username + Password (JWT-based)

**Dashboard Features**:
- Active assignment card
- Crash details (location, photos, timestamp)
- Navigation button
- Status update controls
- Emergency backup request button

---

### 2.3 Healthcare Admin (Per Station)
**Purpose**: Manage ambulance station operations, dispatch ambulances, and coordinate resources.

**Capabilities**:
- Login with username + password
- View all incoming crash reports for their geographic area
- Monitor ambulance fleet status (available, dispatched, maintenance)
- Manually assign ambulances to reports (override automatic dispatch)
- Request additional ambulances from neighboring stations
- Approve/deny ambulance requests from other stations
- View dispatch history and analytics
- Manage ambulance driver accounts
- Mark reports as resolved or false

**Authentication**: Username + Password (JWT-based) with admin role

**Dashboard Features**:
- Incoming reports queue (prioritized by timestamp)
- Ambulance fleet overview (status grid)
- Map view of station coverage area
- Inter-station communication panel
- Driver management interface
- Analytics and reports

---

## 3. USER FLOW (CITIZEN REPORTING)

### Step-by-Step Process

#### 3.1 Access Application
- User opens web app or PWA on mobile device
- Landing page: "Report a Car Crash" button
- **No login required** (emergency scenario)

#### 3.2 Crash Report Form
**Fields**:

1. **GPS Coordinates** (Auto-captured via browser Geolocation API)
   - Latitude, Longitude
   - Timestamp of capture
   - Accuracy radius

2. **Location Details** (Auto-resolved from coordinates)
   - City name
   - Area/Neighborhood name
   - Street address (if available via reverse geocoding)

3. **Crash Photos** (Required)
   - Minimum 1 photo, maximum 5 photos
   - Camera access via browser API
   - Photos compressed before upload (max 2MB each)
   - Visual validation (not blurry, contains vehicle)

4. **Identity Verification** (Choose one method)
   - **Option A: Face ID**
     - Activate webcam
     - Capture live photo
     - Basic liveness detection (blink, head turn)
     - Store face data securely
   - **Option B: National ID Number**
     - Input National ID number
     - Validation against government database (mock for MVP)
     - Store hashed ID number

5. **Additional Information** (Optional)
   - Number of vehicles involved
   - Estimated number of injured
   - Description (text field, max 500 chars)

#### 3.3 Submission & Confirmation
- User clicks "Submit Report"
- System validation:
  - GPS coordinates present
  - At least 1 photo uploaded
  - Identity verification completed
  - Location resolved to city/area
- Backend processing:
  - Store report in database
  - Trigger ambulance dispatch algorithm
  - Generate unique report ID
- **User sees confirmation screen**:
  - "Report submitted successfully"
  - Report ID for reference
  - "Help is on the way"
  - Estimated response time (if available)

#### 3.4 User Interaction Ends
- User cannot track ambulance
- User cannot update report
- User exits the application
- Report enters dispatch system

---
