const CrashReport = require('../models/CrashReport');
const City = require('../models/City');
const Area = require('../models/Area');
const AmbulanceStation = require('../models/AmbulanceStation');
const Ambulance = require('../models/Ambulance');
const DispatchLog = require('../models/DispatchLog');
const { sortStationsByDistance } = require('../utils/distance');
const mongoose = require('mongoose');

// Resolve location from coordinates
const resolveLocation = async (lat, lng) => {
  // Find city by checking if coordinates are within city bounds
  const city = await City.findOne({
    'bounds.north': { $gte: lat },
    'bounds.south': { $lte: lat },
    'bounds.east': { $gte: lng },
    'bounds.west': { $lte: lng }
  });
  
  if (!city) {
    throw new Error('Location not within service area');
  }
  
  // Find nearest area within the city
  const areas = await Area.find({ cityId: city._id });
  
  let nearestArea = null;
  let minDistance = Infinity;
  
  for (const area of areas) {
    const distance = Math.sqrt(
      Math.pow(area.coordinates.lat - lat, 2) +
      Math.pow(area.coordinates.lng - lng, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestArea = area;
    }
  }
  
  return { city, area: nearestArea };
};

// Find candidate stations
const findCandidateStations = async (cityId) => {
  return await AmbulanceStation.find({
    cityId: cityId,
    status: 'active',
    availableAmbulances: { $gt: 0 }
  });
};

// Dispatch ambulance from a station
const dispatchAmbulance = async (station, crashReport) => {
  const session = await mongoose.startSession();
  
  try {
    let ambulance;
    
    await session.withTransaction(async () => {
      // Find first available ambulance
      ambulance = await Ambulance.findOne({
        stationId: station._id,
        status: 'available'
      }).session(session);
      
      if (!ambulance) {
        throw new Error('No available ambulance');
      }
      
      // Update ambulance status
      await Ambulance.updateOne(
        { _id: ambulance._id },
        { 
          $set: { 
            status: 'dispatched',
            assignedReportId: crashReport._id
          }
        },
        { session }
      );
      
      // Update station available count
      await AmbulanceStation.updateOne(
        { _id: station._id },
        { $inc: { availableAmbulances: -1 } },
        { session }
      );
      
      // Update crash report
      await CrashReport.updateOne(
        { _id: crashReport._id },
        {
          $set: {
            assignedStationId: station._id,
            assignedAmbulanceId: ambulance._id,
            status: 'dispatched',
            dispatchedAt: new Date()
          },
          $push: {
            statusHistory: {
              status: 'dispatched',
              timestamp: new Date(),
              updatedBy: null
            }
          }
        },
        { session }
      );
      
      // Log dispatch action
      await DispatchLog.create([{
        reportId: crashReport._id,
        stationId: station._id,
        ambulanceId: ambulance._id,
        action: 'auto_dispatch',
        performedBy: null,
        details: { 
          distance: station.distance,
          method: 'automatic'
        },
        timestamp: new Date()
      }], { session });
    });
    
    // Notify driver via WebSocket (outside transaction)
    if (ambulance && ambulance.driverId && global.io) {
      const updatedReport = await CrashReport.findById(crashReport._id);
      
      global.io.to(`driver_${ambulance.driverId}`).emit('new_assignment', {
        reportId: updatedReport._id,
        reportNumber: updatedReport.reportNumber,
        location: updatedReport.location,
        photos: updatedReport.photos,
        estimatedInjured: updatedReport.estimatedInjured,
        vehiclesInvolved: updatedReport.vehiclesInvolved,
        description: updatedReport.description
      });
    }
    
    return ambulance;
    
  } finally {
    await session.endSession();
  }
};

// Handle case when no ambulances available
const handleNoAvailableAmbulances = async (crashReport) => {
  // Update report status
  await CrashReport.updateOne(
    { _id: crashReport._id },
    {
      $set: {
        status: 'pending',
        priority: 'high'
      },
      $push: {
        statusHistory: {
          status: 'pending',
          timestamp: new Date(),
          updatedBy: null
        }
      }
    }
  );
  
  // Get all admins in the city
  const stations = await AmbulanceStation.find({
    cityId: crashReport.location.cityId,
    status: 'active'
  });
  
  const stationIds = stations.map(s => s._id);
  
  const User = require('../models/User');
  const admins = await User.find({
    role: 'healthcare_admin',
    stationId: { $in: stationIds },
    isActive: true
  });
  
  // Notify all admins via WebSocket
  if (global.io) {
    admins.forEach(admin => {
      global.io.to(`admin_${admin._id}`).emit('urgent_report', {
        reportId: crashReport._id,
        reportNumber: crashReport.reportNumber,
        location: crashReport.location,
        reason: 'no_available_ambulances',
        priority: 'high',
        estimatedInjured: crashReport.estimatedInjured
      });
    });
  }
  
  // Log the event
  await DispatchLog.create({
    reportId: crashReport._id,
    stationId: null,
    ambulanceId: null,
    action: 'no_ambulances_available',
    performedBy: null,
    details: { 
      reason: 'No available ambulances in city',
      cityId: crashReport.location.cityId
    },
    timestamp: new Date()
  });
};

// Main automatic dispatch function
const automaticDispatch = async (crashReport) => {
  try {
    // Step 1: Resolve location
    const { city, area } = await resolveLocation(
      crashReport.location.coordinates.lat,
      crashReport.location.coordinates.lng
    );
    
    // Update crash report with location info
    await CrashReport.updateOne(
      { _id: crashReport._id },
      {
        $set: {
          'location.cityId': city._id,
          'location.areaId': area ? area._id : null,
          'location.cityName': city.name,
          'location.areaName': area ? area.name : null
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
    
    console.log(`✅ Dispatched ambulance for report ${crashReport.reportNumber}`);
    
  } catch (error) {
    console.error('Dispatch error:', error);
    
    // Log error
    await DispatchLog.create({
      reportId: crashReport._id,
      stationId: null,
      ambulanceId: null,
      action: 'manual_dispatch_required',
      performedBy: null,
      details: { 
        error: error.message
      },
      timestamp: new Date()
    });
    
    throw error;
  }
};

module.exports = {
  automaticDispatch,
  resolveLocation,
  findCandidateStations,
  dispatchAmbulance,
  handleNoAvailableAmbulances
};
