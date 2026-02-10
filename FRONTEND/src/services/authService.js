// TODO: Update with proper error handling and token refresh logic
import axios from '../api/axios';
import { API_ENDPOINTS, STORAGE_KEYS } from '../constants';

const authService = {
  // User Signup
  userSignup: async (data) => {
    try {
      const response = await axios.post(API_ENDPOINTS.USER_SIGNUP, data);
      
      if (response.data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
      }
      
      return response.data;
    } catch (error) {
      console.error('User signup error:', error);
      throw error;
    }
  },

  // User Login
  userLogin: async (email, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.USER_LOGIN, { email, password });
      
      if (response.data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(response.data.user));
        
        window.dispatchEvent(new CustomEvent('userLogin', { 
          detail: { role: 'user', data: response.data.user } 
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('User login error:', error);
      throw error;
    }
  },

  // Staff Login
  staffLogin: async (staffIdOrEmail, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.STAFF_LOGIN, { 
        staffIdOrEmail, 
        password 
      });
      
      if (response.data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.STAFF_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.STAFF_DATA, JSON.stringify(response.data.staff));
        
        window.dispatchEvent(new CustomEvent('userLogin', { 
          detail: { role: 'staff', data: response.data.staff } 
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Staff login error:', error);
      throw error;
    }
  },

  // Staff Register
  staffRegister: async (data) => {
    try {
      const response = await axios.post(API_ENDPOINTS.STAFF_REGISTER, data);
      
      if (response.data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.STAFF_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.STAFF_DATA, JSON.stringify(response.data.staff));
      }
      
      return response.data;
    } catch (error) {
      console.error('Staff register error:', error);
      throw error;
    }
  },

  // Admin Login
  adminLogin: async (adminId, password) => {
    try {
      const response = await axios.post(API_ENDPOINTS.ADMIN_LOGIN, { 
        adminId, 
        password 
      });
      
      if (response.data.accessToken) {
        localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, response.data.accessToken);
        localStorage.setItem(STORAGE_KEYS.ADMIN_DATA, JSON.stringify(response.data.admin));
        
        window.dispatchEvent(new CustomEvent('adminLogin', { 
          detail: { role: 'admin', data: response.data.admin } 
        }));
      }
      
      return response.data;
    } catch (error) {
      console.error('Admin login error:', error);
      throw error;
    }
  },

  // Logout (all roles)
  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STAFF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    localStorage.removeItem(STORAGE_KEYS.STAFF_DATA);
    
    window.dispatchEvent(new Event('userLogout'));
    window.location.href = '/';
  },

  // Request OTP
  requestOTP: async (identifier, purpose, userType) => {
    try {
      const response = await axios.post(API_ENDPOINTS.OTP_REQUEST, {
        identifier,
        purpose,
        userType,
        type: 'email'
      });
      return response.data;
    } catch (error) {
      console.error('OTP request error:', error);
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (identifier, otp, purpose) => {
    try {
      const response = await axios.post(API_ENDPOINTS.OTP_VERIFY, {
        identifier,
        otp,
        purpose
      });
      return response.data;
    } catch (error) {
      console.error('OTP verify error:', error);
      throw error;
    }
  },

  // Refresh Token
  refreshToken: async () => {
    try {
      const response = await axios.post('/api/auth/refresh');
      
      if (response.data.accessToken) {
        // Update the appropriate token based on user role
        const role = response.data.role;
        if (role === 'admin') {
          localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, response.data.accessToken);
        } else if (role === 'staff') {
          localStorage.setItem(STORAGE_KEYS.STAFF_TOKEN, response.data.accessToken);
        } else {
          localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, response.data.accessToken);
        }
      }
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      authService.logout();
      throw error;
    }
  },

  // Get Current User
  getCurrentUser: () => {
    const adminData = localStorage.getItem(STORAGE_KEYS.ADMIN_DATA);
    const staffData = localStorage.getItem(STORAGE_KEYS.STAFF_DATA);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    
    if (adminData) return { ...JSON.parse(adminData), role: 'admin' };
    if (staffData) return { ...JSON.parse(staffData), role: 'staff' };
    if (userData) return { ...JSON.parse(userData), role: 'user' };
    
    return null;
  },

  // Check if authenticated
  isAuthenticated: () => {
    const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    const staffToken = localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
    const userToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    
    return !!(adminToken || staffToken || userToken);
  }
};

export default authService;