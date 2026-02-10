import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  User, 
  Briefcase, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Building,
  Phone,
  MapPin,
  UserPlus,
  Key,
  Clock,
  Loader2,
  IdCard,
  Copy,
  Hash,
  Info
} from 'lucide-react';

const AuthModal = ({ 
  isOpen, 
  onClose, 
  userType: initialUserType = 'user', 
  formType: initialFormType = 'signup', 
  setUserType, 
  setFormType,
  baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000',
  onAuthSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeForm, setActiveForm] = useState(initialFormType);
  const [userType, setLocalUserType] = useState(initialUserType);
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [emailValue, setEmailValue] = useState('');
  const [staffIdValue, setStaffIdValue] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [generatedStaffId, setGeneratedStaffId] = useState('');
  const [showStaffIdInfo, setShowStaffIdInfo] = useState(false);
  const [loginMethod, setLoginMethod] = useState('staffId');
  const formRef = useRef(null);

  // Update parent components
  useEffect(() => {
    if (setUserType) setUserType(userType);
  }, [userType, setUserType]);

  useEffect(() => {
    if (setFormType) setFormType(activeForm);
  }, [activeForm, setFormType]);

  // Fetch departments when staff registration is shown
  useEffect(() => {
    if (userType === 'staff' && activeForm === 'signup' && isOpen) {
      fetchDepartments();
    }
  }, [userType, activeForm, isOpen]);

  const fetchDepartments = async () => {
    try {
      setLoadingDepartments(true);
      console.log('🌐 Fetching departments...');
      
      const response = await fetch(`${baseUrl}/api/staff/departments`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      console.log('📋 Departments API response:', result);
      
      if (response.ok && result.success) {
        setDepartments(result.data || result.departments || []);
        console.log('✅ Loaded departments:', result.data?.length || result.departments?.length || 0);
      } else {
        console.error('❌ Failed to fetch departments:', result.message || 'No data received');
        // Fallback to hardcoded departments
        setDepartments(getFallbackDepartments());
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      // Fallback to hardcoded departments
      setDepartments(getFallbackDepartments());
    } finally {
      setLoadingDepartments(false);
    }
  };

  const getFallbackDepartments = () => {
    return [
      { _id: '1', name: 'Water Supply', category: 'utilities' },
      { _id: '2', name: 'Electricity', category: 'utilities' },
      { _id: '3', name: 'Road Maintenance', category: 'infrastructure' },
      { _id: '4', name: 'Sanitation', category: 'infrastructure' },
      { _id: '5', name: 'Police', category: 'public-safety' },
      { _id: '6', name: 'Fire Department', category: 'public-safety' },
      { _id: '7', name: 'City Administration', category: 'administrative' },
      { _id: '8', name: 'Health Services', category: 'health' },
      { _id: '9', name: 'Education Department', category: 'education' },
      { _id: '10', name: 'Public Works', category: 'other' }
    ];
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      if (formRef.current) {
        formRef.current.scrollTop = 0;
      }
    } else {
      document.body.style.overflow = 'unset';
      // Reset form when closing
      setOtpSent(false);
      setOtpTimer(0);
      setEmailValue('');
      setStaffIdValue('');
      setOtpValue('');
      setError('');
      setSuccess('');
      setDepartments([]);
      setGeneratedStaffId('');
      setShowStaffIdInfo(false);
      setLoginMethod('staffId');
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    let timer;
    if (otpTimer > 0) {
      timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpTimer]);

  const handleUserTypeChange = (type) => {
    setLocalUserType(type);
    setError('');
    setSuccess('');
    setOtpSent(false);
    setOtpTimer(0);
    setEmailValue('');
    setStaffIdValue('');
    setOtpValue('');
    setDepartments([]);
    setGeneratedStaffId('');
    setShowStaffIdInfo(false);
    setLoginMethod('staffId');
    // Set default form type
    if (type === 'admin') {
      setActiveForm('signin');
    } else {
      setActiveForm('signup');
    }
  };

  const handleSendOtp = async () => {
    // For staff login, we don't need OTP
    if (userType === 'staff' && activeForm === 'signin') {
      return;
    }

    if (!emailValue) {
      setError('Please enter email first');
      return;
    }

    if (otpTimer > 0) {
      setError(`Please wait ${otpTimer} seconds before resending OTP`);
      return;
    }

    try {
      setError('');
      setSuccess('');
      setIsSubmitting(true);

      const purpose = 'signup';
      
      console.log('📤 Sending OTP request:', {
        identifier: emailValue,
        purpose,
        userType,
        type: 'email'
      });

      const res = await fetch(`${baseUrl}/api/otp/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: emailValue,
          purpose,
          userType,
          type: 'email'
        })
      });

      const result = await res.json();
      console.log('📥 OTP Response:', result);

      if (!res.ok) {
        throw new Error(result.message || 'Failed to send OTP');
      }

      setOtpSent(true);
      setOtpTimer(60);
      setSuccess('OTP sent successfully to your email');
    } catch (err) {
      console.error('❌ OTP Error:', err);
      setError(err.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateStaffId = () => {
    // Generate a 5-digit staff ID starting with 'S'
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `S${randomNum}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
      console.log('📝 Form data:', data);
      console.log('📝 Active form:', activeForm);
      console.log('👤 User type:', userType);

      let url = '';
      let payload = {};

      if (activeForm === 'signup') {
        // For signup - admin can't sign up
        if (userType === 'admin') {
          throw new Error('Admin registration is not allowed. Use predefined credentials.');
        }
        
        if (userType === 'user') {
          url = `${baseUrl}/api/otp/signup/user`;
          payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            street: data.street || '',
            city: data.city || '',
            state: data.state || '',
            pincode: data.pincode || '',
            otp: data.otp
          };
        } else if (userType === 'staff') {
          url = `${baseUrl}/api/otp/signup/staff`;
          
          // Auto-generate a 5-digit staff ID
          const autoStaffId = generateStaffId();
          setGeneratedStaffId(autoStaffId); // Store for display
          
          payload = {
            name: data.name,
            email: data.email,
            password: data.password,
            phone: data.phone,
            staffId: autoStaffId,
            departmentId: data.departmentId || data.department || '',
            otp: data.otp
          };
        }
      } else {
        // For login - No OTP required
        if (userType === 'admin') {
          url = `${baseUrl}/api/admin/login`;
          payload = {
            adminId: data.email,
            password: data.password
          };
        } else if (userType === 'user') {
          url = `${baseUrl}/api/users/login`;
          payload = {
            email: data.email,
            password: data.password
          };
        } else if (userType === 'staff') {
          url = `${baseUrl}/api/staff/login`;
          
          // Get identifier based on login method
          const identifier = data.identifier || data.email;
          
          // Send flexible payload
          payload = {
            staffIdOrEmail: identifier,
            password: data.password
          };
          
          console.log('👷 Staff login payload:', payload);
        }
      }

      console.log('🚀 Making request to:', url);
      console.log('📦 Payload:', payload);

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Handle response
      const contentType = res.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        result = await res.json();
      } else {
        const text = await res.text();
        console.error('❌ Non-JSON response:', text);
        throw new Error(`Server returned ${res.status}: ${text}`);
      }
      
      console.log('✅ Response:', result);

      if (!res.ok) {
        // Handle specific error messages
        if (result.message) {
          if (result.message.includes('Staff ID') && result.message.includes('required')) {
            // Backend expects staffId, not email
            throw new Error('Please use Staff ID for login instead of email');
          }
          throw new Error(result.message);
        }
        // Handle staff-specific errors
        if (userType === 'staff' && result.code === 'STAFF_NOT_FOUND') {
          throw new Error('Staff ID not found in system. Please contact administration.');
        }
        throw new Error(result.message || result.error || 'Authentication failed');
      }

      // Store tokens and user data
      if (userType === 'user') {
        const accessToken = result.accessToken || result.data?.accessToken || result.token;
        const userData = result.user || result.data?.user || result.data;
        
        console.log('💾 Storing user data:', { accessToken, userData });
        
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        if (userData) localStorage.setItem('user', JSON.stringify(userData));
        
        window.dispatchEvent(new CustomEvent('userLogin', { detail: { role: 'user', data: userData } }));
        
        if (onAuthSuccess) onAuthSuccess('user');
        
        setSuccess('Registration successful! Redirecting to user portal...');
        
        setTimeout(() => {
          onClose();
          window.location.href = '/home';
        }, 1500);
      } else if (userType === 'staff') {
        const accessToken = result.accessToken || result.data?.accessToken || result.token;
        const staffData = result.staff || result.data?.staff || result.data;
        
        console.log('💾 Storing staff data:', { accessToken, staffData });
        
        if (accessToken) {
          localStorage.setItem('staffToken', accessToken);
          localStorage.setItem('staffAccessToken', accessToken);
        }
        if (staffData) {
          localStorage.setItem('staff', JSON.stringify(staffData));
          localStorage.setItem('staffData', JSON.stringify(staffData));
        }
        
        window.dispatchEvent(new CustomEvent('userLogin', { 
          detail: { role: 'staff', data: staffData } 
        }));
        
        if (onAuthSuccess) onAuthSuccess('staff');
        
        // Show success message with generated Staff ID for registration
        let successMsg = '';
        if (activeForm === 'signup') {
          successMsg = `Staff registration successful! Your Staff ID: ${generatedStaffId}. Redirecting...`;
        } else {
          successMsg = 'Staff login successful! Redirecting...';
        }
        setSuccess(successMsg);
        
        setTimeout(() => {
          onClose();
          window.location.href = '/staff/dashboard';
        }, activeForm === 'signup' ? 3000 : 1500); // Give more time to see the Staff ID
      } else if (userType === 'admin') {
        const accessToken = result.accessToken || result.data?.accessToken || result.token;
        const adminData = result.admin || result.data?.admin || result.data;
        
        console.log('💾 Storing admin credentials:', { accessToken, adminData });
        
        if (accessToken) {
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('adminAccessToken', accessToken);
        }
        if (adminData) {
          localStorage.setItem('admin', JSON.stringify(adminData));
          localStorage.setItem('adminData', JSON.stringify(adminData));
        }
        
        if (onAuthSuccess) onAuthSuccess('admin');
        
        setSuccess('Admin login successful! Redirecting...');
        
        setTimeout(() => {
          onClose();
          window.location.href = '/admin/dashboard';
        }, 1500);
      }

    } catch (err) {
      console.error('❌ Submit Error:', err);
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Staff ID copied to clipboard!');
  };

  const userTypes = [
    { 
      id: 'user', 
      label: 'Community Member', 
      icon: User,
      description: 'Report issues and track resolutions',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'staff', 
      label: 'Staff Member', 
      icon: Briefcase,
      description: 'Handle and resolve community issues',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'admin', 
      label: 'Administrator', 
      icon: Shield,
      description: 'Login with predefined credentials',
      color: 'from-green-500 to-emerald-500'
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25 }}
          className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]"
          style={{ height: '85vh' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-cyan-500 p-6 flex-shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-1">
                Resolve<span className="text-cyan-200">X</span>
              </h2>
              <p className="text-white/80 text-sm">Community Issue Resolution Platform</p>
            </div>
          </div>

          {/* Scrollable Content Area */}
          <div 
            ref={formRef}
            className="flex-1 overflow-y-auto p-6"
            style={{ 
              maxHeight: 'calc(85vh - 180px)',
              scrollBehavior: 'smooth'
            }}
          >
            {/* User Type Selection */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3 text-center">
                Select Your Role
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {userTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => handleUserTypeChange(type.id)}
                    className={`relative group p-4 rounded-lg border transition-all duration-200 ${
                      userType === type.id
                        ? `border-transparent bg-gradient-to-br ${type.color} text-white shadow-md`
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
                        userType === type.id 
                          ? 'bg-white/20' 
                          : `bg-gradient-to-br ${type.color}`
                      }`}>
                        <type.icon className="w-5 h-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-sm mb-1">{type.label}</h4>
                      <p className={`text-xs ${
                        userType === type.id ? 'text-white/90' : 'text-gray-500'
                      }`}>
                        {type.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle between Sign In and Sign Up - Only for user and staff */}
            {userType !== 'admin' && (
              <div className="mb-6">
                <div className="flex rounded-lg bg-gray-100 p-1 max-w-xs mx-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveForm('signup');
                      setError('');
                      setSuccess('');
                      setOtpSent(false);
                      setOtpTimer(0);
                      setOtpValue('');
                      setGeneratedStaffId('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeForm === 'signup'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <UserPlus className="w-4 h-4 inline mr-2" />
                    Sign Up
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveForm('signin');
                      setError('');
                      setSuccess('');
                      setOtpSent(false);
                      setOtpTimer(0);
                      setOtpValue('');
                      setGeneratedStaffId('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                      activeForm === 'signin'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-800 text-sm">Error</p>
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                </motion.div>
              )}
              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2"
                >
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-green-800 text-sm">Success</p>
                    <p className="text-green-600 text-xs">{success}</p>
                    {generatedStaffId && activeForm === 'signup' && userType === 'staff' && (
                      <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-green-800">Your Staff ID:</p>
                            <p className="text-green-700 text-lg font-mono">{generatedStaffId}</p>
                            <p className="text-green-600 text-xs">Save this ID for login</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(generatedStaffId)}
                            className="p-2 bg-green-200 text-green-700 rounded hover:bg-green-300"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Auth Form */}
            <motion.form
              key={`${userType}-${activeForm}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              {/* Admin Login Form */}
              {userType === 'admin' ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-2" />
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      placeholder="Enter admin email"
                      className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Admin Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        placeholder="Enter admin password"
                        className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* User/Staff Form */
                <>
                  {/* Login Method Selector - Only for Staff Login */}
                  {userType === 'staff' && activeForm === 'signin' && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Login With:
                      </label>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => setLoginMethod('staffId')}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                            loginMethod === 'staffId'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Hash className="w-4 h-4" />
                          Staff ID
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginMethod('email')}
                          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${
                            loginMethod === 'email'
                              ? 'bg-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Mail className="w-4 h-4" />
                          Email
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Choose whether to login with Staff ID or Email
                      </p>
                    </div>
                  )}

                  {/* Login Identifier Field */}
                  {userType === 'staff' && activeForm === 'signin' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {loginMethod === 'staffId' ? (
                          <>
                            <Hash className="w-4 h-4 inline mr-2" />
                            Staff ID *
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email Address *
                          </>
                        )}
                      </label>
                      <input
                        type={loginMethod === 'staffId' ? 'text' : 'email'}
                        name="identifier"
                        required
                        value={loginMethod === 'staffId' ? staffIdValue : emailValue}
                        onChange={(e) => {
                          if (loginMethod === 'staffId') {
                            setStaffIdValue(e.target.value);
                          } else {
                            setEmailValue(e.target.value);
                          }
                        }}
                        placeholder={
                          loginMethod === 'staffId' 
                            ? 'Enter your Staff ID (e.g., S1234)' 
                            : 'Enter your email'
                        }
                        className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                      />
                      {loginMethod === 'staffId' && (
                        <p className="text-xs text-gray-500 mt-1 flex items-center">
                          <Info className="w-3 h-3 mr-1" />
                          Staff ID format: S followed by 4 digits (e.g., S1234)
                        </p>
                      )}
                    </div>
                  ) : (
                    // Email field for User Login/Registration or Staff Registration
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={emailValue}
                        onChange={(e) => setEmailValue(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                      />
                      {userType === 'staff' && activeForm === 'signup' && (
                        <p className="text-xs text-gray-500 mt-1">
                          A unique Staff ID will be automatically generated for you
                        </p>
                      )}
                    </div>
                  )}

                  {/* OTP Field - Only for signup (not for staff login) */}
                  {activeForm === 'signup' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          <Key className="w-4 h-4 inline mr-2" />
                          OTP Verification *
                        </label>
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={!emailValue || otpTimer > 0 || isSubmitting}
                          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <Loader2 className="w-3 h-3 animate-spin inline" />
                          ) : otpTimer > 0 ? (
                            `Send OTP (${otpTimer}s)`
                          ) : (
                            'Send OTP'
                          )}
                        </button>
                      </div>
                      {otpSent ? (
                        <>
                          <input
                            type="text"
                            name="otp"
                            required
                            value={otpValue}
                            onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            maxLength="6"
                            placeholder="Enter 6-digit OTP"
                            className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            Enter the 6-digit OTP sent to your email. Valid for 10 minutes.
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Click "Send OTP" to receive verification code
                        </p>
                      )}
                    </div>
                  )}

                  {/* Password Field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Lock className="w-4 h-4 inline mr-2" />
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        required
                        minLength="6"
                        placeholder="Enter your password (min. 6 characters)"
                        className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Additional fields for signup */}
                  {activeForm === 'signup' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name *
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Enter your full name"
                          className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          required
                          pattern="[0-9]{10}"
                          placeholder="Enter 10-digit phone number"
                          className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                        />
                      </div>

                      {/* DEPARTMENT DROPDOWN - STAFF ONLY */}
                      {userType === 'staff' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Building className="w-4 h-4 inline mr-2" />
                            Department *
                          </label>
                          <select
                            name="departmentId"
                            required
                            disabled={loadingDepartments}
                            className="w-full p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                          >
                            <option value="">Select your department</option>
                            {departments.map((dept) => (
                              <option key={dept._id || dept.id} value={dept._id || dept.id}>
                                {dept.name} {dept.category && `(${dept.category})`}
                              </option>
                            ))}
                          </select>
                          {loadingDepartments && (
                            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Loading departments...
                            </p>
                          )}
                          {!loadingDepartments && departments.length === 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                              No departments available. Please contact administration.
                            </p>
                          )}
                        </div>
                      )}

                      {/* USER ADDRESS FIELDS */}
                      {userType === 'user' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <MapPin className="w-4 h-4 inline mr-2" />
                            Address (Optional)
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              name="street"
                              placeholder="Street"
                              className="col-span-2 p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                            <input
                              type="text"
                              name="city"
                              placeholder="City"
                              className="p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                            <input
                              type="text"
                              name="state"
                              placeholder="State"
                              className="p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                            <input
                              type="text"
                              name="pincode"
                              placeholder="Pincode"
                              className="p-3 text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                            />
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  isSubmitting || 
                  (userType !== 'admin' && activeForm === 'signup' && (!otpSent || !otpValue))
                }
                className={`w-full py-3 px-6 rounded-lg font-semibold text-base transition-all duration-300 mt-6 ${
                  isSubmitting || 
                  (userType !== 'admin' && activeForm === 'signup' && (!otpSent || !otpValue))
                    ? 'bg-gray-400 cursor-not-allowed'
                    : `bg-gradient-to-r ${
                        userType === 'user' ? 'from-blue-600 to-cyan-500' :
                        userType === 'staff' ? 'from-purple-600 to-pink-500' :
                        'from-green-600 to-emerald-500'
                      } hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]`
                } text-white flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {userType === 'admin' ? 'Admin Login' : 
                     activeForm === 'signin' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Terms and Conditions */}
              {activeForm === 'signup' && userType !== 'admin' && (
                <p className="text-center text-xs text-gray-500 mt-4">
                  By creating an account, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-800 font-medium">
                    Privacy Policy
                  </a>
                </p>
              )}
            </motion.form>

            {/* Demo Credentials */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 text-sm mb-2 flex items-center gap-2">
                <Shield className="w-3 h-3" />
                Testing Instructions
              </h4>
              <div className="space-y-1 text-xs text-blue-700">
                {userType === 'admin' ? (
                  <>
                    <div>Admin Credentials:</div>
                    <div>Email: admin@resolvex.com</div>
                    <div>Password: admin123</div>
                  </>
                ) : userType === 'staff' && activeForm === 'signup' ? (
                  <>
                    <div>Staff Registration:</div>
                    <div>1. Enter email and click "Send OTP"</div>
                    <div>2. Check email for 6-digit OTP</div>
                    <div>3. Staff ID will be auto-generated</div>
                    <div>4. Select department from dropdown</div>
                    <div>5. Click "Create Account"</div>
                    <div className="font-bold mt-1">SAVE YOUR STAFF ID!</div>
                  </>
                ) : userType === 'staff' && activeForm === 'signin' ? (
                  <>
                    <div>Staff Login:</div>
                    <div>Choose login method (Staff ID or Email)</div>
                    <div>Staff ID format: S followed by 4 digits</div>
                    <div>Example: S1234</div>
                    <div>Password: your-password</div>
                  </>
                ) : activeForm === 'signin' ? (
                  <>
                    <div>User Login:</div>
                    <div>Use your registered credentials</div>
                    <div>Email: your-email@example.com</div>
                    <div>Password: your-password</div>
                  </>
                ) : (
                  <>
                    <div>User Registration:</div>
                    <div>1. Enter your email and click "Send OTP"</div>
                    <div>2. Check your email for the 6-digit OTP</div>
                    <div>3. Enter OTP and fill remaining fields</div>
                    <div>4. Click "Create Account"</div>
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;