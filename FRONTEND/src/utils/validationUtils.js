// TODO: Update with more comprehensive validation rules

// Validate Email
export const isValidEmail = (email) => {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate Phone Number
export const isValidPhone = (phone) => {
  if (!phone) return false;
  
  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Check if it's a 10-digit number
  return cleaned.length === 10;
};

// Validate Password
export const validatePassword = (password) => {
  const errors = [];
  
  if (!password) {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }
  
  if (password.length > 100) {
    errors.push('Password must be less than 100 characters');
  }
  
  // Optional: Add more rules
  // if (!/[A-Z]/.test(password)) {
  //   errors.push('Password must contain at least one uppercase letter');
  // }
  
  // if (!/[a-z]/.test(password)) {
  //   errors.push('Password must contain at least one lowercase letter');
  // }
  
  // if (!/[0-9]/.test(password)) {
  //   errors.push('Password must contain at least one number');
  // }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate OTP
export const isValidOTP = (otp) => {
  if (!otp) return false;
  
  // OTP should be 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp.toString());
};

// Validate Image File
export const validateImageFile = (file) => {
  const errors = [];
  
  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }
  
  // Check file size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push('File size must be less than 5MB');
  }
  
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errors.push('File must be a valid image (JPEG, PNG, or WebP)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate Form Data
export const validateForm = (formData, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const rule = rules[field];
    const value = formData[field];
    
    // Required validation
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = rule.message || `${field} is required`;
      return;
    }
    
    // Skip other validations if value is empty and not required
    if (!value && !rule.required) return;
    
    // Min length validation
    if (rule.minLength && value.length < rule.minLength) {
      errors[field] = `${field} must be at least ${rule.minLength} characters`;
      return;
    }
    
    // Max length validation
    if (rule.maxLength && value.length > rule.maxLength) {
      errors[field] = `${field} must be less than ${rule.maxLength} characters`;
      return;
    }
    
    // Email validation
    if (rule.type === 'email' && !isValidEmail(value)) {
      errors[field] = 'Invalid email address';
      return;
    }
    
    // Phone validation
    if (rule.type === 'phone' && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number (must be 10 digits)';
      return;
    }
    
    // Custom validation
    if (rule.validator && !rule.validator(value)) {
      errors[field] = rule.message || `Invalid ${field}`;
      return;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Validate URL
export const isValidURL = (url) => {
  if (!url) return false;
  
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate Staff ID
export const isValidStaffId = (staffId) => {
  if (!staffId) return false;
  
  // Staff ID should start with 'S' followed by 4 digits
  const staffIdRegex = /^S\d{4}$/;
  return staffIdRegex.test(staffId);
};

// Validate Pincode
export const isValidPincode = (pincode) => {
  if (!pincode) return false;
  
  // Pincode should be 6 digits
  const pincodeRegex = /^\d{6}$/;
  return pincodeRegex.test(pincode.toString());
};

// Sanitize Input (basic XSS prevention)
export const sanitizeInput = (input) => {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// Validate Date
export const isValidDate = (date) => {
  if (!date) return false;
  
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

// Validate Future Date
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  
  const d = new Date(date);
  const now = new Date();
  return d > now;
};

// Validate Past Date
export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  
  const d = new Date(date);
  const now = new Date();
  return d < now;
};

export default {
  isValidEmail,
  isValidPhone,
  validatePassword,
  isValidOTP,
  validateImageFile,
  validateForm,
  isValidURL,
  isValidStaffId,
  isValidPincode,
  sanitizeInput,
  isValidDate,
  isFutureDate,
  isPastDate
};