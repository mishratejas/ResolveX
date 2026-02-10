import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StaffAuthForm = ({
  formType,
  setFormType,
  baseUrl,
  setIsSubmitting,
  setError,
  onSuccess,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    workEmail: '',
    staffId: '',
    phone: '',
    password: '',
    confirmPassword: '',
    otp: '',
    staffIdOrEmail: '',
    departmentId: '' // This stores the department ID
  });
  const [departments, setDepartments] = useState([]);
  const [showOtpField, setShowOtpField] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch departments on component mount
  useEffect(() => {
    if (formType === 'signup') {
      fetchDepartments();
    }
  }, [formType]);

  const fetchDepartments = async () => {
    try {
      console.log('🌐 Fetching departments from:', `${baseUrl}/api/staff/departments`);
      const response = await axios.get(`${baseUrl}/api/staff/departments`);
      console.log('📋 Departments received:', response.data);
      
      if (response.data.success && response.data.data) {
        setDepartments(response.data.data);
      } else {
        console.error('❌ No departments found:', response.data);
        setError('Failed to load departments. Please refresh the page.');
      }
    } catch (error) {
      console.error('❌ Error fetching departments:', error);
      setError('Unable to load departments. Please try again later.');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    console.log(`🔄 Changing ${name} to:`, value);
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (formType === 'signup') {
      if (!formData.firstname.trim() || !formData.lastname.trim()) {
        setError('First and last name are required');
        return false;
      }
      if (!formData.workEmail.trim()) {
        setError('Work email is required');
        return false;
      }
      if (!formData.staffId.trim()) {
        setError('Staff ID is required');
        return false;
      }
      if (!formData.departmentId) {
        setError('Please select a department');
        return false;
      }
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!termsAccepted) {
        setError('Please accept the staff terms of service');
        return false;
      }
    } else {
      if (!formData.staffIdOrEmail) {
        setError('Staff ID or Email is required');
        return false;
      }
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
    }
    return true;
  };

  const handleSendOtp = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await axios.post(`${baseUrl}/api/otp/request`, {
        identifier: formData.workEmail,
        purpose: 'signup',
        userType: 'staff'
      });
      
      if (response.data.success) {
        setShowOtpField(true);
        onSuccess('OTP sent to your work email! Please check your inbox.', null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📤 Form submitted with data:', formData);
    console.log('📤 Selected department ID:', formData.departmentId);
    
    // Find which department was selected for logging
    const selectedDept = departments.find(dept => dept._id === formData.departmentId);
    console.log('📤 Selected department name:', selectedDept?.name);
    
    if (formType === 'signup') {
      if (!showOtpField) {
        handleSendOtp();
        return;
      }
      
      if (!formData.otp) {
        setError('OTP is required');
        return;
      }
    }
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError('');
    
    try {
      let endpoint, payload;
      
      if (formType === 'signup') {
        endpoint = '/api/staff/register';
        payload = {
          name: `${formData.firstname} ${formData.lastname}`,
          email: formData.workEmail,
          password: formData.password,
          phone: formData.phone,
          staffId: formData.staffId,
          departmentId: formData.departmentId, // This should be the ObjectId
          otp: formData.otp
        };
        console.log('🚀 Sending registration payload:', payload);
      } else {
        endpoint = '/api/staff/login';
        payload = {
          staffIdOrEmail: formData.staffIdOrEmail,
          password: formData.password
        };
      }
      
      const response = await axios.post(`${baseUrl}${endpoint}`, payload);
      console.log('✅ Registration response:', response.data);
      
      if (response.data.accessToken) {
        localStorage.setItem('staffToken', response.data.accessToken);
        localStorage.setItem('staffData', JSON.stringify(response.data.staff));
        onSuccess('Staff registration successful!', '/staff/dashboard');
      } else if (response.data.success) {
        onSuccess(response.data.message, null);
      }
    } catch (error) {
      console.error('❌ Registration error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex justify-center border-b-2 border-gray-200 mb-8">
        <button
          onClick={() => {
            setFormType('signup');
            setShowOtpField(false);
            setError('');
            setFormData({
              firstname: '',
              lastname: '',
              workEmail: '',
              staffId: '',
              phone: '',
              password: '',
              confirmPassword: '',
              otp: '',
              staffIdOrEmail: '',
              departmentId: ''
            });
          }}
          className={`tab ${formType === 'signup' ? 'active' : ''}`}
        >
          Staff Registration
        </button>
        <button
          onClick={() => {
            setFormType('signin');
            setShowOtpField(false);
            setError('');
            setFormData({
              firstname: '',
              lastname: '',
              workEmail: '',
              staffId: '',
              phone: '',
              password: '',
              confirmPassword: '',
              otp: '',
              staffIdOrEmail: '',
              departmentId: ''
            });
          }}
          className={`tab ${formType === 'signin' ? 'active' : ''}`}
        >
          Staff Login
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {formType === 'signup' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="firstname"
                placeholder="First name"
                className="form-input"
                value={formData.firstname}
                onChange={handleChange}
                required
                disabled={showOtpField}
              />
              <input
                type="text"
                name="lastname"
                placeholder="Last name"
                className="form-input"
                value={formData.lastname}
                onChange={handleChange}
                required
                disabled={showOtpField}
              />
            </div>
            
            <input
              type="email"
              name="workEmail"
              placeholder="Work Email"
              className="form-input"
              value={formData.workEmail}
              onChange={handleChange}
              required
              disabled={showOtpField}
            />
            
            <input
              type="text"
              name="staffId"
              placeholder="Staff ID"
              className="form-input"
              value={formData.staffId}
              onChange={handleChange}
              required
              disabled={showOtpField}
            />
            
            <input
              type="tel"
              name="phone"
              placeholder="Phone (10 digits)"
              className="form-input"
              value={formData.phone}
              onChange={handleChange}
              pattern="[0-9]{10}"
              required
              disabled={showOtpField}
            />
            
            {/* Department Dropdown - THIS IS THE KEY FIX */}
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">
                Select Department *
              </label>
              <select
                name="departmentId" // This MUST match formData.departmentId
                value={formData.departmentId}
                onChange={handleChange}
                className="form-input w-full"
                required
                disabled={showOtpField}
              >
                <option value="">-- Select your department --</option>
                {departments.map((dept) => (
                  <option 
                    key={dept._id} 
                    value={dept._id} // This sends the ID
                  >
                    {dept.name} 
                    {dept.category && ` (${dept.category})`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose the department you work in
              </p>
              {departments.length === 0 && (
                <p className="text-xs text-yellow-600 mt-1 animate-pulse">
                  Loading departments...
                </p>
              )}
              {formData.departmentId && (
                <p className="text-xs text-green-600 mt-1">
                  Selected department ID: {formData.departmentId}
                </p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Password (min. 6 characters)"
                  className="form-input w-full"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  disabled={showOtpField}
                  minLength="6"
                />
              </div>
              <div>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  className="form-input w-full"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  disabled={showOtpField}
                />
              </div>
            </div>
            
            {showOtpField && (
              <div className="mt-4">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                  OTP Verification
                </label>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter OTP sent to your work email"
                  className="form-input"
                  value={formData.otp}
                  onChange={handleChange}
                  required
                />
              </div>
            )}
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="staffTerms"
                name="staffTerms"
                className="mr-2"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={showOtpField}
                required
              />
              <label htmlFor="staffTerms" className="text-sm text-gray-600">
                I agree to the
                <a href="#" className="text-navy hover:underline ml-1">Staff Terms of Service</a>
              </label>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 btn-gradient disabled:opacity-50"
            >
              {isSubmitting ? 'Processing...' : 
               formType === 'signup' ? 
                 (showOtpField ? 'REGISTER AS STAFF' : 'SEND OTP') : 
                 'STAFF LOGIN'}
            </button>
          </>
        ) : (
          <>
            {/* Login form remains same */}
          </>
        )}
      </form>
    </div>
  );
};

export default StaffAuthForm;