import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  verify: () => api.get('/auth/verify'),
  logout: () => api.post('/auth/logout')
};

// Report APIs
export const reportAPI = {
  create: (formData) => {
    return axios.post(`${API_URL}/reports/create`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  getById: (id) => api.get(`/reports/${id}`)
};

// Admin APIs
export const adminAPI = {
  getReports: (params) => api.get('/admin/reports', { params }),
  getReportDetails: (id) => api.get(`/admin/reports/${id}`),
  getAmbulances: () => api.get('/admin/ambulances'),
  assignAmbulance: (reportId, ambulanceId) => 
    api.post(`/admin/reports/${reportId}/assign`, { ambulanceId }),
  markFalse: (reportId, reason) => 
    api.put(`/admin/reports/${reportId}/mark-false`, { reason }),
  getNearbyStations: (reportId) => 
    api.get('/admin/stations/nearby', { params: { reportId } }),
  getAnalytics: (timeRange) => 
    api.get('/admin/analytics', { params: { timeRange } })
};

// Driver APIs
export const driverAPI = {
  getAssignment: () => api.get('/driver/assignment'),
  updateStatus: (reportId, status) => 
    api.put(`/driver/reports/${reportId}/status`, { status }),
  requestBackup: (reportId, reason) => 
    api.post(`/driver/reports/${reportId}/request-backup`, { reason }),
  updateLocation: (lat, lng) => 
    api.post('/driver/location', { lat, lng })
};

// File APIs
export const fileAPI = {
  getFile: (fileId) => api.get(`/files/${fileId}`, { responseType: 'blob' })
};

export default api;
