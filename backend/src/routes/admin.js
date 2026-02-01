const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const CrashReport = require('../models/CrashReport');
const Ambulance = require('../models/Ambulance');
const AmbulanceStation = require('../models/AmbulanceStation');
const StationRequest = require('../models/StationRequest');
const DispatchLog = require('../models/DispatchLog');
const User = require('../models/User');
const { verifyToken, requireRole } = require('../middleware/auth');
const { checkValidation } = require('../middleware/validation');
const { sortStationsByDistance } = require('../utils/distance');
const { dispatchAmbulance } = require('../services/dispatchService');
const mongoose = require('mongoose');

// All routes require admin authentication
router.use(verifyToken);
router.use(requireRole('healthcare_admin'));

// Get incoming reports for admin's area
router.get('/reports', async (req, res) => {
  try {
    const { status, priority, limit = 50, offset = 0 } = req.query;
    
    // Get admin's station
    const admin = await User.findById(req.user.userId);
    const station = await AmbulanceStation.findById(admin.stationId);
    
    // Build query
    const query = {
      'location.cityId': station.cityId,
      isFake: false
    };
    
    if (status) {
      query.status = status;
    }
    
    if (priority) {
      query.priority = priority;
    }
    
    // Get reports
    const reports = await CrashReport.find(query)
      .sort({ priority: -1, reportedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .populate('assignedAmbulanceId', 'vehicleNumber')
      .select('-photos.data'); // Exclude photo data from list
    
    const total = await CrashReport.countDocuments(query);
    
    res.json({
      success: true,
      reports,
      total,
      hasMore: total > (parseInt(offset) + parseInt(limit))
    });
    
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve reports'
    });
  }
});

// Get report details
router.get('/reports/:reportId', async (req, res) => {
  try {
    const report = await CrashReport.findById(req.params.reportId)
      .populate('assignedStationId', 'name stationCode')
      .populate('assignedAmbulanceId', 'vehicleNumber driverId')
      .populate({
        path: 'assignedAmbulanceId',
        populate: {
          path: 'driverId',
          select: 'fullName phone'
        }
      });
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    res.json({
      success: true,
      report
    });
    
  } catch (error) {
    console.error('Get report details error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve report details'
    });
  }
});

// Get ambulances in admin's station
router.get('/ambulances', async (req, res) => {
  try {
    const admin = await User.findById(req.user.userId);
    
    const ambulances = await Ambulance.find({ stationId: admin.stationId })
      .populate('driverId', 'fullName phone')
      .populate('assignedReportId', 'reportNumber location.cityName location.areaName');
    
    // Calculate summary
    const summary = {
      total: ambulances.length,
      available: ambulances.filter(a => a.status === 'available').length,
      dispatched: ambulances.filter(a => a.status === 'dispatched' || a.status === 'en_route').length,
      maintenance: ambulances.filter(a => a.status === 'maintenance').length,
      offline: ambulances.filter(a => a.status === 'offline').length
    };
    
    res.json({
      success: true,
      summary,
      ambulances
    });
    
  } catch (error) {
    console.error('Get ambulances error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve ambulances'
    });
  }
});

// Manually assign ambulance to report
router.post('/reports/:reportId/assign', [
  body('ambulanceId').notEmpty().withMessage('Ambulance ID is required')
], checkValidation, async (req, res) => {
  try {
    const { reportId } = req.params;
    const { ambulanceId } = req.body;
    
    const session = await mongoose.startSession();
    
    await session.withTransaction(async () => {
      const report = await CrashReport.findById(reportId).session(session);
      const ambulance = await Ambulance.findById(ambulanceId).session(session);
      
      if (!report) {
        throw new Error('Report not found');
      }
      
      if (!ambulance) {
        throw new Error('Ambulance not found');
      }
      
      if (report.status !== 'pending' && report.status !== 'pending_review') {
        throw new Error('Report already assigned or resolved');
      }
      
      if (ambulance.status !== 'available') {
        throw new Error('Ambulance not available');
      }
      
      // Get station for dispatch
      const station = await AmbulanceStation.findById(ambulance.stationId).session(session);
      station.distance = 0; // Manual assignment, distance not calculated
      
      // Use dispatch service
      await dispatchAmbulance(station, report);
      
      // Log manual assignment
      await DispatchLog.create([{
        reportId: report._id,
        stationId: ambulance.stationId,
        ambulanceId: ambulance._id,
        action: 'manual_assign',
        performedBy: req.user.userId,
        details: { method: 'manual' },
        timestamp: new Date()
      }], { session });
    });
    
    await session.endSession();
    
    res.json({
      success: true,
      message: 'Ambulance assigned successfully'
    });
    
  } catch (error) {
    console.error('Assign ambulance error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to assign ambulance'
    });
  }
});

// Mark report as false
router.put('/reports/:reportId/mark-false', [
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
    
    // If ambulance was dispatched, make it available again
    if (report.assignedAmbulanceId) {
      await Ambulance.updateOne(
        { _id: report.assignedAmbulanceId },
        {
          $set: {
            status: 'available',
            assignedReportId: null
          }
        }
      );
      
      await AmbulanceStation.updateOne(
        { _id: report.assignedStationId },
        { $inc: { availableAmbulances: 1 } }
      );
      
      // Notify driver
      const ambulance = await Ambulance.findById(report.assignedAmbulanceId);
      if (ambulance && ambulance.driverId && global.io) {
        global.io.to(`driver_${ambulance.driverId}`).emit('assignment_cancelled', {
          reportId: report._id,
          reason: 'Marked as false report'
        });
      }
    }
    
    // Update report
    await CrashReport.updateOne(
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
            updatedBy: req.user.userId
          }
        }
      }
    );
    
    // Log action
    await DispatchLog.create({
      reportId: report._id,
      stationId: report.assignedStationId,
      ambulanceId: report.assignedAmbulanceId,
      action: 'mark_false',
      performedBy: req.user.userId,
      details: { reason },
      timestamp: new Date()
    });
    
    res.json({
      success: true,
      message: 'Report marked as false'
    });
    
  } catch (error) {
    console.error('Mark false error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark report as false'
    });
  }
});

// Get nearby stations
router.get('/stations/nearby', async (req, res) => {
  try {
    const { reportId } = req.query;
    
    if (!reportId) {
      return res.status(400).json({
        success: false,
        error: 'Report ID is required'
      });
    }
    
    const report = await CrashReport.findById(reportId);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }
    
    // Get admin's station to exclude it
    const admin = await User.findById(req.user.userId);
    
    // Find nearby stations in same city
    const stations = await AmbulanceStation.find({
      cityId: report.location.cityId,
      status: 'active',
      availableAmbulances: { $gt: 0 },
      _id: { $ne: admin.stationId } // Exclude admin's own station
    });
    
    // Sort by distance
    const sortedStations = sortStationsByDistance(
      stations,
      report.location.coordinates.lat,
      report.location.coordinates.lng
    );
    
    res.json({
      success: true,
      stations: sortedStations.map(s => ({
        id: s._id,
        name: s.name,
        stationCode: s.stationCode,
        distance: s.distance.toFixed(1),
        availableAmbulances: s.availableAmbulances,
        contactPhone: s.contactPhone
      }))
    });
    
  } catch (error) {
    console.error('Get nearby stations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve nearby stations'
    });
  }
});

// Get analytics
router.get('/analytics', async (req, res) => {
  try {
    const { timeRange = 'today' } = req.query;
    const admin = await User.findById(req.user.userId);
    
    // Calculate date range
    let startDate = new Date();
    if (timeRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (timeRange === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (timeRange === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Get reports for admin's station
    const totalReports = await CrashReport.countDocuments({
      assignedStationId: admin.stationId,
      reportedAt: { $gte: startDate }
    });
    
    const statusBreakdown = await CrashReport.aggregate([
      {
        $match: {
          assignedStationId: admin.stationId,
          reportedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const falseReports = await CrashReport.countDocuments({
      assignedStationId: admin.stationId,
      isFake: true,
      reportedAt: { $gte: startDate }
    });
    
    res.json({
      success: true,
      timeRange,
      metrics: {
        totalReports,
        statusBreakdown,
        falseReports
      }
    });
    
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve analytics'
    });
  }
});

module.exports = router;
