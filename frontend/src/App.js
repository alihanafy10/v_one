import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import HomePage from './pages/HomePage';
import ReportCrashPage from './pages/ReportCrashPage';
import LoginPage from './pages/LoginPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/report-crash" element={<ReportCrashPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute role="healthcare_admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/driver/dashboard" 
              element={
                <ProtectedRoute role="ambulance_driver">
                  <DriverDashboardPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
