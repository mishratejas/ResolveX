// TODO: Update with proper auth state management
import { useState, useEffect } from 'react';
import { STORAGE_KEYS, USER_ROLES } from '../constants';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
    
    // Listen for login/logout events
    window.addEventListener('userLogin', checkAuth);
    window.addEventListener('adminLogin', checkAuth);
    window.addEventListener('staffLogin', checkAuth);
    window.addEventListener('userLogout', handleLogout);
    
    return () => {
      window.removeEventListener('userLogin', checkAuth);
      window.removeEventListener('adminLogin', checkAuth);
      window.removeEventListener('staffLogin', checkAuth);
      window.removeEventListener('userLogout', handleLogout);
    };
  }, []);

  const checkAuth = () => {
    try {
      const adminToken = localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
      const staffToken = localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
      const userToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (adminToken) {
        const adminData = JSON.parse(localStorage.getItem(STORAGE_KEYS.ADMIN_DATA) || '{}');
        setIsAuthenticated(true);
        setUser(adminData);
        setRole(USER_ROLES.ADMIN);
      } else if (staffToken) {
        const staffData = JSON.parse(localStorage.getItem(STORAGE_KEYS.STAFF_DATA) || '{}');
        setIsAuthenticated(true);
        setUser(staffData);
        setRole(USER_ROLES.STAFF);
      } else if (userToken) {
        const userData = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER_DATA) || '{}');
        setIsAuthenticated(true);
        setUser(userData);
        setRole(USER_ROLES.USER);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setIsAuthenticated(false);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.ADMIN_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.STAFF_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ADMIN_DATA);
    localStorage.removeItem(STORAGE_KEYS.STAFF_DATA);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    
    setIsAuthenticated(false);
    setUser(null);
    setRole(null);
    
    window.location.href = '/';
  };

  const getToken = () => {
    if (role === USER_ROLES.ADMIN) {
      return localStorage.getItem(STORAGE_KEYS.ADMIN_TOKEN);
    } else if (role === USER_ROLES.STAFF) {
      return localStorage.getItem(STORAGE_KEYS.STAFF_TOKEN);
    } else {
      return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    }
  };

  return {
    isAuthenticated,
    user,
    role,
    loading,
    checkAuth,
    logout: handleLogout,
    getToken
  };
};

export default useAuth;