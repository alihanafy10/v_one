import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { driverAPI } from '../services/api';
import './DriverDashboardPage.css';

const DriverDashboardPage = () => {
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    loadAssignment();
    
    // Update location every 30 seconds if dispatched
    const locationInterval = setInterval(() => {
      if (assignment && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            driverAPI.updateLocation(
              position.coords.latitude,
              position.coords.longitude
            ).catch(err => console.error('Location update failed:', err));
          },
          (error) => console.error('Geolocation error:', error)
        );
      }
    }, 30000);

    return () => clearInterval(locationInterval);
  }, [assignment]);

  useEffect(() => {
    if (socket) {
      // Listen for new assignments
      socket.on('new_assignment', (data) => {
        alert(`🚨 New assignment: ${data.reportNumber}`);
        setAssignment(data);
        playNotificationSound();
      });

      // Listen for assignment cancellation
      socket.on('assignment_cancelled', (data) => {
        alert(`❌ Assignment cancelled: ${data.reason}`);
        setAssignment(null);
      });

      return () => {
        socket.off('new_assignment');
        socket.off('assignment_cancelled');
      };
    }
  }, [socket]);

  const playNotificationSound = () => {
    // Simple notification sound (you can add actual audio file)
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltrzxnMpBSl+zPLaizsIHGS57OqfTgwKUKXh8bllHAU2jdXzzn0vBSF1xe/glEILElyx6OyrWBUIQ5zd8sFuJAUuhM/z1YU2Bhxqvu7mnEoODlOq5O+zYBoGPJPY88p2KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCkif4fK+bCIFMIXQ88V3KwUme8rx3I4+CRpjuuvromwUCkef4vK9ayEFMIXS89GBMwYebsDu45lKDg5WrOjurFUVCg==');
    audio.play().catch(e => console.log('Audio play failed:', e));
  };

  const loadAssignment = async () => {
    try {
      setLoading(true);
      const response = await driverAPI.getAssignment();
      if (response.data.hasAssignment) {
        setAssignment(response.data.assignment);
      } else {
        setAssignment(null);
      }
    } catch (error) {
      console.error('Load assignment error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!assignment) return;
    
    const confirmMessage = {
      en_route: 'Mark as En Route? This will notify the admin.',
      arrived: 'Confirm arrival at crash site?',
      resolved: 'Mark as Resolved? The ambulance will become available again.'
    };

    if (!window.confirm(confirmMessage[newStatus])) {
      return;
    }

    setStatusUpdating(true);
    try {
      await driverAPI.updateStatus(assignment.reportId, newStatus);
      
      if (newStatus === 'resolved') {
        alert('✅ Report marked as resolved. Great job!');
        setAssignment(null);
      } else {
        setAssignment({ ...assignment, status: newStatus });
        alert(`✅ Status updated to ${newStatus}`);
      }
      
      loadAssignment();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to update status');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRequestBackup = async () => {
    if (!assignment) return;
    
    const reason = prompt('Enter reason for backup request:');
    if (!reason) return;

    try {
      await driverAPI.requestBackup(assignment.reportId, reason);
      alert('✅ Backup request sent to admin');
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to request backup');
    }
  };

  const handleNavigate = () => {
    if (!assignment) return;
    
    const { lat, lng } = assignment.location.coordinates;
    
    // Open maps based on platform
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        window.location.href = `maps://maps.apple.com/?daddr=${lat},${lng}`;
      } else {
        window.location.href = `google.navigation:q=${lat},${lng}`;
      }
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    }
  };

  if (loading) {
    return (
      <div className="driver-dashboard">
        <div className="loading-screen">Loading...</div>
      </div>
    );
  }

  return (
    <div className="driver-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🚑 Driver Dashboard</h1>
          <p>Welcome, {user?.fullName}</p>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={loadAssignment}>
            🔄 Refresh
          </button>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {!assignment ? (
        <div className="no-assignment">
          <div className="no-assignment-icon">✅</div>
          <h2>No Active Assignment</h2>
          <p>You will be notified when a new crash report is assigned to you.</p>
          <button className="btn-standby" disabled>
            🟢 Standing By
          </button>
        </div>
      ) : (
        <div className="assignment-container">
          <div className="assignment-header">
            <h2>🚨 Active Assignment</h2>
            <div className="status-badge" style={{ 
              background: assignment.status === 'dispatched' ? '#2196f3' : 
                         assignment.status === 'en_route' ? '#03a9f4' : '#4caf50'
            }}>
              {assignment.status}
            </div>
          </div>

          <div className="assignment-card">
            <div className="card-section">
              <h3>Report Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Report Number:</span>
                  <span className="value">{assignment.reportNumber}</span>
                </div>
                <div className="info-item">
                  <span className="label">Location:</span>
                  <span className="value">
                    {assignment.location.cityName}, {assignment.location.areaName}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Address:</span>
                  <span className="value">{assignment.location.address || 'N/A'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Vehicles Involved:</span>
                  <span className="value">{assignment.vehiclesInvolved}</span>
                </div>
                <div className="info-item">
                  <span className="label">Estimated Injured:</span>
                  <span className="value urgency">{assignment.estimatedInjured}</span>
                </div>
                <div className="info-item">
                  <span className="label">Reported:</span>
                  <span className="value">
                    {new Date(assignment.reportedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {assignment.description && (
                <div className="description">
                  <strong>Description:</strong>
                  <p>{assignment.description}</p>
                </div>
              )}
            </div>

            <div className="card-section">
              <h3>Crash Photos</h3>
              <div className="photos-grid">
                {assignment.photos && assignment.photos.length > 0 ? (
                  assignment.photos.map((photo, index) => (
                    <div key={index} className="photo-thumb">
                      <img 
                        src={`${process.env.REACT_APP_API_URL}/files/${photo.fileId}`}
                        alt={`Crash ${index + 1}`}
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                          e.target.alt = 'Photo unavailable';
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <p>No photos available</p>
                )}
              </div>
            </div>

            <div className="card-section">
              <h3>Location</h3>
              <div className="coordinates">
                <p>Latitude: {assignment.location.coordinates.lat.toFixed(6)}</p>
                <p>Longitude: {assignment.location.coordinates.lng.toFixed(6)}</p>
              </div>
              <button className="btn-navigate" onClick={handleNavigate}>
                🗺️ Navigate to Crash Site
              </button>
            </div>
          </div>

          <div className="action-buttons">
            {assignment.status === 'dispatched' && (
              <button 
                className="btn-action btn-enroute"
                onClick={() => handleUpdateStatus('en_route')}
                disabled={statusUpdating}
              >
                🚗 Mark En Route
              </button>
            )}

            {assignment.status === 'en_route' && (
              <button 
                className="btn-action btn-arrived"
                onClick={() => handleUpdateStatus('arrived')}
                disabled={statusUpdating}
              >
                📍 Confirm Arrival
              </button>
            )}

            {assignment.status === 'arrived' && (
              <button 
                className="btn-action btn-resolved"
                onClick={() => handleUpdateStatus('resolved')}
                disabled={statusUpdating}
              >
                ✅ Mark Resolved
              </button>
            )}

            <button 
              className="btn-action btn-backup"
              onClick={handleRequestBackup}
            >
              🆘 Request Backup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboardPage;
