// Utility function to calculate distance between two coordinates using Haversine formula
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
};

// Office location coordinates
export const OFFICE_LATITUDE = 10.073055260044226;
export const OFFICE_LONGITUDE = 76.36695098009646;

// Parse location string and calculate distance from office
export const getDistanceFromOffice = (location?: string): number | null => {
  if (!location) return null;
  
  const coords = location.split(',');
  if (coords.length !== 2) return null;
  
  const lat = parseFloat(coords[0].trim());
  const lon = parseFloat(coords[1].trim());
  
  if (isNaN(lat) || isNaN(lon)) return null;
  
  return calculateDistance(OFFICE_LATITUDE, OFFICE_LONGITUDE, lat, lon);
};

// Format location with distance
export const formatLocationWithDistance = (location?: string): string => {
  if (!location) return '-';
  
  const distance = getDistanceFromOffice(location);
  if (distance === null) return location;
  
  return `${location} (${distance.toFixed(2)} km from office)`;
};

