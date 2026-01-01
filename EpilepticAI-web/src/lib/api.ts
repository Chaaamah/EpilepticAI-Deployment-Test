import axios from 'axios';

// API configuration
// In production (Docker), VITE_API_BASE_URL is empty string for relative URLs
// Nginx will proxy /api/ requests to the backend container
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : 'http://localhost:8000';
const API_VERSION = import.meta.env.VITE_API_VERSION || 'v1';
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 30000;

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL ? `${API_BASE_URL}/api/${API_VERSION}` : `/api/${API_VERSION}`,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // LOG DÉTAILLÉ DE LA REQUÊTE
    console.group(`🔵 API REQUEST: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Full URL:', `${config.baseURL}${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.log('Params:', config.params);
    console.groupEnd();

    return config;
  },
  (error) => {
    console.error('❌ REQUEST ERROR:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    // LOG DÉTAILLÉ DE LA RÉPONSE
    console.group(`🟢 API RESPONSE: ${response.config.method?.toUpperCase()} ${response.config.url}`);
    console.log('Status:', response.status, response.statusText);
    console.log('Data:', response.data);
    console.groupEnd();

    return response;
  },
  (error) => {
    // LOG DÉTAILLÉ DE L'ERREUR
    console.group(`🔴 API ERROR: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.log('Status:', error.response?.status);
    console.log('Status Text:', error.response?.statusText);
    console.log('Error Data:', error.response?.data);
    console.log('Error Message:', error.message);
    console.groupEnd();

    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
