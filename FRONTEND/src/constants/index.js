// TODO: Update with complete constants from backend

// Complaint Categories
export const COMPLAINT_CATEGORIES = [
  { id: 'road', label: 'Road & Infrastructure' },
  { id: 'sanitation', label: 'Sanitation & Waste' },
  { id: 'water', label: 'Water Supply' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'security', label: 'Security' },
  { id: 'transport', label: 'Transport' },
  { id: 'other', label: 'Other' }
];

// Status Options
export const COMPLAINT_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
};

// Priority Levels
export const PRIORITY_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
};

// User Roles
export const USER_ROLES = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN: 'admin'
};

// Department Categories
export const DEPARTMENT_CATEGORIES = [
  'utilities',
  'infrastructure',
  'public-safety',
  'administrative',
  'health',
  'education',
  'other'
];

// Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  ADMIN_TOKEN: 'adminToken',
  STAFF_TOKEN: 'staffToken',
  USER_DATA: 'user',
  ADMIN_DATA: 'admin',
  STAFF_DATA: 'staff'
};

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_FILES: 5,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
};

// Date Formats
export const DATE_FORMATS = {
  SHORT: 'MMM DD, YYYY',
  LONG: 'MMMM DD, YYYY',
  WITH_TIME: 'MMM DD, YYYY HH:mm'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// API Endpoints
export const API_ENDPOINTS = {
  // User
  USER_LOGIN: '/api/users/login',
  USER_SIGNUP: '/api/users/signup',
  USER_PROFILE: '/api/users/profile',
  
  // Staff
  STAFF_LOGIN: '/api/staff/login',
  STAFF_REGISTER: '/api/staff/register',
  STAFF_ISSUES: '/api/staff/issues',
  
  // Admin
  ADMIN_LOGIN: '/api/admin/login',
  ADMIN_DASHBOARD: '/api/admin/dashboard',
  ADMIN_ANALYTICS: '/api/admin/analytics',
  
  // Complaints
  COMPLAINTS: '/api/user_issues',
  MY_COMPLAINTS: '/api/user_issues/my-issues',
  
  // OTP
  OTP_REQUEST: '/api/otp/request',
  OTP_VERIFY: '/api/otp/verify',
  
  // Upload
  UPLOAD_SINGLE: '/api/upload/single',
  UPLOAD_MULTIPLE: '/api/upload/multiple'
};

export default {
  COMPLAINT_CATEGORIES,
  COMPLAINT_STATUS,
  PRIORITY_LEVELS,
  USER_ROLES,
  DEPARTMENT_CATEGORIES,
  STORAGE_KEYS,
  FILE_UPLOAD,
  DATE_FORMATS,
  PAGINATION,
  API_ENDPOINTS
};