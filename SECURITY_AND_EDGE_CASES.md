# Security, Authorization, and Edge Cases
## Car Crash Reporting & Ambulance Dispatch System

---

## 8. SECURITY CONSIDERATIONS

### 8.1 Authentication & Authorization

#### Password Security
```javascript
// Password hashing on user creation/update
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 12;

async function hashPassword(plainPassword) {
  return await bcrypt.hash(plainPassword, SALT_ROUNDS);
}

async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
```

**Password Requirements**:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

#### JWT Token Security
```javascript
// Token generation
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      username: user.username,
      role: user.role,
      stationId: user.stationId
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h',
      issuer: 'crash-report-system',
      audience: 'crash-report-api'
    }
  );
}

// Token verification middleware
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'crash-report-system',
      audience: 'crash-report-api'
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Token Storage**:
- Client: localStorage (with XSS protection)
- Consider httpOnly cookies for enhanced security in production
- Refresh token mechanism for long sessions

---

#### Role-Based Access Control (RBAC)

```javascript
// Middleware to check roles
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }
    
    next();
  };
}

// Usage in routes
app.get('/admin/reports', 
  verifyToken, 
  requireRole(['healthcare_admin']), 
  getAdminReports
);

app.get('/driver/assignment', 
  verifyToken, 
  requireRole(['ambulance_driver']), 
  getDriverAssignment
);
```

---

#### Resource-Level Authorization

```javascript
// Ensure admin can only access reports in their city
async function canAccessReport(userId, reportId) {
  const user = await db.users.findById(userId);
  const station = await db.ambulanceStations.findById(user.stationId);
  const report = await db.crashReports.findById(reportId);
  
  if (report.location.cityId.toString() !== station.cityId.toString()) {
    return false;
  }
  
  return true;
}

// Middleware
async function authorizeReportAccess(req, res, next) {
  const reportId = req.params.reportId;
  const userId = req.user.userId;
  
  const hasAccess = await canAccessReport(userId, reportId);
  
  if (!hasAccess) {
    return res.status(403).json({ 
      error: 'You do not have access to this report' 
    });
  }
  
  next();
}
```

---

### 8.2 Data Security

#### Sensitive Data Encryption

**National ID Hashing**:
```javascript
const crypto = require('crypto');

function hashNationalId(nationalId) {
  return crypto
    .createHash('sha256')
    .update(nationalId + process.env.SALT_SECRET)
    .digest('hex');
}

// Store only the hash, never the plain ID
await db.crashReports.updateOne(
  { _id: reportId },
  {
    $set: {
      'verification.nationalIdHash': hashNationalId(nationalId)
    }
  }
);
```

**Face Image Storage**:
```javascript
// Encrypt face images before storing in GridFS
const { createCipheriv, createDecipheriv, randomBytes } = require('crypto');

function encryptImage(buffer) {
  const algorithm = 'aes-256-gcm';
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
  const iv = randomBytes(16);
  
  const cipher = createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

// Store encrypted image in GridFS with IV and authTag as metadata
```

---

#### HTTPS/TLS Enforcement

```javascript
// Redirect HTTP to HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.header('host')}${req.url}`);
  }
  next();
});

// Set security headers
const helmet = require('helmet');
app.use(helmet());
```

---

### 8.3 Input Validation & Sanitization

```javascript
const { body, param, validationResult } = require('express-validator');

// Crash report validation
const validateCrashReport = [
  body('location.coordinates.lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  
  body('location.coordinates.lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  
  body('photos')
    .isArray({ min: 1, max: 5 })
    .withMessage('Must provide 1-5 photos'),
  
  body('verification.method')
    .isIn(['face_id', 'national_id'])
    .withMessage('Invalid verification method'),
  
  body('vehiclesInvolved')
    .optional()
    .isInt({ min: 1, max: 20 })
    .withMessage('Invalid vehicle count'),
  
  body('estimatedInjured')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Invalid injury count'),
  
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description too long')
];

// Check validation results
function checkValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
}

// Usage
app.post('/reports/create', 
  validateCrashReport, 
  checkValidation, 
  createCrashReport
);
```

---

#### SQL/NoSQL Injection Prevention

```javascript
// NEVER do this:
// db.users.findOne({ username: req.body.username }) // Vulnerable!

// ALWAYS validate and use proper query structure:
const { ObjectId } = require('mongodb');

function sanitizeId(id) {
  if (!ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return new ObjectId(id);
}

// Use parameterized queries
const user = await db.users.findOne({
  username: { $eq: req.body.username } // Explicit operator
});
```

---

#### XSS Protection

```javascript
// Sanitize HTML content
const sanitizeHtml = require('sanitize-html');

function sanitizeInput(input) {
  if (typeof input === 'string') {
    return sanitizeHtml(input, {
      allowedTags: [], // No HTML allowed
      allowedAttributes: {}
    });
  }
  return input;
}

// Apply to all text inputs
app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
});
```

---

### 8.4 File Upload Security

```javascript
const multer = require('multer');
const sharp = require('sharp');

// Configure multer with restrictions
const upload = multer({
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB max
    files: 5 // Maximum 5 files
  },
  fileFilter: (req, file, cb) => {
    // Only allow images
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG allowed.'));
    }
  }
});

// Validate image content
async function validateImage(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    // Check dimensions
    if (metadata.width < 100 || metadata.height < 100) {
      throw new Error('Image too small');
    }
    
    if (metadata.width > 4096 || metadata.height > 4096) {
      throw new Error('Image too large');
    }
    
    return true;
  } catch (error) {
    throw new Error('Invalid image file');
  }
}

// Strip EXIF data for privacy
async function stripMetadata(buffer) {
  return await sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .jpeg({ quality: 85 })
    .toBuffer();
}
```

---

### 8.5 Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

// Public endpoints (stricter limits)
const publicLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
});

// Authenticated endpoints
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient
  }),
  windowMs: 15 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => req.user.userId, // Per user
  message: 'Too many requests, please slow down.'
});

// Apply to routes
app.use('/api/v1/reports/create', publicLimiter);
app.use('/api/v1/admin', verifyToken, authLimiter);
app.use('/api/v1/driver', verifyToken, authLimiter);
```

---

### 8.6 Database Security

**Connection Security**:
```javascript
const mongoClient = new MongoClient(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  ssl: true,
  sslValidate: true,
  authSource: 'admin',
  retryWrites: true
});
```

**MongoDB User Roles**:
- Application user: Read/write access to specific collections only
- Admin user: Full access (separate credentials)
- Backup user: Read-only access

**Field-Level Encryption** (for highly sensitive data):
```javascript
// MongoDB Client-Side Field Level Encryption (CSFLE)
const { ClientEncryption } = require('mongodb-client-encryption');

// Encrypt sensitive fields like national ID
const encryption = new ClientEncryption(mongoClient, {
  keyVaultNamespace: 'encryption.__keyVault',
  kmsProviders: {
    local: {
      key: Buffer.from(process.env.MASTER_KEY, 'base64')
    }
  }
});
```

---
