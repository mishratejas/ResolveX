import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import LandingPage from "./pages/public/LandingPage";
import Home from "./pages/user/Home";
import Profile from "./components/user/Profile";
import WorkspaceSelector from "./components/user/WorkspaceSelector";
import AuthModal from "./components/auth/AuthModal";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminIssuesPage from "./pages/admin/AdminIssuesPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminStaffPage from "./pages/admin/AdminStaffPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";
import StaffDashboard from "./pages/staff/StaffDashboard";
import StaffIssuesPage from "./pages/staff/StaffIssuesPage";
import AuditLogsPage from "./pages/admin/AuditLogsPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminDepartmentsPage from "./pages/admin/AdminDepartmentsPage";
import NotificationsPage from "./pages/public/NotificationPage";
const BASE_URL =
  import.meta.env.VITE_API_URL || "https://webster-2025.onrender.com";

  const getUserId = (role) => {
  try {
    if (role === 'admin') {
      // Check both possible storage keys for admin
      const adminData = localStorage.getItem('adminData') || localStorage.getItem('admin');
      if (adminData) {
        const parsed = JSON.parse(adminData);
        return parsed._id || parsed.id || null;
      }
    } else if (role === 'staff') {
      // Check both possible storage keys for staff
      const staffData = localStorage.getItem('staffData') || localStorage.getItem('staff');
      if (staffData) {
        const parsed = JSON.parse(staffData);
        return parsed._id || parsed.id || null;
      }
    } else if (role === 'user') {
      // Check both possible storage keys for user
      const userData = localStorage.getItem('user') || localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        return parsed._id || parsed.id || null;
      }
    }
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
  return null;
};

// Debug Component to see current route
const RouteDebugger = () => {
  const location = useLocation();

  useEffect(() => {
  }, [location]);

  return null;
};

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [authStatus, setAuthStatus] = useState({
    isAuthenticated: false,
    userRole: "",
    userName: "",
  });

  // Load current workspace on mount
  useEffect(() => {
    const savedWorkspace = localStorage.getItem("currentWorkspace");
    if (savedWorkspace) {
      try {
        setCurrentWorkspace(JSON.parse(savedWorkspace));
      } catch (error) {
        console.error("Error parsing workspace:", error);
        localStorage.removeItem("currentWorkspace");
      }
    }
  }, []);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();

    // Also check when window gains focus
    const handleFocus = () => {
      checkAuth();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const checkAuth = () => {

    const adminToken = localStorage.getItem("adminToken");
    const adminData = localStorage.getItem("adminData");
    const staffToken = localStorage.getItem("staffToken");
    const staffData = localStorage.getItem("staffData");
    const userToken = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");

    if (adminToken && adminData) {
      try {
        const parsedData = JSON.parse(adminData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: "admin",
          userName: parsedData.name || parsedData.email || "Admin",
        });
      } catch (error) {
        console.error("Error parsing admin data:", error);
        clearAuth();
      }
    } else if (staffToken && staffData) {
      try {
        const parsedData = JSON.parse(staffData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: "staff",
          userName: parsedData.name || parsedData.email || "Staff",
        });
      } catch (error) {
        console.error("Error parsing staff data:", error);
        clearAuth();
      }
    } else if (userToken && userData) {
      try {
        const parsedData = JSON.parse(userData);
        setAuthStatus({
          isAuthenticated: true,
          userRole: "user",
          userName: parsedData.name || parsedData.email || "User",
        });
      } catch (error) {
        console.error("Error parsing user data:", error);
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
      userRole: "",
      userName: "",
    });
  };

  const openAuthModal = (type = "user") => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  const handleAuthSuccess = (role) => {

    checkAuth();

    // 🚀 After successful login, redirect to profile for workspace selection
    if (role === "user") {
      window.location.href = "/user/profile";
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setCurrentWorkspace(workspace);
  };

  const handleLogout = () => {

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminData");
    localStorage.removeItem("staffToken");
    localStorage.removeItem("staffData");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("currentWorkspace"); // Clear workspace on logout

    setCurrentWorkspace(null);
    setAuthStatus({
      isAuthenticated: false,
      userRole: "",
      userName: "",
    });

    window.location.href = "/";
  };

  // Listen for auth events
  useEffect(() => {
    const handleAuthEvent = (e) => {

      checkAuth();
    };

    window.addEventListener("userLogin", handleAuthEvent);
    window.addEventListener("userLogout", handleAuthEvent);

    return () => {
      window.removeEventListener("userLogin", handleAuthEvent);
      window.removeEventListener("userLogout", handleAuthEvent);
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

        {/* 🚀 NEW: User Profile Route - Entry point after login */}
        <Route
          path="/user/profile"
          element={
            <ProtectedRoute requiredRole="user" authStatus={authStatus}>
              <Profile currentUser={authStatus} />
            </ProtectedRoute>
          }
        />

        {/* 🚀 NEW: Workspace Selector Route */}
        <Route
          path="/user/select-workspace"
          element={
            <ProtectedRoute requiredRole="user" authStatus={authStatus}>
              <WorkspaceSelector onWorkspaceSelect={handleWorkspaceSelect} />
            </ProtectedRoute>
          }
        />

        {/* 🚀 UPDATED: User Home/Dashboard Route - Requires workspace */}
        <Route
          path="/home/*"
          element={
            <ProtectedRoute requiredRole="user" authStatus={authStatus}>
              {currentWorkspace ? (
                <Home
                  authStatus={authStatus}
                  onLogout={handleLogout}
                  currentWorkspace={currentWorkspace}
                />
              ) : (
                <Navigate to="/user/select-workspace" replace />
              )}
            </ProtectedRoute>
          }
        >
          {/* Nested routes inside Home */}
          <Route
            path="profile"
            element={<Profile currentUser={authStatus} />}
          />
        </Route>

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
          path="/admin/departments"
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminDepartmentsPage />
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

        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute requiredRole="admin" authStatus={authStatus}>
              <AdminSettingsPage
                authStatus={authStatus}
                onLogout={handleLogout}
              />
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

        {/* 🔔 Notification Page - Available to all authenticated users */}
        <Route
          path="/notifications"
          element={
            authStatus.isAuthenticated ? (
              <NotificationsPage 
                userId={getUserId(authStatus.userRole)} 
                userType={authStatus.userRole === 'admin' ? 'Admin' : authStatus.userRole === 'staff' ? 'Staff' : 'User'} 
              />
            ) : (
              <Navigate to="/" />
            )
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

        {/* User fallback - redirect to profile if no workspace, otherwise home */}
        <Route
          path="/user/*"
          element={
            <ProtectedRoute requiredRole="user" authStatus={authStatus}>
              {currentWorkspace ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/user/profile" replace />
              )}
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

  // If not authenticated, redirect to login
  if (!authStatus.isAuthenticated) {
    return <Navigate to="/" state={{ from: location.pathname }} />;
  }

  // If authenticated but wrong role, redirect to appropriate dashboard
  if (requiredRole && authStatus.userRole !== requiredRole) {
    console.log(
      `⚠️ Role mismatch: User is ${authStatus.userRole}, but route requires ${requiredRole}`,
    );

    let redirectTo = "/";
    if (authStatus.userRole === "admin") {
      redirectTo = "/admin/dashboard";
    } else if (authStatus.userRole === "staff") {
      redirectTo = "/staff/dashboard";
    } else if (authStatus.userRole === "user") {
      redirectTo = "/user/profile";
    }

    console.log(`   Redirecting to: ${redirectTo}`);
    return <Navigate to={redirectTo} />;
  }



  // Clone children and pass authStatus as prop
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        authStatus,
        onLogout: () => {
          localStorage.clear();
          window.location.href = "/";
        },
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
    const payload = JSON.parse(atob(token.split(".")[1]));
    const isExpired = Date.now() >= payload.exp * 1000;

    if (isExpired) {
      console.log(
        "Token expired:",
        new Date(payload.exp * 1000).toLocaleString(),
      );
      return false;
    }

    console.log(
      "Token valid until:",
      new Date(payload.exp * 1000).toLocaleString(),
    );
    return true;
  } catch (error) {
    console.error("Error validating token:", error);
    return false;
  }
};

export default App;