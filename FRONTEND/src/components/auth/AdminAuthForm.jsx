import React, { useState } from 'react';
import axios from 'axios';
import { Shield, LogIn, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

const AdminAuthForm = ({
  baseUrl,
  setIsSubmitting,
  setError,
  onSuccess,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    adminId: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.adminId || !formData.password) {
      setError('Admin ID and password are required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('🔐 Admin login attempt:', { adminId: formData.adminId });
      
      const response = await axios.post(`${baseUrl}/api/admin/login`, {
        adminId: formData.adminId,
        password: formData.password,
        rememberMe: rememberMe
      });

      console.log('✅ Admin login response:', response.data);

      if (response.data.accessToken) {
        const { accessToken, refreshToken, admin } = response.data;
        
        // Store tokens
        localStorage.setItem('adminToken', accessToken);
        localStorage.setItem('adminRefreshToken', refreshToken);
        localStorage.setItem('adminData', JSON.stringify(admin));
        
        // Set token expiry
        if (rememberMe) {
          localStorage.setItem('adminTokenExpiry', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString());
        } else {
          sessionStorage.setItem('adminToken', accessToken);
        }

        // Dispatch login event
        window.dispatchEvent(new CustomEvent('adminLogin', { 
          detail: { 
            adminId: admin.adminId,
            name: admin.name,
            email: admin.email,
            role: admin.role,
            permissions: admin.permissions || ['full_access']
          }
        }));

        onSuccess('Admin login successful! Redirecting...', '/admin/dashboard');
      } else if (response.data.success) {
        onSuccess(response.data.message, '/admin/dashboard');
      }
    } catch (error) {
      console.error('❌ Admin login error:', error.response?.data || error);
      
      if (error.response?.status === 401) {
        setError('Invalid credentials. Please try again.');
      } else if (error.response?.status === 403) {
        setError('Account disabled or access revoked.');
      } else if (error.response?.status === 429) {
        setError('Too many login attempts. Try again in 15 minutes.');
      } else {
        setError(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Admin Login Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Administrator Access</h2>
        <p className="text-gray-600 mt-2">Elevated privileges for system management</p>
      </div>

      {/* Security Alert */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">Secure Admin Portal</p>
            <p className="text-xs text-yellow-700 mt-1">
              This area contains sensitive system operations. All activities are logged.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Admin ID Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Admin Identifier
          </label>
          <div className="relative">
            <input
              type="text"
              name="adminId"
              placeholder="Admin ID, Email, or Username"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              value={formData.adminId}
              onChange={handleChange}
              required
              autoComplete="username"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Master Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Enter your secure password"
              className="w-full px-4 py-3 text-sm border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all pr-12"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="8"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Minimum 8 characters with uppercase, lowercase, and numbers
          </p>
        </div>

        {/* Options */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="adminRememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label htmlFor="adminRememberMe" className="ml-2 text-sm text-gray-700">
              Remember this device
            </label>
          </div>
          <a 
            href="#"
            className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            onClick={(e) => {
              e.preventDefault();
              setError('Contact system administrator for password reset.');
            }}
          >
            Forgot Password?
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
            isSubmitting
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-lg active:scale-[0.98]'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Authenticating...
            </>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Access Admin Console
            </>
          )}
        </button>

        {/* Admin Credentials Hint */}
        <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-gray-600" />
            <p className="text-sm font-medium text-gray-700">Default Admin Credentials</p>
          </div>
          <div className="text-xs text-gray-600 space-y-1">
            <div className="grid grid-cols-2 gap-2">
              <span>ID:</span>
              <code className="bg-white px-2 py-1 rounded">admin</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span>Email:</span>
              <code className="bg-white px-2 py-1 rounded">admin@resolvex.com</code>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <span>Password:</span>
              <code className="bg-white px-2 py-1 rounded">admin123</code>
            </div>
          </div>
        </div>

        {/* Security Features */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>2FA Ready</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Activity Logging</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>Session Timeout</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>IP Whitelisting</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminAuthForm;