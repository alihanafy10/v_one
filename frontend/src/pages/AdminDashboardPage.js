import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { adminAPI } from '../services/api';
import './AdminDashboardPage.css';

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { socket } = useSocket();
  
  const [reports, setReports] = useState([]);
  const [ambulances, setAmbulances] = useState([]);
  const [fleetSummary, setFleetSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('reports');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  useEffect(() => {
    if (socket) {
      // Listen for urgent reports
      socket.on('urgent_report', (data) => {
        alert(`🚨 URGENT: No ambulances available for report ${data.reportNumber}`);
        loadData();
      });

      // Listen for status changes
      socket.on('report_status_changed', (data) => {
        setReports(prev => prev.map(report => 
          report._id === data.reportId 
            ? { ...report, status: data.status }
            : report
        ));
      });

      // Listen for ambulance arrivals
      socket.on('ambulance_arrived', (data) => {
        alert(`✅ Ambulance arrived at ${data.reportNumber}`);
        loadData();
      });

      // Listen for backup requests
      socket.on('backup_requested', (data) => {
        if (window.confirm(`🚑 Driver ${data.driverName} requests backup for ${data.reportNumber}. Reason: ${data.reason}\n\nView report?`)) {
          // Could navigate to report details
        }
        loadData();
      });

      return () => {
        socket.off('urgent_report');
        socket.off('report_status_changed');
        socket.off('ambulance_arrived');
        socket.off('backup_requested');
      };
    }
  }, [socket]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load reports
      const reportsParams = {};
      if (statusFilter) {
        reportsParams.status = statusFilter;
      }
      const reportsRes = await adminAPI.getReports(reportsParams);
      setReports(reportsRes.data.reports);

      // Load ambulances
      const ambulancesRes = await adminAPI.getAmbulances();
      setAmbulances(ambulancesRes.data.ambulances);
      setFleetSummary(ambulancesRes.data.summary);
      
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAmbulance = async (reportId) => {
    const availableAmbulances = ambulances.filter(a => a.status === 'available');
    
    if (availableAmbulances.length === 0) {
      alert('No available ambulances');
      return;
    }

    const ambulanceId = prompt(
      `Available ambulances:\n${availableAmbulances.map(a => `${a.vehicleNumber} - ${a.vehicleType}`).join('\n')}\n\nEnter ambulance vehicle number:`
    );

    if (!ambulanceId) return;

    const ambulance = availableAmbulances.find(a => a.vehicleNumber === ambulanceId);
    if (!ambulance) {
      alert('Invalid ambulance number');
      return;
    }

    try {
      await adminAPI.assignAmbulance(reportId, ambulance._id);
      alert('Ambulance assigned successfully');
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to assign ambulance');
    }
  };

  const handleMarkFalse = async (reportId) => {
    const reason = prompt('Enter reason for marking as false:');
    if (!reason) return;

    try {
      await adminAPI.markFalse(reportId, reason);
      alert('Report marked as false');
      loadData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to mark report as false');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#ff9800',
      dispatched: '#2196f3',
      en_route: '#03a9f4',
      arrived: '#4caf50',
      resolved: '#8bc34a',
      false_report: '#f44336'
    };
    return colors[status] || '#666';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: '#f44336',
      medium: '#ff9800',
      low: '#4caf50'
    };
    return colors[priority] || '#666';
  };

  const formatTime = (date) => {
    const now = new Date();
    const reportTime = new Date(date);
    const diffMs = now - reportTime;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  if (loading && reports.length === 0) {
    return (
      <div className="admin-dashboard">
        <div className="loading-screen">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>🏥 Admin Dashboard</h1>
          <p>Welcome, {user?.fullName} | {user?.stationName}</p>
        </div>
        <div className="header-right">
          <button className="btn-refresh" onClick={loadData}>
            🔄 Refresh
          </button>
          <button className="btn-logout" onClick={logout}>
            Logout
          </button>
        </div>
      </div>

      {fleetSummary && (
        <div className="fleet-summary">
          <div className="summary-card">
            <div className="summary-label">Total</div>
            <div className="summary-value">{fleetSummary.total}</div>
          </div>
          <div className="summary-card available">
            <div className="summary-label">Available</div>
            <div className="summary-value">{fleetSummary.available}</div>
          </div>
          <div className="summary-card dispatched">
            <div className="summary-label">Dispatched</div>
            <div className="summary-value">{fleetSummary.dispatched}</div>
          </div>
          <div className="summary-card maintenance">
            <div className="summary-label">Maintenance</div>
            <div className="summary-value">{fleetSummary.maintenance}</div>
          </div>
        </div>
      )}

      <div className="dashboard-tabs">
        <button 
          className={`tab ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📋 Reports
        </button>
        <button 
          className={`tab ${activeTab === 'fleet' ? 'active' : ''}`}
          onClick={() => setActiveTab('fleet')}
        >
          🚑 Fleet
        </button>
      </div>

      {activeTab === 'reports' && (
        <div className="reports-section">
          <div className="section-header">
            <h2>Crash Reports</h2>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="dispatched">Dispatched</option>
              <option value="en_route">En Route</option>
              <option value="arrived">Arrived</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="reports-grid">
            {reports.length === 0 ? (
              <div className="empty-state">
                No reports found
              </div>
            ) : (
              reports.map(report => (
                <div key={report._id} className="report-card">
                  <div className="report-header-card">
                    <div className="report-number">{report.reportNumber}</div>
                    <div 
                      className="status-badge"
                      style={{ background: getStatusColor(report.status) }}
                    >
                      {report.status}
                    </div>
                  </div>

                  <div className="report-info">
                    <div className="info-row">
                      <span className="label">Location:</span>
                      <span>{report.location.cityName}, {report.location.areaName}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Injured:</span>
                      <span>{report.estimatedInjured || 0}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Priority:</span>
                      <span 
                        className="priority-badge"
                        style={{ background: getPriorityColor(report.priority) }}
                      >
                        {report.priority}
                      </span>
                    </div>
                    <div className="info-row">
                      <span className="label">Time:</span>
                      <span>{formatTime(report.reportedAt)}</span>
                    </div>
                    {report.assignedAmbulanceId && (
                      <div className="info-row">
                        <span className="label">Ambulance:</span>
                        <span>{report.assignedAmbulanceId.vehicleNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="report-actions">
                    {report.status === 'pending' && (
                      <>
                        <button 
                          className="btn-action btn-assign"
                          onClick={() => handleAssignAmbulance(report._id)}
                        >
                          Assign Ambulance
                        </button>
                        <button 
                          className="btn-action btn-false"
                          onClick={() => handleMarkFalse(report._id)}
                        >
                          Mark False
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'fleet' && (
        <div className="fleet-section">
          <h2>Ambulance Fleet</h2>
          
          <div className="ambulances-grid">
            {ambulances.map(ambulance => (
              <div key={ambulance._id} className="ambulance-card">
                <div className="ambulance-header">
                  <div className="ambulance-number">{ambulance.vehicleNumber}</div>
                  <div 
                    className="status-badge"
                    style={{ background: getStatusColor(ambulance.status) }}
                  >
                    {ambulance.status}
                  </div>
                </div>

                <div className="ambulance-info">
                  <div className="info-row">
                    <span className="label">Type:</span>
                    <span>{ambulance.vehicleType}</span>
                  </div>
                  {ambulance.driverId && (
                    <div className="info-row">
                      <span className="label">Driver:</span>
                      <span>{ambulance.driverId.fullName}</span>
                    </div>
                  )}
                  {ambulance.assignedReportId && (
                    <div className="info-row">
                      <span className="label">Report:</span>
                      <span>{ambulance.assignedReportId.reportNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
