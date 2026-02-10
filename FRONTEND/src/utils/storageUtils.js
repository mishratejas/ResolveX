// TODO: Update with proper encryption and security
import { STORAGE_KEYS } from '../constants';

// Generic Get Item
export const getItem = (key) => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return null;
    
    // Try to parse as JSON
    try {
      return JSON.parse(item);
    } catch {
      return item;
    }
  } catch (error) {
    console.error(`Error getting item ${key}:`, error);
    return null;
  }
};

// Generic Set Item
export const setItem = (key, value) => {
  try {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, stringValue);
    return true;
  } catch (error) {
    console.error(`Error setting item ${key}:`, error);
    return false;
  }
};

// Generic Remove Item
export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Error removing item ${key}:`, error);
    return false;
  }
};

// Get Auth Token (automatically detects role)
export const getAuthToken = () => {
  const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const staffToken = localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
  const userToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  return adminToken || staffToken || userToken || null;
};

// Set Auth Token (based on role)
export const setAuthToken = (token, role = 'user') => {
  try {
    if (role === 'admin') {
      localStorage.setItem(STORAGE_KEYS.ADMIN_TOKEN, token);
    } else if (role === 'staff') {
      localStorage.setItem(STORAGE_KEYS.STAFF_TOKEN, token);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    }
    return true;
  } catch (error) {
    console.error('Error setting auth token:', error);
    return false;
  }
};

// Get User Data (automatically detects role)
export const getUserData = () => {
  const adminData = getItem(STORAGE_KEYS.ADMIN_DATA);
  const staffData = getItem(STORAGE_KEYS.STAFF_DATA);
  const userData = getItem(STORAGE_KEYS.USER_DATA);
  
  if (adminData) return { ...adminData, role: 'admin' };
  if (staffData) return { ...staffData, role: 'staff' };
  if (userData) return { ...userData, role: 'user' };
  
  return null;
};

// Set User Data (based on role)
export const setUserData = (data, role = 'user') => {
  try {
    if (role === 'admin') {
      setItem(STORAGE_KEYS.ADMIN_DATA, data);
    } else if (role === 'staff') {
      setItem(STORAGE_KEYS.STAFF_DATA, data);
    } else {
      setItem(STORAGE_KEYS.USER_DATA, data);
    }
    return true;
  } catch (error) {
    console.error('Error setting user data:', error);
    return false;
  }
};

// Clear All Auth Data
export const clearAuthData = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STAFF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    localStorage.removeItem(STORAGE_KEYS.STAFF_DATA);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    return true;
  } catch (error) {
    console.error('Error clearing auth data:', error);
    return false;
  }
};

// Check if Authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Get Current Role
export const getCurrentRole = () => {
  const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
  const staffToken = localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
  const userToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (adminToken) return 'admin';
  if (staffToken) return 'staff';
  if (userToken) return 'user';
  
  return null;
};

// Session Storage Methods
export const session = {
  getItem: (key) => {
    try {
      const item = sessionStorage.getItem(key);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch {
        return item;
      }
    } catch (error) {
      console.error(`Error getting session item ${key}:`, error);
      return null;
    }
  },
  
  setItem: (key, value) => {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      sessionStorage.setItem(key, stringValue);
      return true;
    } catch (error) {
      console.error(`Error setting session item ${key}:`, error);
      return false;
    }
  },
  
  removeItem: (key) => {
    try {
      sessionStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing session item ${key}:`, error);
      return false;
    }
  },
  
  clear: () => {
    try {
      sessionStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing session storage:', error);
      return false;
    }
  }
};

// Clear All Storage
export const clearAllStorage = () => {
  try {
    localStorage.clear();
    sessionStorage.clear();
    return true;
  } catch (error) {
    console.error('Error clearing all storage:', error);
    return false;
  }
};

export default {
  getItem,
  setItem,
  removeItem,
  getAuthToken,
  setAuthToken,
  getUserData,
  setUserData,
  clearAuthData,
  isAuthenticated,
  getCurrentRole,
  session,
  clearAllStorage
};