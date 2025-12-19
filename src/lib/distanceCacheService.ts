import { supabase } from "@/integrations/supabase/client";

/**
 * Calculates the distance in meters between two coordinates using Haversine formula
 */
export function haversineDistanceMeters(
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
    
    // Get coordinates (1 row per address now - no need to dedupe!)
    const coords = data.map(row => ({
      lat: Number(row.lat),
      lng: Number(row.lng)
    }));
    
    // Find first coordinate within 100 meters
    for (const coord of coords) {
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
      .select("distances")
      .eq("lat", lat)
      .eq("lng", lng)
      .maybeSingle();
    
    if (error) {
      console.error("Error getting cached distances:", error);
      return [];
    }
    
    if (!data?.distances) {
      return [];
    }
    
    // Transform JSONB back to array format
    // From: {"1": {"km": 44.31, "min": 41}, ...}
    // To: [{school_id: 1, distance_km: 44.31, duration_minutes: 41}, ...]
    const result: Array<{
      school_id: number;
      distance_km: number;
      duration_minutes: number | null;
    }> = [];
    
    const distances = data.distances as Record<string, { km: number; min: number | null }>;
    
    for (const [schoolId, values] of Object.entries(distances)) {
      result.push({
        school_id: parseInt(schoolId),
        distance_km: values.km,
        duration_minutes: values.min
      });
    }
    
    return result;
  } catch (err) {
    console.error("Error in getCachedDistances:", err);
    return [];
  }
}

/**
 * Saves all calculated distances for an address to Supabase
 * Uses JSONB to store all schools in a single row (denormalized)
 */
export async function saveCacheForAddress(
  lat: number,
  lng: number,
  distances: { schoolId: number; distanceInKm: number; durationInMinutes?: number }[]
): Promise<void> {
  try {
    if (distances.length === 0) {
      return;
    }
    
    // Transform array into JSONB object
    // Format: {"1": {"km": 44.31, "min": 41}, "2": {"km": 55.52, "min": 53}, ...}
    const distancesJsonb: Record<string, { km: number; min: number | null }> = {};
    
    distances.forEach(d => {
      distancesJsonb[d.schoolId.toString()] = {
        km: Number(d.distanceInKm.toFixed(2)),
        min: d.durationInMinutes ?? null
      };
    });

    const { error } = await supabase
      .from("address_distance_cache")
      .upsert({
        lat: Number(lat.toFixed(7)),
        lng: Number(lng.toFixed(7)),
        distances: distancesJsonb,
        created_at: new Date().toISOString()
      }, { 
        onConflict: "lat,lng",
        ignoreDuplicates: false 
      });

    if (error) {
      console.error("Error saving to cache:", error);
      // If constraint violation (coordinates out of region), log it
      if (error.code === '23514') {
        console.warn("⚠️ Address outside allowed region (60km from Pindamonhangaba)");
      }
    } else {
      if (import.meta.env.DEV) console.log(`✅ Saved 1 row with ${distances.length} schools to shared cache`);
    }
  } catch (err) {
    console.error("Error in saveCacheForAddress:", err);
  }
}

/**
 * Checks if a specific address already exists in Supabase cache
 * Returns true if the address exists
 */
export async function checkIfAddressExistsInCache(
  lat: number,
  lng: number
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("address_distance_cache")
      .select("id")
      .eq("lat", lat)
      .eq("lng", lng)
      .maybeSingle();
    
    if (error) {
      console.error("Error checking address in cache:", error);
      return false;
    }
    
    return !!data;
  } catch (err) {
    console.error("Error in checkIfAddressExistsInCache:", err);
    return false;
  }
}
