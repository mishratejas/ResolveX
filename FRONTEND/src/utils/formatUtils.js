// Format Date
export const formatDate = (date, format = 'short') => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const options = {
    short: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { month: 'long', day: 'numeric', year: 'numeric' },
    time: { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  };

  return d.toLocaleDateString('en-US', options[format] || options.short);
};

// Format Relative Time (e.g., "2 hours ago")
export const formatRelativeTime = (date) => {
  if (!date) return 'N/A';
  
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';

  const now = new Date();
  const diffMs = now - d;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) !== 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) !== 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDays / 365)} year${Math.floor(diffDays / 365) !== 1 ? 's' : ''} ago`;
};

// Format Number with Commas
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Format Percentage
export const formatPercentage = (value, decimals = 1) => {
  if (value === null || value === undefined) return '0%';
  return `${Number(value).toFixed(decimals)}%`;
};

// Format File Size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return 'N/A';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Truncate Text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Capitalize First Letter of Each Word
export const capitalizeWords = (str) => {
  if (!str) return '';
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

// Format Phone Number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const cleaned = phone.toString().replace(/\D/g, '');
  
  // Format as (XXX) XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
};

// Format Currency
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

// Format Status (capitalize and replace hyphens)
export const formatStatus = (status) => {
  if (!status) return '';
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format Address
export const formatAddress = (address) => {
  if (!address) return 'No address';
  
  if (typeof address === 'string') return address;
  
  // If address is an object with street, city, state, etc.
  const parts = [];
  if (address.street) parts.push(address.street);
  if (address.city) parts.push(address.city);
  if (address.state) parts.push(address.state);
  if (address.pincode) parts.push(address.pincode);
  
  return parts.join(', ') || 'No address';
};

// Format coordinates to readable string
export const formatCoordinates = (latitude, longitude, precision = 6) => {
  if (!latitude || !longitude) return 'No coordinates';
  return `${latitude.toFixed(precision)}°, ${longitude.toFixed(precision)}°`;
};

// Format distance in meters to readable string
export const formatDistance = (meters) => {
  if (!meters && meters !== 0) return 'Unknown distance';
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  return `${(meters / 1000).toFixed(1)}km away`;
};

/**
 * Calculate keyword overlap percentage between two strings
 * This is used for duplicate detection
 * @param {string} text1 - First text to compare
 * @param {string} text2 - Second text to compare
 * @returns {number} Overlap percentage (0-100)
 */
export const calculateKeywordOverlap = (text1, text2) => {
  if (!text1 || !text2) return 0;
  
  // Convert to lowercase and split into words
  const words1 = text1.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(word => word.length > 2); // Ignore short words
  
  const words2 = text2.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
  
  if (words1.length === 0 || words2.length === 0) return 0;
  
  // Find common words
  const set1 = new Set(words1);
  const set2 = new Set(words2);
  const commonWords = [...set1].filter(word => set2.has(word));
  
  // Calculate percentage based on the smaller set
  const smallerSetSize = Math.min(set1.size, set2.size);
  const overlapPercentage = (commonWords.length / smallerSetSize) * 100;
  
  return Math.round(overlapPercentage);
};

/**
 * Calculate similarity score between two complaints
 * Combines location proximity and text similarity
 * @param {Object} complaint1 - First complaint
 * @param {Object} complaint2 - Second complaint
 * @returns {Object} Similarity score and details
 */
export const calculateComplaintSimilarity = (complaint1, complaint2) => {
  let score = 0;
  const details = {};
  
  // Check location proximity (if both have coordinates)
  if (complaint1.location?.latitude && complaint1.location?.longitude &&
      complaint2.location?.latitude && complaint2.location?.longitude) {
    
    const distance = calculateDistance(
      complaint1.location.latitude,
      complaint1.location.longitude,
      complaint2.location.latitude,
      complaint2.location.longitude
    );
    
    details.distance = distance;
    
    // Score based on distance (closer = higher score)
    if (distance < 50) score += 40;
    else if (distance < 100) score += 30;
    else if (distance < 200) score += 20;
    else if (distance < 500) score += 10;
  }
  
  // Check title similarity
  if (complaint1.title && complaint2.title) {
    const titleOverlap = calculateKeywordOverlap(complaint1.title, complaint2.title);
    details.titleOverlap = titleOverlap;
    score += titleOverlap * 0.3; // 30% weight
  }
  
  // Check description similarity
  if (complaint1.description && complaint2.description) {
    const descOverlap = calculateKeywordOverlap(complaint1.description, complaint2.description);
    details.descriptionOverlap = descOverlap;
    score += descOverlap * 0.3; // 30% weight
  }
  
  // Check category match
  if (complaint1.category && complaint2.category && 
      complaint1.category === complaint2.category) {
    details.categoryMatch = true;
    score += 20;
  }
  
  return {
    score: Math.min(100, Math.round(score)),
    details
  };
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

export default {
  formatDate,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  formatFileSize,
  truncateText,
  capitalizeWords,
  formatPhoneNumber,
  formatCurrency,
  formatStatus,
  formatAddress,
  formatCoordinates,
  formatDistance,
  calculateKeywordOverlap,
  calculateComplaintSimilarity,
  calculateDistance
};