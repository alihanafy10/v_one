const express = require('express');
const router = express.Router();
const CrashReport = require('../models/CrashReport');
const { publicLimiter } = require('../middleware/rateLimiter');
const { generateReportNumber, hashNationalId, determinePriority } = require('../utils/helpers');
const { automaticDispatch } = require('../services/dispatchService');

// Create crash report (without file upload for serverless compatibility)
router.post('/create', publicLimiter, express.json({ limit: '50mb' }), async (req, res) => {
  try {
    const { location, verification, vehiclesInvolved, estimatedInjured, description, photos } = req.body;
    
    // Validate required fields
    if (!location || !location.coordinates || !location.coordinates.lat || !location.coordinates.lng) {
      return res.status(400).json({
        success: false,
        error: 'Location coordinates are required',
        code: 'LOCATION_REQUIRED'
      });
    }
    
    if (!photos || photos.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one photo is required',
        code: 'PHOTOS_REQUIRED'
      });
    }
    
    if (!verification || !verification.method) {
      return res.status(400).json({
        success: false,
        error: 'Verification method is required',
        code: 'VERIFICATION_REQUIRED'
      });
    }
    
    // Handle verification
    const verificationData = {
      method: verification.method,
      verified: true,
      verifiedAt: new Date()
    };
    
    if (verification.method === 'national_id') {
      if (!verification.nationalId) {
        return res.status(400).json({
          success: false,
          error: 'National ID is required',
          code: 'NATIONAL_ID_REQUIRED'
        });
      }
      verificationData.nationalIdHash = hashNationalId(verification.nationalId);
    } else if (verification.method === 'face_id') {
      if (!verification.faceImage) {
        return res.status(400).json({
          success: false,
          error: 'Face image is required for Face ID verification',
          code: 'FACE_IMAGE_REQUIRED'
        });
      }
      verificationData.faceImageId = `face_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Store face image data (in production, this should be saved to a secure storage service)
      verificationData.faceImageData = {
        filename: verification.faceImage.filename || 'face_verification.jpg',
        data: verification.faceImage.data,
        uploadedAt: new Date()
      };
    }
    
    // Process photos (expecting base64 strings from frontend)
    const processedPhotos = photos.map((photo, index) => ({
      fileId: `photo_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      filename: photo.filename || `crash_photo_${index + 1}.jpg`,
      data: photo.data || photo, // Store base64 data
      uploadedAt: new Date()
    }));
    
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
          accuracy: location.coordinates.accuracy || 0
        }
      },
      verification: verificationData,
      photos: processedPhotos.map(p => ({
        fileId: p.fileId,
        filename: p.filename,
        data: p.data,
        uploadedAt: p.uploadedAt
      })),
      vehiclesInvolved: parseInt(vehiclesInvolved) || 1,
      estimatedInjured: parseInt(estimatedInjured) || 0,
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
