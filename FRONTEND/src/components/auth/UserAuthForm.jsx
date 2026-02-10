import React, { useState } from 'react';
import axios from 'axios';

const UserAuthForm = ({
  formType,
  setFormType,
  baseUrl,
  setIsSubmitting,
  setError,
  onSuccess,
  isSubmitting
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    pincode: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });
  const [showOtpField, setShowOtpField] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const validateForm = () => {
    if (formType === 'signup') {
      if (!formData.name.trim()) {
        setError('Full name is required');
        return false;
      }
      if (!formData.email.trim()) {
        setError('Email is required');
        return false;
      }
      if (!formData.phone.trim()) {
        setError('Phone number is required');
        return false;
      }
      if (!formData.password) {
        setError('Password is required');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (!termsAccepted) {
        setError('Please accept the terms and conditions');
        return false;
      }
    } else {
      if (!formData.email && !formData.phone) {
        setError('Email or phone is required');
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
        identifier: formData.email,
        purpose: 'signup',
        userType: 'user'
      });
      
      if (response.data.success) {
        setShowOtpField(true);
        setError('');
        onSuccess('OTP sent to your email! Please check your inbox.', null);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
        endpoint = '/api/users/signup';
        payload = {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode
          // Note: OTP is handled separately in your backend
        };
      } else {
        endpoint = '/api/users/login';
        payload = {
          email: formData.email || formData.phone,
          password: formData.password
        };
      }
      
      const response = await axios.post(`${baseUrl}${endpoint}`, payload);
      
      console.log('Login Response:', response.data);
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
        onSuccess('Login successful!', '/home');
      } else if (response.data.message && response.data.accessToken) {
        // Handle alternative response format
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('user', JSON.stringify(response.data.user || response.data));
        onSuccess('Login successful!', '/home');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.message || 'Authentication failed');
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
          }}
          className={`tab ${formType === 'signup' ? 'active' : ''}`}
        >
          Sign UP
        </button>
        <button
          onClick={() => {
            setFormType('signin');
            setShowOtpField(false);
            setError('');
          }}
          className={`tab ${formType === 'signin' ? 'active' : ''}`}
        >
          Sign IN
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {formType === 'signup' ? (
          <>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={showOtpField}
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              className="form-input"
              value={formData.email}
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="street"
                placeholder="Street Address"
                className="form-input"
                value={formData.street}
                onChange={handleChange}
                disabled={showOtpField}
              />
              <input
                type="text"
                name="city"
                placeholder="City"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                disabled={showOtpField}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="state"
                placeholder="State/Region"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
                disabled={showOtpField}
              />
              <input
                type="text"
                name="pincode"
                placeholder="Pincode"
                className="form-input"
                value={formData.pincode}
                onChange={handleChange}
                disabled={showOtpField}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="password"
                name="password"
                placeholder="Password"
                className="form-input"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={showOtpField}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                className="form-input"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={showOtpField}
              />
            </div>
            
            {showOtpField && (
              <div className="mt-4">
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter OTP sent to your email"
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
                id="userTerms"
                name="userTerms"
                className="mr-2"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={showOtpField}
                required
              />
              <label htmlFor="userTerms" className="text-sm text-gray-600">
                I agree to the
                <a href="#" className="text-navy hover:underline ml-1">Terms of Service</a>
                and
                <a href="#" className="text-navy hover:underline ml-1">Privacy Policy</a>
              </label>
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              name="email"
              placeholder="Email or Phone"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <input type="checkbox" id="rememberMe" className="mr-2" />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">
                  Remember me
                </label>
              </div>
              <a href="#" className="text-sm text-navy hover:underline">
                Forgot Password?
              </a>
            </div>
          </>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-8 btn-gradient disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : 
           formType === 'signup' ? 
             (showOtpField ? 'SIGN UP' : 'SEND OTP') : 
             'SIGN IN'}
        </button>
      </form>
    </div>
  );
};

export default UserAuthForm;