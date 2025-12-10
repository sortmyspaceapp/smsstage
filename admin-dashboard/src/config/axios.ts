import axios from 'axios';

const DEFAULT_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://smsstage.ceartech.com'
    : 'http://localhost:3000';

export const API_BASE_URL = (process.env.REACT_APP_API_URL || DEFAULT_BASE_URL).replace(
  /\/+$/,
  '',
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for development
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token if available
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage and add to headers
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

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
