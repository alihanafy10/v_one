# Edge Cases & Error Handling
## Car Crash Reporting & Ambulance Dispatch System

---

## 9. EDGE CASES & ERROR HANDLING

### 9.1 Fake/False Reports

#### Detection Strategies

**1. Identity Verification**
```javascript
async function verifyIdentity(verification) {
  if (verification.method === 'face_id') {
    // Basic liveness detection
    const livenessCheck = await performLivenessDetection(verification.faceImage);
    
    if (!livenessCheck.isLive) {
      throw new Error('Liveness check failed - possible fake image');
    }
    
    // Optional: Face matching against database of known fake reporters
    const isSuspicious = await checkAgainstKnownFakes(verification.faceImage);
    
    if (isSuspicious) {
      // Flag for manual review
      return { verified: false, flagged: true, reason: 'Suspicious identity' };
    }
  }
  
  if (verification.method === 'national_id') {
    // Validate ID format (country-specific)
    if (!isValidNationalIdFormat(verification.nationalId)) {
      throw new Error('Invalid National ID format');
    }
    
    // Optional: Check against government API (mock for MVP)
    const isValid = await validateNationalId(verification.nationalId);
    
    if (!isValid) {
      throw new Error('National ID not found in database');
    }
  }
  
  return { verified: true, flagged: false };
}
```

**2. Pattern Detection**
```javascript
async function detectSuspiciousPatterns(verification) {
  // Check for repeat offenders (same face/ID submitting multiple reports)
  let query = {};
  
  if (verification.method === 'face_id') {
    const faceHash = await hashImage(verification.faceImage);
    query = { 'verification.faceHash': faceHash };
  } else {
    query = { 'verification.nationalIdHash': verification.nationalIdHash };
  }
  
  const recentReportsByUser = await db.crashReports.countDocuments({
    ...query,
    reportedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  });
  
  if (recentReportsByUser >= 3) {
    return {
      suspicious: true,
      reason: 'Multiple reports from same user in 24 hours',
      action: 'flag_for_manual_review'
    };
  }
  
  // Check false report history
  const falseReportCount = await db.crashReports.countDocuments({
    ...query,
    isFake: true
  });
  
  if (falseReportCount >= 2) {
    return {
      suspicious: true,
      reason: 'User has history of false reports',
      action: 'block_or_require_additional_verification'
    };
  }
  
  return { suspicious: false };
}
```

---

### 9.2 No Available Ambulances

**Handling Strategy**:
```javascript
async function handleNoAvailableAmbulances(crashReport) {
  console.log(`No available ambulances for report ${crashReport.reportNumber}`);
  
  // Step 1: Update report priority
  await db.crashReports.updateOne(
    { _id: crashReport._id },
    {
      $set: {
        status: 'pending',
        priority: 'high',
        notes: 'No available ambulances - awaiting manual dispatch'
      }
    }
  );
  
  // Step 2: Notify all admins in the city
  const city = await db.cities.findById(crashReport.location.cityId);
  const stations = await db.ambulanceStations.find({
    cityId: city._id,
    status: 'active'
  }).toArray();
  
  const stationIds = stations.map(s => s._id);
  const admins = await db.users.find({
    role: 'healthcare_admin',
    stationId: { $in: stationIds },
    isActive: true
  }).toArray();
  
  admins.forEach(admin => {
    io.to(`admin_${admin._id}`).emit('critical_alert', {
      type: 'no_ambulances_available',
      reportId: crashReport._id,
      reportNumber: crashReport.reportNumber,
      location: crashReport.location,
      estimatedInjured: crashReport.estimatedInjured,
      message: 'URGENT: No ambulances available in city'
    });
  });
  
  // Step 3: Try neighboring cities
  await expandSearchToNeighboringCities(crashReport);
}
```

---

### 9.3 Invalid Face Scan

**Error Handling**:
```javascript
async function handleFailedFaceVerification(reportData) {
  const errors = [];
  
  // Check liveness
  const livenessResult = await performLivenessDetection(reportData.verification.faceImage);
  
  if (!livenessResult.isLive) {
    errors.push('Liveness check failed. Please ensure you are in a well-lit area.');
  }
  
  // Check image quality
  const qualityCheck = await assessImageQuality(reportData.verification.faceImage);
  
  if (qualityCheck.blurScore < 0.5) {
    errors.push('Image too blurry. Please hold camera steady.');
  }
  
  if (qualityCheck.brightness < 30 || qualityCheck.brightness > 200) {
    errors.push('Poor lighting. Please move to a better lit area.');
  }
  
  if (!qualityCheck.faceDetected) {
    errors.push('No face detected. Please position your face in the frame.');
  }
  
  // Provide fallback option
  return {
    success: false,
    errors: errors,
    fallback: {
      method: 'national_id',
      message: 'Face verification failed. You can use National ID instead.'
    }
  };
}
```

---

### 9.4 GPS/Location Errors

**Error Handling**:
```javascript
async function handleLocationError(error) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return {
        error: 'Location access denied',
        message: 'Please enable location services to report a crash.',
        action: 'request_permission_again'
      };
      
    case error.POSITION_UNAVAILABLE:
      return {
        error: 'Location unavailable',
        message: 'Unable to determine your location. Please ensure GPS is enabled.',
        fallback: 'manual_address_entry'
      };
      
    case error.TIMEOUT:
      return {
        error: 'Location request timeout',
        message: 'Location request took too long. Please try again.',
        action: 'retry'
      };
  }
}

// Location accuracy validation
function validateLocationAccuracy(position) {
  const accuracy = position.coords.accuracy; // In meters
  
  if (accuracy > 100) {
    return {
      valid: false,
      warning: 'Location accuracy is low (±' + Math.round(accuracy) + 'm)',
      suggestion: 'Move to an open area for better GPS signal',
      allowProceed: true,
      flagForReview: true
    };
  }
  
  return { valid: true, accuracy: accuracy };
}
```

---

### 9.5 Network/Connectivity Issues

**Progressive Upload Strategy**:
```javascript
async function uploadCrashReport(reportData) {
  // Save to local storage first
  localStorage.setItem('pending_crash_report', JSON.stringify(reportData));
  
  try {
    // Upload core data
    const coreData = {
      location: reportData.location,
      verification: reportData.verification,
      vehiclesInvolved: reportData.vehiclesInvolved,
      estimatedInjured: reportData.estimatedInjured
    };
    
    const initialResponse = await fetch('/api/reports/create-initial', {
      method: 'POST',
      body: JSON.stringify(coreData),
      timeout: 10000
    });
    
    const { reportId } = await initialResponse.json();
    
    // Upload photos one by one
    for (let i = 0; i < reportData.photos.length; i++) {
      await uploadPhoto(reportId, reportData.photos[i], i);
    }
    
    // Finalize report
    await fetch(`/api/reports/${reportId}/finalize`, {
      method: 'POST'
    });
    
    // Clear local storage
    localStorage.removeItem('pending_crash_report');
    
    return { success: true, reportId };
    
  } catch (error) {
    return {
      success: false,
      error: 'Network error',
      message: 'Connection lost. Report saved locally.',
      pendingReport: true
    };
  }
}

// Retry on reconnection
window.addEventListener('online', async () => {
  const pendingReport = localStorage.getItem('pending_crash_report');
  
  if (pendingReport) {
    await uploadCrashReport(JSON.parse(pendingReport));
  }
});
```

---

### 9.6 Concurrent Updates

**Optimistic Locking**:
```javascript
async function assignAmbulanceWithLocking(reportId, ambulanceId, adminId) {
  const session = db.startSession();
  
  try {
    await session.withTransaction(async () => {
      const report = await db.crashReports.findOne(
        { _id: reportId },
        { session }
      );
      
      const ambulance = await db.ambulances.findOne(
        { _id: ambulanceId },
        { session }
      );
      
      // Check current state
      if (report.status !== 'pending') {
        throw new Error('Report already assigned or resolved');
      }
      
      if (ambulance.status !== 'available') {
        throw new Error('Ambulance no longer available');
      }
      
      // Perform updates atomically
      await db.ambulances.updateOne(
        { _id: ambulanceId, status: 'available' },
        {
          $set: {
            status: 'dispatched',
            assignedReportId: reportId
          }
        },
        { session }
      );
      
      await db.crashReports.updateOne(
        { _id: reportId },
        {
          $set: {
            assignedAmbulanceId: ambulanceId,
            status: 'dispatched'
          }
        },
        { session }
      );
    });
    
    return { success: true };
    
  } catch (error) {
    if (error.message.includes('already assigned')) {
      return {
        success: false,
        error: 'conflict',
        message: error.message
      };
    }
    throw error;
    
  } finally {
    await session.endSession();
  }
}
```

---

### 9.7 Database Connection Failures

**Retry Logic & Circuit Breaker**:
```javascript
class DatabaseConnection {
  constructor() {
    this.client = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }
  
  async connect() {
    try {
      this.client = new MongoClient(process.env.MONGODB_URI, {
        maxPoolSize: 50,
        minPoolSize: 10,
        serverSelectionTimeoutMS: 5000
      });
      
      await this.client.connect();
      this.reconnectAttempts = 0;
      
      this.client.on('close', () => {
        this.attemptReconnect();
      });
      
    } catch (error) {
      await this.attemptReconnect();
    }
  }
  
  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }
}
```

---
