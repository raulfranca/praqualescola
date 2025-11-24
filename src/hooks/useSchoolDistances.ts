import { useState, useEffect, useMemo } from "react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { calculateHaversineDistance, sortSchoolsByDistance } from "@/lib/distanceCalculator";

const DISTANCES_STORAGE_KEY = "school-distances";

interface SchoolDistances {
  [schoolId: number]: number; // schoolId -> distanceInKm
}

export interface SchoolWithDistance extends School {
  distanceInKm?: number;
}

/**
 * Hook to manage distance calculations between home location and schools
 * Automatically calculates distances when home location changes
 * Persists distances in localStorage
 */
export function useSchoolDistances(
  schools: School[],
  homeLocation: HomeLocation | null
) {
  const [distances, setDistances] = useState<SchoolDistances>(() => {
    // Load from localStorage on mount
    const stored = localStorage.getItem(DISTANCES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  });

  // Calculate distances when home location or schools change
  useEffect(() => {
    if (!homeLocation) {
      // Clear distances when home location is removed
      console.log("🏠 Home location cleared - removing all distance calculations");
      setDistances({});
      localStorage.removeItem(DISTANCES_STORAGE_KEY);
      return;
    }

    console.log("🏠 Home location set:", homeLocation.address);
    console.log("📍 Calculating distances for", schools.length, "schools...");

    const newDistances: SchoolDistances = {};
    
    schools.forEach((school) => {
      const distance = calculateHaversineDistance(
        homeLocation.lat,
        homeLocation.lng,
        school.lat,
        school.lng
      );
      newDistances[school.id] = distance;
      
      // Log first 5 schools for verification
      if (Object.keys(newDistances).length <= 5) {
        console.log(`📏 ${school.name}: ${distance} km`);
      }
    });

    console.log("✅ Distance calculation complete!");
    console.log("💾 Saving to localStorage...");
    
    setDistances(newDistances);
    localStorage.setItem(DISTANCES_STORAGE_KEY, JSON.stringify(newDistances));
  }, [homeLocation, schools]);

  // Enrich schools with distance data
  const schoolsWithDistances: SchoolWithDistance[] = useMemo(() => {
    return schools.map((school) => ({
      ...school,
      distanceInKm: distances[school.id],
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
  };
}
