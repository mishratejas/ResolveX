import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import Home from './pages/user/Home';
import AuthModal from './components/auth/AuthModal';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminIssuesPage from './pages/admin/AdminIssuesPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminStaffPage from './pages/admin/AdminStaffPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffIssuesPage from './pages/staff/StaffIssuesPage';
import AuditLogsPage from './pages/admin/AuditLogsPage';


const BASE_URL = import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

// Debug Component to see current route
const RouteDebugger = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('📍 Current Route:', location.pathname);
    console.log('📋 Route State:', location.state);
    console.log('🔍 Query Params:', new URLSearchParams(location.search).toString());
  }, [location]);
  
  return null;
};

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    userRole: '',
    userName: ''
  });

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
    
    // Also check when window gains focus
    const handleFocus = () => {
      checkAuth();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const checkAuth = () => {
    console.log('🔐 Checking authentication...');
    
    const adminToken = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('adminData');
    const staffToken = localStorage.getItem('staffToken');
    const staffData = localStorage.getItem('staffData');
    const userToken = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    
    console.log('📊 Auth check results:', {
      adminToken: adminToken ? '✅ Present' : '❌ Missing',
      adminData: adminData ? '✅ Present' : '❌ Missing',
      staffToken: staffToken ? '✅ Present' : '❌ Missing',
      userToken: userToken ? '✅ Present' : '❌ Missing'
    });

    if (adminToken && adminData) {
      try {
        const parsedData = JSON.parse(adminData);
        console.log('👑 Admin data:', parsedData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: 'admin',
          userName: parsedData.name || parsedData.email || 'Admin'
        });
      } catch (error) {
        console.error('Error parsing admin data:', error);
        clearAuth();
      }
    } else if (staffToken && staffData) {
      try {
        const parsedData = JSON.parse(staffData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: 'staff',
          userName: parsedData.name || parsedData.email || 'Staff'
        });
      } catch (error) {
        console.error('Error parsing staff data:', error);
        clearAuth();
      }
    } else if (userToken && userData) {
      try {
        const parsedData = JSON.parse(userData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: 'user',
          userName: parsedData.name || parsedData.email || 'User'
        });
      } catch (error) {
        console.error('Error parsing user data:', error);
        clearAuth();
      }
    } else {
      clearAuth();
    }
    
    setIsLoading(false);
  };

  const clearAuth = () => {
    setAuthStatus({
      isAuthenticated: false,
      userRole: '',
      userName: ''
    });
  };

  const openAuthModal = (type = 'user') => {
    console.log('Opening auth modal for:', type);
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthSuccess = (role) => {
    console.log('✅ Auth success, role:', role);
    checkAuth();
  };

  const handleLogout = () => {
    console.log('🚪 Logging out...');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminData');
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffData');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    localStorage.removeItem('refreshToken');
    
    setAuthStatus({
      isAuthenticated: false,
      userRole: '',
      userName: ''
    });
    
    window.location.href = '/';
  };

  // Listen for auth events
  useEffect(() => {
    const handleAuthEvent = (e) => {
      console.log('📡 Auth event received:', e.detail);
      checkAuth();
    };

    window.addEventListener('userLogin', handleAuthEvent);
    window.addEventListener('userLogout', handleAuthEvent);
    
    return () => {
      window.removeEventListener('userLogin', handleAuthEvent);
      window.removeEventListener('userLogout', handleAuthEvent);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {/* Debug route info */}
      <RouteDebugger />
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal}
          onClose={closeAuthModal}
          baseUrl={BASE_URL}
          onAuthSuccess={handleAuthSuccess}
        />
      )}

      <Routes>
        {/* Public Route - Landing Page */}
        <Route 
          path="/" 
          element={
            <LandingPage 
              openAuthModal={openAuthModal}
              authStatus={authStatus}
              onLogout={handleLogout}
            />
          } 
        />

        {/* User Routes */}
        <Route 
          path="/home/*" 
          element={
            <ProtectedRoute requiredRole="user" authStatus={authStatus}>
              <Home authStatus={authStatus} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        {/* Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminDashboard authStatus={authStatus} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/issues" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminIssuesPage authStatus={authStatus} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/analytics" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AnalyticsPage authStatus={authStatus} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminUsersPage authStatus={authStatus} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/audit" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AuditLogsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/staff" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminStaffPage authStatus={authStatus} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        
        {/* Staff Routes */}
        <Route 
          path="/staff/dashboard" 
          element={
            <ProtectedRoute requiredRole="staff" authStatus={authStatus}>
              <StaffDashboard authStatus={authStatus} onLogout={handleLogout} />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/staff/issues" 
          element={
            <ProtectedRoute requiredRole="staff" authStatus={authStatus}>
              <StaffIssuesPage authStatus={authStatus} />
            </ProtectedRoute>
          } 
        />


        {/* Fallback Routes */}
        <Route 
          path="/admin/*" 
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <Navigate to="/admin/dashboard" />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/staff/*" 
          element={
            <ProtectedRoute requiredRole="staff" authStatus={authStatus}>
              <Navigate to="/staff/dashboard" />
            </ProtectedRoute>
          } 
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

// Updated ProtectedRoute component
const ProtectedRoute = ({ children, requiredRole, authStatus }) => {
  const location = useLocation();
  
  console.log(`🛡️ ProtectedRoute check:`);
  console.log(`   Required Role: ${requiredRole}`);
  console.log(`   Current Auth:`, authStatus);
  console.log(`   Current Path: ${location.pathname}`);

  // If not authenticated, redirect to login
  if (!authStatus.isAuthenticated) {
    console.log('❌ Not authenticated, redirecting to /');
    return <Navigate to="/" state={{ from: location.pathname }} />;
  }

  // If authenticated but wrong role, redirect to appropriate dashboard
  if (requiredRole && authStatus.userRole !== requiredRole) {
    console.log(`⚠️ Role mismatch: User is ${authStatus.userRole}, but route requires ${requiredRole}`);
    
    let redirectTo = '/';
    if (authStatus.userRole === 'admin') {
      redirectTo = '/admin/dashboard';
    } else if (authStatus.userRole === 'staff') {
      redirectTo = '/staff/dashboard';
    } else if (authStatus.userRole === 'user') {
      redirectTo = '/home';
    }
    
    console.log(`   Redirecting to: ${redirectTo}`);
    return <Navigate to={redirectTo} />;
  }

  console.log(`✅ Access granted for ${authStatus.userRole} to ${requiredRole} route`);
  
  // Clone children and pass authStatus as prop
  const childrenWithProps = React.Children.map(children, child => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { 
        authStatus,
        onLogout: () => {
          localStorage.clear();
          window.location.href = '/';
        }
      });
    }
    return child;
  });

  return childrenWithProps;
};

// Token validation helper
const validateToken = (token) => {
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const isExpired = Date.now() >= payload.exp * 1000;
    
    if (isExpired) {
      console.log('Token expired:', new Date(payload.exp * 1000).toLocaleString());
      return false;
    }
    
    console.log('Token valid until:', new Date(payload.exp * 1000).toLocaleString());
    return true;
  } catch (error) {
    console.error('Error validating token:', error);
    return false;
  }
};

export default App;