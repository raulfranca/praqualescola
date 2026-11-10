import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { escolasSemDistancia, sortSchoolsByDistance } from "@/lib/distanceCalculator";
import { calculateDistancesForSchools } from "@/lib/distanceMatrix";
import { recordAddressSetTimestamp } from "@/lib/utils";

const DISTANCES_STORAGE_KEY = "school-distances";

interface SchoolDistances {
  [schoolId: string]: {
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
 */
function getCacheKey(lat: number, lng: number): string {
  // Round to 5 decimal places (~1m precision) to avoid floating point issues
  const roundedLat = Math.round(lat * 100000) / 100000;
  const roundedLng = Math.round(lng * 100000) / 100000;
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
  // Conjuntos de escolas faltantes já tentados nesta montagem (evita repetir chamadas à API)
  const tentativasRef = useRef(new Set<string>());

  /**
   * Calcula só as escolas que faltam em `base` e devolve o cache completo (ou `base`, se nada mudou).
   * Não grava nada: quem chama decide.
   */
  const completarDistancias = useCallback(async (
    location: HomeLocation,
    base: SchoolDistances
  ): Promise<SchoolDistances> => {
    const faltando = escolasSemDistancia(schools, base);
    if (faltando.length === 0) return base;
    const tentativa = `${getCacheKey(location.lat, location.lng)}:${faltando.map((s) => s.id).join(",")}`;
    if (tentativasRef.current.has(tentativa)) return base;
    tentativasRef.current.add(tentativa);

    console.log("🧩 Completing distance cache for", faltando.length, "missing schools");
    try {
      const results = await calculateDistancesForSchools(
        { lat: location.lat, lng: location.lng },
        faltando.map(s => ({ id: s.id, lat: s.lat, lng: s.lng, name: s.name }))
      );
      const completo: SchoolDistances = { ...base };
      results.forEach((result) => {
        if (!Number.isFinite(result.distanceInKm)) return;
        completo[result.schoolId] = {
          distanceInKm: result.distanceInKm,
          durationInMinutes: result.durationInMinutes,
        };
      });
      return completo;
    } catch (error) {
      console.error("❌ Failed to complete distances:", error);
      return base;
    }
  }, [schools]);

  const gravarDistancias = useCallback((location: HomeLocation, dados: SchoolDistances) => {
    localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(dados));
    localStorage.setItem(getCacheKey(location.lat, location.lng), JSON.stringify(dados));
  }, []);

  // Escola carregada sem distância (ex.: cadastrada depois do cálculo): calcula só ela e junta ao cache.
  useEffect(() => {
    if (!homeLocation || schools.length === 0 || Object.keys(distances).length === 0) return;
    let cancelado = false;
    completarDistancias(homeLocation, distances).then((completo) => {
      if (cancelado || completo === distances) return;
      gravarDistancias(homeLocation, completo);
      setDistances(completo);
    });
    return () => {
      cancelado = true;
    };
  }, [homeLocation, schools, distances, completarDistancias, gravarDistancias]);

  /**
   * Check if we have cached distances for a given location
   */
  const hasCachedDistances = useCallback((location: HomeLocation): boolean => {
    const cacheKey = getCacheKey(location.lat, location.lng);
    return localStorage.getItem(cacheKey) !== null;
  }, []);

  /**
   * Clear all distance data when home location is removed
   */
  const clearDistances = useCallback(() => {
    console.log("🏠 Clearing all distance calculations");
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
    
    // Check cache first (Zero Cost)
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log("📦 Loading distances from cache (Zero API Cost)");
      const cached = await completarDistancias(location, JSON.parse(cachedData) as SchoolDistances);
      setDistances(cached);
      gravarDistancias(location, cached);
      return true;
    }

    console.log("🏠 Home location set:", location.address);
    console.log("📍 Starting driving distance calculation for", schools.length, "schools...");
    
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

      // Log first 5 schools for verification
      const firstFive = results.slice(0, 5);
      firstFive.forEach((result) => {
        const method = result.usedFallback ? "(fallback)" : "(API)";
        console.log(`📏 School ${result.schoolId}: ${result.distanceInKm} km ${method}`);
      });

      console.log("✅ Driving distance calculation complete!");
      console.log("💾 Saving to localStorage and location-specific cache...");
      
      // Save to both general storage and location-specific cache
      setDistances(newDistances);
      localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(newDistances));
      localStorage.setItem(cacheKey, JSON.stringify(newDistances));
      
      // Record timestamp for rate limiting
      recordAddressSetTimestamp();
      
      setIsCalculating(false);
      return true;
    } catch (error) {
      console.error("❌ Failed to calculate distances:", error);
      setIsCalculating(false);
      return false;
    }
  }, [schools, completarDistancias, gravarDistancias]);

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
    console.log("🔢 Schools sorted by distance (closest 5):");
    sorted.slice(0, 5).forEach((school, index) => {
      console.log(`${index + 1}. ${school.name}: ${school.distanceInKm} km`);
    });
    
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
