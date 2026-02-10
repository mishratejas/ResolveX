// TODO: Update with proper interceptors and error handling
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - adds auth tokens
axiosInstance.interceptors.request.use(
  (config) => {
    // Check for different token types
    const adminToken = localStorage.getItem('adminToken');
    const staffToken = localStorage.getItem('staffToken');
    const userToken = localStorage.getItem('accessToken');
    
    // Add appropriate token
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (staffToken) {
      config.headers.Authorization = `Bearer ${staffToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 errors
    if (error.response?.status === 401) {
      // Clear tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('staffToken');
      localStorage.removeItem('accessToken');
      
      // Redirect to home
      window.location.href = '/';
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;
export { BASE_URL };