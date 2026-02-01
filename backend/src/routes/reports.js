const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const multer = require('multer');
const sharp = require('sharp');
const CrashReport = require('../models/CrashReport');
const { checkValidation } = require('../middleware/validation');
const { publicLimiter } = require('../middleware/rateLimiter');
const { generateReportNumber, hashNationalId, determinePriority } = require('../utils/helpers');
const { automaticDispatch } = require('../services/dispatchService');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 2 * 1024 * 1024, // 2MB
    files: parseInt(process.env.MAX_FILES) || 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG and PNG allowed.'));
    }
  }
});

// Create crash report
router.post('/create', publicLimiter, upload.array('photos', 5), [
  body('location.coordinates.lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.coordinates.lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('verification.method').isIn(['face_id', 'national_id']).withMessage('Invalid verification method'),
  body('vehiclesInvolved').optional().isInt({ min: 1, max: 20 }).withMessage('Invalid vehicle count'),
  body('estimatedInjured').optional().isInt({ min: 0, max: 100 }).withMessage('Invalid injury count'),
  body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description too long')
], checkValidation, async (req, res) => {
  try {
    const { location, verification, vehiclesInvolved, estimatedInjured, description } = req.body;
    
    // Validate photos
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one photo is required',
        code: 'PHOTOS_REQUIRED'
      });
    }
    
    // Process and store photos (simplified - storing as base64 for demo)
    const photos = [];
    for (const file of req.files) {
      // Compress image
      const compressedImage = await sharp(file.buffer)
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      
      // Convert to base64 (in production, use GridFS or S3)
      const base64Image = compressedImage.toString('base64');
      
      photos.push({
        fileId: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        filename: file.originalname,
        data: base64Image,
        uploadedAt: new Date()
      });
    }
    
    // Handle verification
    const verificationData = {
      method: verification.method,
      verified: true,
      verifiedAt: new Date()
    };
    
    if (verification.method === 'national_id') {
      verificationData.nationalIdHash = hashNationalId(verification.nationalId);
    } else if (verification.method === 'face_id') {
      // In production, store face image securely
      verificationData.faceImageId = `face_${Date.now()}`;
    }
    
    // Generate report number
    const reportNumber = generateReportNumber();
    
    // Determine priority
    const priority = determinePriority(estimatedInjured || 0);
    
    // Create crash report
    const crashReport = new CrashReport({
      reportNumber,
      location: {
        coordinates: {
          lat: parseFloat(location.coordinates.lat),
          lng: parseFloat(location.coordinates.lng),
          accuracy: location.coordinates.accuracy
        }
      },
      verification: verificationData,
      photos: photos.map(p => ({
        fileId: p.fileId,
        filename: p.filename,
        uploadedAt: p.uploadedAt
      })),
      vehiclesInvolved: vehiclesInvolved || 1,
      estimatedInjured: estimatedInjured || 0,
      description: description || '',
      priority,
      status: 'pending',
      reportedAt: new Date(),
      statusHistory: [{
        status: 'pending',
        timestamp: new Date(),
        updatedBy: null
      }]
    });
    
    await crashReport.save();
    
    // Trigger automatic dispatch (don't wait for completion)
    automaticDispatch(crashReport).catch(err => {
      console.error('Auto-dispatch failed:', err);
    });
    
    res.status(201).json({
      success: true,
      reportId: crashReport._id,
      reportNumber: crashReport.reportNumber,
      message: 'Report submitted successfully. Help is on the way.',
      estimatedResponseTime: '8-12 minutes'
    });
    
  } catch (error) {
    console.error('Report creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create report'
    });
  }
});

// Get report by ID (public - for confirmation)
router.get('/:reportId', async (req, res) => {
  try {
    const report = await CrashReport.findById(req.params.reportId)
      .select('reportNumber status location reportedAt estimatedInjured vehiclesInvolved');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      report: {
        reportNumber: report.reportNumber,
        status: report.status,
        location: {
          cityName: report.location.cityName,
          areaName: report.location.areaName
        },
        reportedAt: report.reportedAt
      }
    });
    
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report'
    });
  }
});

module.exports = router;
