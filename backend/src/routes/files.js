const express = require('express');
const router = express.Router();
const CrashReport = require('../models/CrashReport');
const { verifyToken } = require('../middleware/auth');

// Get file by ID (admin/driver only)
router.get('/:fileId', verifyToken, async (req, res) => {
  try {
    const { fileId } = req.params;
    
    // Find report containing this file
    const report = await CrashReport.findOne({
      'photos.fileId': fileId
    });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
    
    // Find the specific photo
    const photo = report.photos.find(p => p.fileId === fileId);
    
    if (!photo || !photo.data) {
      return res.status(404).json({
        success: false,
        error: 'File data not found'
      });
    }
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(photo.data, 'base64');
    
    // Set content type
    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Disposition', `inline; filename="${photo.filename}"`);
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Get file error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve file'
    });
  }
});

module.exports = router;
