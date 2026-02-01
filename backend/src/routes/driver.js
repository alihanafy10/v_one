const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const CrashReport = require('../models/CrashReport');
const Ambulance = require('../models/Ambulance');
const AmbulanceStation = require('../models/AmbulanceStation');
const DispatchLog = require('../models/DispatchLog');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const { checkValidation } = require('../middleware/validation');
const mongoose = require('mongoose');

// All routes require driver authentication
router.use(verifyToken);
router.use(requireRole('ambulance_driver'));

// Get current assignment
router.get('/assignment', async (req, res) => {
  try {
    // Find ambulance assigned to this driver
    const ambulance = await Ambulance.findOne({
      driverId: req.user.userId,
      status: { $in: ['dispatched', 'en_route'] }
    });
    
    if (!ambulance || !ambulance.assignedReportId) {
      return res.json({
        success: true,
        hasAssignment: false,
        assignment: null
      });
    }
    
    // Get crash report details
    const report = await CrashReport.findById(ambulance.assignedReportId);
    
    if (!report) {
      return res.json({
        success: true,
        hasAssignment: false,
        assignment: null
      });
    }
    
    res.json({
      success: true,
      hasAssignment: true,
      assignment: {
        reportId: report._id,
        reportNumber: report.reportNumber,
        location: report.location,
        photos: report.photos.map(p => ({
          fileId: p.fileId,
          filename: p.filename
        })),
        vehiclesInvolved: report.vehiclesInvolved,
        estimatedInjured: report.estimatedInjured,
        description: report.description,
        reportedAt: report.reportedAt,
        status: report.status
      }
    });
    
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve assignment'
    });
  }
});

// Update report status
router.put('/reports/:reportId/status', [
  body('status').isIn(['en_route', 'arrived', 'resolved']).withMessage('Invalid status')
], checkValidation, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status } = req.body;
    
    const report = await CrashReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Verify this driver is assigned to this report
    const ambulance = await Ambulance.findOne({
      driverId: req.user.userId,
      assignedReportId: reportId
    });
    
    if (!ambulance) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this report'
      });
    }
    
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      // Update report status
      const updateData = {
        status,
        $push: {
          statusHistory: {
            status,
            timestamp: new Date(),
            updatedBy: req.user.userId
          }
        }
      };
      
      if (status === 'en_route') {
        updateData.acknowledgedAt = new Date();
      } else if (status === 'arrived') {
        updateData.arrivedAt = new Date();
      } else if (status === 'resolved') {
        updateData.resolvedAt = new Date();
      }
      
      await CrashReport.updateOne(
        { _id: reportId },
        updateData,
        { session }
      );
      
      // Update ambulance status
      if (status === 'resolved') {
        // Make ambulance available again
        await Ambulance.updateOne(
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
        await AmbulanceStation.updateOne(
          { _id: ambulance.stationId },
          { $inc: { availableAmbulances: 1 } },
          { session }
        );
      } else {
        await Ambulance.updateOne(
          { _id: ambulance._id },
          { $set: { status } },
          { session }
        );
      }
    });
    
    await session.endSession();
    
    // Notify admins via WebSocket
    if (global.io) {
      const station = await AmbulanceStation.findById(ambulance.stationId);
      
      if (status === 'arrived') {
        global.io.to(`station_${station._id}`).emit('ambulance_arrived', {
          reportId: report._id,
          reportNumber: report.reportNumber,
          arrivedAt: new Date()
        });
      } else {
        global.io.to(`station_${station._id}`).emit('report_status_changed', {
          reportId: report._id,
          status,
          updatedAt: new Date()
        });
      }
    }
    
    res.json({
      success: true,
      message: `Status updated to ${status}`,
      report: {
        id: report._id,
        status,
        updatedAt: new Date()
      }
    });
    
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update status'
    });
  }
});

// Request backup
router.post('/reports/:reportId/request-backup', [
  body('reason').notEmpty().withMessage('Reason is required')
], checkValidation, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { reason } = req.body;
    
    const report = await CrashReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Verify this driver is assigned to this report
    const ambulance = await Ambulance.findOne({
      driverId: req.user.userId,
      assignedReportId: reportId
    });
    
    if (!ambulance) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this report'
      });
    }
    
    // Update report priority
    await CrashReport.updateOne(
      { _id: reportId },
      {
        $set: {
          priority: 'high',
          notes: `Backup requested by driver: ${reason}`
        }
      }
    );
    
    // Notify all admins in the station
    const driver = await User.findById(req.user.userId);
    const admins = await User.find({
      role: 'healthcare_admin',
      stationId: ambulance.stationId,
      isActive: true
    });
    
    if (global.io) {
      admins.forEach(admin => {
        global.io.to(`admin_${admin._id}`).emit('backup_requested', {
          reportId: report._id,
          reportNumber: report.reportNumber,
          driverName: driver.fullName,
          reason: reason,
          location: report.location
        });
      });
    }
    
    // Log action
    await DispatchLog.create({
      reportId: report._id,
      stationId: ambulance.stationId,
      ambulanceId: ambulance._id,
      action: 'request_backup',
      performedBy: req.user.userId,
      details: { reason },
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Backup request sent to station admin'
    });
    
  } catch (error) {
    console.error('Request backup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request backup'
    });
  }
});

// Update driver location
router.post('/location', [
  body('lat').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('lng').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
], checkValidation, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    
    // Find driver's ambulance
    const ambulance = await Ambulance.findOne({
      driverId: req.user.userId
    });
    
    if (!ambulance) {
      return res.status(404).json({
        success: false,
        error: 'Ambulance not found'
      });
    }
    
    // Update location
    await Ambulance.updateOne(
      { _id: ambulance._id },
      {
        $set: {
          'currentLocation.lat': lat,
          'currentLocation.lng': lng,
          'currentLocation.lastUpdated': new Date()
        }
      }
    );
    
    // Broadcast to admins
    if (global.io) {
      global.io.to(`station_${ambulance.stationId}`).emit('ambulance_moved', {
        ambulanceId: ambulance._id,
        lat,
        lng,
        timestamp: new Date()
      });
    }
    
    res.json({
      success: true,
      message: 'Location updated'
    });
    
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

module.exports = router;
