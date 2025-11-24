/**
 * Calculate distance between two coordinates using Haversine formula
 * @param lat1 Latitude of point 1
 * @param lng1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lng2 Longitude of point 2
 * @returns Distance in kilometers
 */
export function calculateHaversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(2)); // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Extended School type with distance information
 */
export interface SchoolWithDistance {
  id: number;
  distanceInKm?: number;
}

/**
 * Sort schools by distance (ascending: closest first)
 */
export function sortSchoolsByDistance<T extends SchoolWithDistance>(
  schools: T[]
): T[] {
  return [...schools].sort((a, b) => {
    // Schools without distance go to the end
    if (a.distanceInKm === undefined) return 1;
    if (b.distanceInKm === undefined) return -1;
    return a.distanceInKm - b.distanceInKm;
  });
}
