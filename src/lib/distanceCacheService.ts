import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates the distance in meters between two coordinates using Haversine formula
 */
function haversineDistanceMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

/**
 * Searches Supabase for an address already calculated within 100m
 * Returns the coordinates of the found cache or null
 * 
 * Logic:
 * - Uses Haversine formula to calculate distance between coordinates
 * - Searches Supabase for addresses in an approximate radius (lat/lng ± 0.001 degrees)
 * - For each result, calculates exact distance
 * - If any is found < 100m, returns its coordinates
 * - If none found < 100m, returns null
 */
export async function findNearbyCache(
  lat: number,
  lng: number
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Approximate search: ±0.001 degrees (~111 meters at equator)
    const delta = 0.001;
    
    const { data, error } = await supabase
      .from("address_distance_cache")
      .select("lat, lng")
      .gte("lat", lat - delta)
      .lte("lat", lat + delta)
      .gte("lng", lng - delta)
      .lte("lng", lng + delta)
      .limit(100);
    
    if (error) {
      console.error("Error searching nearby cache:", error);
      return null;
    }
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Get unique coordinates (since multiple school entries share same lat/lng)
    const uniqueCoords = new Map<string, { lat: number; lng: number }>();
    for (const row of data) {
      const key = `${row.lat},${row.lng}`;
      if (!uniqueCoords.has(key)) {
        uniqueCoords.set(key, { lat: Number(row.lat), lng: Number(row.lng) });
      }
    }
    
    // Find first coordinate within 100 meters
    for (const coord of uniqueCoords.values()) {
      const distance = haversineDistanceMeters(lat, lng, coord.lat, coord.lng);
      if (distance < 100) {
        return coord;
      }
    }
    
    return null;
  } catch (err) {
    console.error("Error in findNearbyCache:", err);
    return null;
  }
}

/**
 * Gets all cached distances for a specific address
 * Returns all schools with their distances/durations or empty array
 */
export async function getCachedDistances(
  lat: number,
  lng: number
): Promise<Array<{
  school_id: number;
  distance_km: number;
  duration_minutes: number | null;
}>> {
  try {
    const { data, error } = await supabase
      .from("address_distance_cache")
      .select("school_id, distance_km, duration_minutes")
      .eq("lat", lat)
      .eq("lng", lng);
    
    if (error) {
      console.error("Error getting cached distances:", error);
      return [];
    }
    
    if (!data || data.length === 0) {
      return [];
    }
    
    return data.map(row => ({
      school_id: row.school_id,
      distance_km: Number(row.distance_km),
      duration_minutes: row.duration_minutes
    }));
  } catch (err) {
    console.error("Error in getCachedDistances:", err);
    return [];
  }
}

/**
 * Saves all calculated distances for an address to Supabase
 * Receives the result from Distance Matrix API and persists it
 */
export async function saveCacheForAddress(
  lat: number,
  lng: number,
  distances: Array<{
    schoolId: number;
    distanceInKm: number;
    durationInMinutes?: number;
  }>
): Promise<void> {
  try {
    if (distances.length === 0) {
      return;
    }
    
    // Transform input array to table format
    const rows = distances.map(d => ({
      lat: Number(lat.toFixed(7)),
      lng: Number(lng.toFixed(7)),
      school_id: d.schoolId,
      distance_km: Number(d.distanceInKm.toFixed(2)),
      duration_minutes: d.durationInMinutes ?? null
    }));
    
    const { error } = await supabase
      .from("address_distance_cache")
      .upsert(rows, { 
        onConflict: "lat,lng,school_id",
        ignoreDuplicates: false 
      });
    
    if (error) {
      console.error("Error saving to cache:", error);
    } else {
      console.log(`Saved ${rows.length} distances to shared cache`);
    }
  } catch (err) {
    console.error("Error in saveCacheForAddress:", err);
  }
}
