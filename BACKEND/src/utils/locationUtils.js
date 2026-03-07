// Location utility functions for duplicate detection

/**
 * Truncate coordinates to ~100-200 meter precision
 * At equator, 0.001 degree ≈ 111 meters
 * Using 3 decimal places gives ~111 meter precision
 * Using 4 decimal places gives ~11 meter precision
 */
export const truncateCoordinates = (latitude, longitude, precision = 3) => {
  if (!latitude || !longitude) return null;
  
  const factor = Math.pow(10, precision);
  return {
    latTrunc: Math.floor(latitude * factor) / factor,
    lngTrunc: Math.floor(longitude * factor) / factor
  };
};

/**
 * Calculate bounding box for a given coordinate with radius in meters
 * Rough approximation: 0.001 degree ≈ 111 meters at equator
 */
export const getBoundingBox = (latitude, longitude, radiusMeters = 150) => {
  if (!latitude || !longitude) return null;
  
  // Convert radius to degrees (approximate)
  const radiusDegrees = radiusMeters / 111000; // 111,000 meters per degree
  
  return {
    minLat: latitude - radiusDegrees,
    maxLat: latitude + radiusDegrees,
    minLng: longitude - radiusDegrees,
    maxLng: longitude + radiusDegrees
  };
};

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return Infinity;
  
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
};

/**
 * Check if two complaints are similar based on location and content
 */
export const areComplaintsSimilar = (newComplaint, existingComplaint, options = {}) => {
  const {
    maxDistance = 150,
    titleSimilarityThreshold = 0.3,  // Lower = more sensitive
    sameCategoryRequired = false
  } = options;

  // 1. Distance check (must be within radius)
  const distance = calculateDistance(
    newComplaint.location.latitude,
    newComplaint.location.longitude,
    existingComplaint.location.latitude,
    existingComplaint.location.longitude
  );
  
  if (distance > maxDistance) return false;

  // 2. Category/Department check
  if (sameCategoryRequired) {
    if (newComplaint.category !== existingComplaint.category) return false;
  }

  // 3. Title similarity using Levenshtein distance
  const similarity = calculateStringSimilarity(
    newComplaint.title.toLowerCase(),
    existingComplaint.title.toLowerCase()
  );

  // 4. Description keyword matching (optional enhancement)
  const descriptionSimilarity = calculateKeywordOverlap(
    newComplaint.description,
    existingComplaint.description
  );

  return similarity >= titleSimilarityThreshold || descriptionSimilarity > 0.4;
};

// Helper function for string similarity
function calculateStringSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

// Levenshtein distance algorithm
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}