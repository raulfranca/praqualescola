import { useState, useCallback, useMemo, useEffect } from "react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { sortSchoolsByDistance } from "@/lib/distanceCalculator";
import { calculateDistancesForSchools } from "@/lib/distanceMatrix";
import { recordAddressSetTimestamp } from "@/lib/utils";
import { 
  findNearbyCache, 
  getCachedDistances, 
  saveCacheForAddress,
  haversineDistanceMeters,
  checkIfAddressExistsInCache
} from "@/lib/distanceCacheService";

const DISTANCES_STORAGE_KEY = "school-distances";
const SYNC_STATUS_KEY = "supabase-sync-status";

interface SchoolDistances {
  [schoolId: number]: {
    distanceInKm: number;
    durationInMinutes?: number;
  };
}

export interface SchoolWithDistance extends School {
  distanceInKm?: number;
  durationInMinutes?: number;
}

/**
 * Generates a cache key based on location coordinates
 * Uses 7 decimal places to match Supabase storage format
 */
function getCacheKey(lat: number, lng: number): string {
  const roundedLat = Number(lat.toFixed(7));
  const roundedLng = Number(lng.toFixed(7));
  return `cachedDistances_${roundedLat}_${roundedLng}`;
}

/**
 * Hook to manage distance calculations between home location and schools
 * Provides manual calculation function with caching to control API costs
 */
export function useSchoolDistances(
  schools: School[],
  homeLocation: HomeLocation | null
) {
  const [distances, setDistances] = useState<SchoolDistances>(() => {
    // Load from localStorage on mount if we have a home location
    const stored = localStorage.getItem(DISTANCES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });
  const [isCalculating, setIsCalculating] = useState(false);

  /**
   * Check if we have cached distances for a given location
   */
  const hasCachedDistances = useCallback((location: HomeLocation): boolean => {
    const cacheKey = getCacheKey(location.lat, location.lng);
    return localStorage.getItem(cacheKey) !== null;
  }, []);

  /**
   * Migrates old format localStorage to new format with coordinate-based keys
   * Run once to ensure all cached data can be synced to Supabase
   */
  const migrateOldCacheFormat = useCallback((): void => {
    try {
      const hasSchoolDistances = localStorage.getItem(DISTANCES_STORAGE_KEY);
      const hasHomeLocation = localStorage.getItem("home-location");
      
      if (!hasSchoolDistances || !hasHomeLocation) {
        if (import.meta.env.DEV) console.log("📭 No old cache format found, skipping migration");
        return;
      }
      
      const homeLocation = JSON.parse(hasHomeLocation) as { lat: number; lng: number };
      const cacheKey = getCacheKey(homeLocation.lat, homeLocation.lng);
      
      if (localStorage.getItem(cacheKey)) {
        if (import.meta.env.DEV) console.log("✅ Coordinate-based cache key already exists, skipping migration");
        return;
      }
      
      if (import.meta.env.DEV) {
        console.log("🔄 Migrating old cache format to coordinate-based key...");
        console.log(`   Creating key: ${cacheKey}`);
      }
      
      localStorage.setItem(cacheKey, hasSchoolDistances);
      
      if (import.meta.env.DEV) {
        console.log("✅ Migration complete! Old data now has coordinate-based key");
      }
    } catch (error) {
      console.error("⚠️ Error during cache migration:", error);
    }
  }, []);

  /**
   * One-time sync: Upload localStorage distances to Supabase if not already there
   * Marks localStorage as synced to avoid future unnecessary checks
   */
  const syncLocalCacheToSupabase = useCallback(async (): Promise<void> => {
    const syncStatus = localStorage.getItem(SYNC_STATUS_KEY);
    const forceResync = import.meta.env.DEV;
    
    if (syncStatus === "synced" && !forceResync) {
      if (import.meta.env.DEV) console.log("✅ localStorage already synced with Supabase, skipping check");
      return;
    }

    if (forceResync && syncStatus === "synced") {
      if (import.meta.env.DEV) console.log("🔄 DEV MODE: Forcing resync...");
    }

    if (import.meta.env.DEV) console.log("🔍 Checking if local cache can contribute to shared cache...");

    try {
      const allKeys = Object.keys(localStorage);
      const cacheKeys = allKeys.filter(key => key.startsWith("cachedDistances_"));

      if (import.meta.env.DEV) {
        console.log(`📋 Found ${cacheKeys.length} cached addresses in localStorage:`, cacheKeys);
      }

      if (cacheKeys.length === 0) {
        if (import.meta.env.DEV) console.log("📭 No local cache found to sync");
        localStorage.setItem(SYNC_STATUS_KEY, "synced");
        return;
      }

      for (const cacheKey of cacheKeys) {
        if (import.meta.env.DEV) console.log(`\n🔍 Processing: ${cacheKey}`);
        
        const parts = cacheKey.replace("cachedDistances_", "").split("_");
        if (parts.length !== 2) {
          if (import.meta.env.DEV) console.warn(`⚠️ Invalid key format: ${cacheKey}`);
          continue;
        }

        // CRITICAL: Round to 7 decimals to match Supabase format
        const lat = Number(parseFloat(parts[0]).toFixed(7));
        const lng = Number(parseFloat(parts[1]).toFixed(7));

        if (isNaN(lat) || isNaN(lng)) {
          if (import.meta.env.DEV) console.warn(`⚠️ Invalid coordinates in key: ${cacheKey}`);
          continue;
        }

        if (import.meta.env.DEV) {
          console.log(`   Parsed coordinates: lat=${lat}, lng=${lng}`);
        }

        const existsInSupabase = await checkIfAddressExistsInCache(lat, lng);
        
        if (import.meta.env.DEV) {
          console.log(`   Exists in Supabase: ${existsInSupabase}`);
        }

        if (existsInSupabase) {
          if (import.meta.env.DEV) console.log(`   ⏭️ Skipping (already in Supabase)`);
          continue;
        }

        const cachedData = localStorage.getItem(cacheKey);
        if (!cachedData) {
          if (import.meta.env.DEV) console.warn(`   ⚠️ Key exists but no data found`);
          continue;
        }

        const distances = JSON.parse(cachedData) as SchoolDistances;
        const distancesArray = Object.entries(distances).map(([schoolId, data]) => ({
          schoolId: parseInt(schoolId),
          distanceInKm: data.distanceInKm,
          durationInMinutes: data.durationInMinutes
        }));

        if (distancesArray.length === 0) {
          if (import.meta.env.DEV) console.warn(`   ⚠️ No schools found in cache`);
          continue;
        }

        if (import.meta.env.DEV) {
          console.log(`   ☁️ Uploading 1 row with ${distancesArray.length} schools to Supabase...`);
        }

        await saveCacheForAddress(lat, lng, distancesArray);

        if (import.meta.env.DEV) {
          console.log(`   ✅ Successfully contributed local cache to shared cache`);
        }
      }

      localStorage.setItem(SYNC_STATUS_KEY, "synced");
      if (import.meta.env.DEV) console.log("\n🎉 Local cache sync complete!");
    } catch (error) {
      console.error("⚠️ Error during cache sync:", error);
    }
  }, []);

  // Run migration + sync on mount
  useEffect(() => {
    migrateOldCacheFormat();
    
    syncLocalCacheToSupabase().catch(err => {
      console.error("Background sync failed:", err);
    });
  }, [migrateOldCacheFormat, syncLocalCacheToSupabase]);

  /**
   * Clear all distance data when home location is removed
   */
  const clearDistances = useCallback(() => {
    if (import.meta.env.DEV) console.log("🏠 Clearing all distance calculations");
    setDistances({});
    localStorage.removeItem(DISTANCES_STORAGE_KEY);
  }, []);

  /**
   * Manually calculate and cache distances for a given location
   * Returns true on success, false on failure
   */
  const calculateAndCacheDistances = useCallback(async (
    location: HomeLocation
  ): Promise<boolean> => {
    const cacheKey = getCacheKey(location.lat, location.lng);
    
    // 1. Check local cache first (Offline-First)
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      if (import.meta.env.DEV) console.log("📦 Loading distances from local cache (Offline-First)");
      const cached = JSON.parse(cachedData) as SchoolDistances;
      setDistances(cached);
      localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(cached));
      return true;
    }

    // 2. Check Supabase shared cache for nearby address
    if (import.meta.env.DEV) console.log("🔍 Checking shared cache for nearby addresses...");
    
    try {
      const nearbyCoords = await findNearbyCache(location.lat, location.lng);
      
      if (nearbyCoords) {
        // Calculate actual distance to log
        const distanceMeters = haversineDistanceMeters(
          location.lat, 
          location.lng, 
          nearbyCoords.lat, 
          nearbyCoords.lng
        );
        
        if (import.meta.env.DEV) console.log(`📍 Found cached address ${distanceMeters.toFixed(0)}m away`);
        
        const cachedDistances = await getCachedDistances(nearbyCoords.lat, nearbyCoords.lng);
        
        if (cachedDistances.length > 0) {
          // Transform to SchoolDistances format
          const newDistances: SchoolDistances = {};
          cachedDistances.forEach(d => {
            newDistances[d.school_id] = {
              distanceInKm: d.distance_km,
              durationInMinutes: d.duration_minutes ?? undefined
            };
          });
          
          if (import.meta.env.DEV) console.log(`📦 Using shared cache (${cachedDistances.length} schools) - Zero API cost`);
          
          // Save to localStorage using USER'S coordinates (not nearby coords)
          setDistances(newDistances);
          localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(newDistances));
          localStorage.setItem(cacheKey, JSON.stringify(newDistances));
          
          return true;
        }
      } else {
        if (import.meta.env.DEV) console.log("❌ No nearby cached addresses found within 100m");
      }
    } catch (error) {
      console.error("⚠️ Error checking shared cache, falling back to API:", error);
      // Continue to API calculation if Supabase fails
    }

    // 3. Calculate via Google Distance Matrix API
    if (import.meta.env.DEV) {
      console.log("🏠 Home location set:", location.address);
      console.log("📍 Starting driving distance calculation for", schools.length, "schools...");
    }
    
    setIsCalculating(true);

    try {
      const results = await calculateDistancesForSchools(
        { lat: location.lat, lng: location.lng },
        schools.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, name: s.name }))
      );

      const newDistances: SchoolDistances = {};
      results.forEach((result) => {
        newDistances[result.schoolId] = {
          distanceInKm: result.distanceInKm,
          durationInMinutes: result.durationInMinutes,
        };
      });

      // Log first 5 schools for verification (dev only)
      if (import.meta.env.DEV) {
        const firstFive = results.slice(0, 5);
        firstFive.forEach((result) => {
          const method = result.usedFallback ? "(fallback)" : "(API)";
          console.log(`📏 School ${result.schoolId}: ${result.distanceInKm} km ${method}`);
        });
        console.log("✅ Driving distance calculation complete!");
        console.log("💾 Saving to localStorage...");
      }
      
      // Save to localStorage
      setDistances(newDistances);
      localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(newDistances));
      localStorage.setItem(cacheKey, JSON.stringify(newDistances));
      
      // Save to Supabase shared cache
      if (import.meta.env.DEV) console.log("☁️ Saving to shared cache for future users...");
      await saveCacheForAddress(location.lat, location.lng, results);
      
      // Record timestamp for rate limiting
      recordAddressSetTimestamp();
      
      setIsCalculating(false);
      return true;
    } catch (error) {
      console.error("❌ Failed to calculate distances:", error);
      setIsCalculating(false);
      return false;
    }
  }, [schools]);

  // Enrich schools with distance and duration data
  const schoolsWithDistances: SchoolWithDistance[] = useMemo(() => {
    return schools.map((school) => ({
      ...school,
      distanceInKm: distances[school.id]?.distanceInKm,
      durationInMinutes: distances[school.id]?.durationInMinutes,
    }));
  }, [schools, distances]);

  // Sorted schools (closest first)
  const sortedSchools = useMemo(() => {
    if (!homeLocation) return schoolsWithDistances;
    
    const sorted = sortSchoolsByDistance(schoolsWithDistances);
    if (import.meta.env.DEV) {
      console.log("🔢 Schools sorted by distance (closest 5):");
      sorted.slice(0, 5).forEach((school, index) => {
        console.log(`${index + 1}. ${school.name}: ${school.distanceInKm} km`);
      });
    }
    
    return sorted;
  }, [schoolsWithDistances, homeLocation]);

  return {
    schoolsWithDistances,
    sortedSchools,
    hasDistances: Object.keys(distances).length > 0,
    isCalculating,
    calculateAndCacheDistances,
    hasCachedDistances,
    clearDistances,
  };
}
