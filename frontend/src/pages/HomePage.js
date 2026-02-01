import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const HomePage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleReportCrash = () => {
    navigate('/report-crash');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleDashboard = () => {
    if (user.role === 'healthcare_admin') {
      navigate('/admin/dashboard');
    } else if (user.role === 'ambulance_driver') {
      navigate('/driver/dashboard');
    }
  };

  return (
    <div className="home-page">
      <div className="hero-section">
        <div className="hero-content">
          <h1>🚨 Emergency Crash Reporting System</h1>
          <p className="hero-subtitle">Fast, reliable ambulance dispatch for car crashes</p>
          
          <div className="cta-buttons">
            <button 
              className="btn btn-emergency"
              onClick={handleReportCrash}
            >
              🚗 Report a Car Crash
            </button>
            
            {!isAuthenticated ? (
              <button 
                className="btn btn-secondary"
                onClick={handleLogin}
              >
                🔐 Staff Login
              </button>
            ) : (
              <button 
                className="btn btn-secondary"
                onClick={handleDashboard}
              >
                📊 Go to Dashboard
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📍</div>
            <h3>1. Report Location</h3>
            <p>GPS automatically captures your exact location</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📸</div>
            <h3>2. Add Photos</h3>
            <p>Take photos of the crash scene</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>3. Verify Identity</h3>
            <p>Quick Face ID or National ID verification</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🚑</div>
            <h3>4. Help Arrives</h3>
            <p>Nearest ambulance dispatched automatically</p>
          </div>
        </div>
      </div>

      <div className="info-section">
        <div className="info-box">
          <h3>⚡ Fast Response</h3>
          <p>Average response time: 8-12 minutes</p>
        </div>
        
        <div className="info-box">
          <h3>🎯 Smart Dispatch</h3>
          <p>Automatic nearest-ambulance algorithm</p>
        </div>
        
        <div className="info-box">
          <h3>🔒 Secure</h3>
          <p>Your data is protected and encrypted</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
