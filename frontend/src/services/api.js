import axios from 'axios';

// Base API URL
const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
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

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors
    if (error.code === 'ECONNREFUSED' || error.message === 'Network Error') {
      console.error('Backend server is not running. Please start the backend server on port 5000.');
      return Promise.reject({
        ...error,
        message: 'Cannot connect to server. Please ensure the backend is running on port 5000.',
      });
    }

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
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

// Complaint APIs
export const complaintAPI = {
  submit: (formData) => {
    return api.post('/complaints', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getMyComplaints: () => api.get('/complaints/my-complaints'),
  getComplaintById: (id) => api.get(`/complaints/${id}`),
};

// Authority APIs
export const authorityAPI = {
  getAllComplaints: (filters) => api.get('/authority/complaints', { params: filters }),
  updateStatus: (id, data) => api.put(`/authority/complaints/${id}/status`, data),
  getStats: () => api.get('/authority/stats'),
};

// AI Assistant APIs
export const aiAssistantAPI = {
  chat: (query, context) => api.post('/ai-assistant/chat', { query, context }),
  improve: (complaintText, language) => api.post('/ai-assistant/improve', { complaintText, language }),
  suggestCategory: (complaintText) => api.post('/ai-assistant/suggest-category', { complaintText }),
};

export default api;