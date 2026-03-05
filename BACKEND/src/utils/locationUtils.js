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
export const areComplaintsSimilar = (complaint1, complaint2, options = {}) => {
  const {
    maxDistance = 150, // meters
    titleSimilarityThreshold = 0.7,
    sameCategoryRequired = true
  } = options;

  // Check if they have valid coordinates
  if (!complaint1.location?.latitude || !complaint1.location?.longitude ||
      !complaint2.location?.latitude || !complaint2.location?.longitude) {
    return false;
  }

  // Calculate distance
  const distance = calculateDistance(
    complaint1.location.latitude,
    complaint1.location.longitude,
    complaint2.location.latitude,
    complaint2.location.longitude
  );

  if (distance > maxDistance) return false;

  // Check category if required
  if (sameCategoryRequired && complaint1.category !== complaint2.category) {
    return false;
  }

  // Simple title similarity (basic implementation)
  const title1 = complaint1.title.toLowerCase();
  const title2 = complaint2.title.toLowerCase();
  
  // Check if titles share significant words
  const words1 = new Set(title1.split(/\s+/));
  const words2 = new Set(title2.split(/\s+/));
  const commonWords = [...words1].filter(word => words2.has(word) && word.length > 3);
  
  const similarity = commonWords.length / Math.min(words1.size, words2.size);

  return similarity >= titleSimilarityThreshold;
};