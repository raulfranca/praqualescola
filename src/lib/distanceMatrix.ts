export interface DistanceMatrixResult {
  distance: string;
  duration: string;
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

export interface SchoolDistanceResult {
  schoolId: number;
  distanceInKm: number;
  durationInMinutes?: number;
  usedFallback: boolean;
}

/**
 * Calculate driving distances from home to multiple schools using Google Maps Distance Matrix API
 * Batches requests to respect API limits (25 destinations per request)
 * Falls back to Haversine * 1.3 (tortuosity factor) if API fails
 */
export async function calculateDistancesForSchools(
  origin: { lat: number; lng: number },
  schools: Array<{ id: number; lat: number; lng: number; name: string }>
): Promise<SchoolDistanceResult[]> {
  const BATCH_SIZE = 25; // Google Maps API limit
  const TORTUOSITY_FACTOR = 1.3;
  const results: SchoolDistanceResult[] = [];

  if (import.meta.env.DEV) console.log(`🚗 Starting Distance Matrix calculation for ${schools.length} schools...`);

  // Check if Google Maps API is available
  if (!window.google?.maps?.DistanceMatrixService) {
    console.error("❌ Google Maps Distance Matrix Service not loaded - using fallback for all schools");
    return schools.map(school => ({
      schoolId: school.id,
      distanceInKm: calculateHaversineFallback(origin, school) * TORTUOSITY_FACTOR,
      usedFallback: true,
    }));
  }

  // Batch schools into groups of 25
  const batches: typeof schools[] = [];
  for (let i = 0; i < schools.length; i += BATCH_SIZE) {
    batches.push(schools.slice(i, i + BATCH_SIZE));
  }

  if (import.meta.env.DEV) console.log(`📦 Split into ${batches.length} batches`);

  // Process each batch
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    if (import.meta.env.DEV) console.log(`⏳ Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} schools)...`);

    try {
      const batchResults = await calculateBatch(origin, batch, TORTUOSITY_FACTOR);
      results.push(...batchResults);
      
      // Log progress
      const successCount = batchResults.filter(r => !r.usedFallback).length;
      if (import.meta.env.DEV) console.log(`✅ Batch ${batchIndex + 1} complete: ${successCount}/${batch.length} via API, ${batch.length - successCount} via fallback`);
    } catch (error) {
      console.error(`❌ Batch ${batchIndex + 1} failed:`, error);
      // Use fallback for entire batch
      const fallbackResults = batch.map(school => ({
        schoolId: school.id,
        distanceInKm: calculateHaversineFallback(origin, school) * TORTUOSITY_FACTOR,
        usedFallback: true,
      }));
      results.push(...fallbackResults);
    }

    // Small delay between batches to avoid rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  const apiCount = results.filter(r => !r.usedFallback).length;
  if (import.meta.env.DEV) console.log(`🎉 Distance calculation complete: ${apiCount} via API, ${results.length - apiCount} via fallback`);

  return results;
}

/**
 * Calculate distances for a single batch using Distance Matrix API
 */
async function calculateBatch(
  origin: { lat: number; lng: number },
  schools: Array<{ id: number; lat: number; lng: number; name: string }>,
  tortuosityFactor: number
): Promise<SchoolDistanceResult[]> {
  return new Promise((resolve) => {
    const service = new window.google.maps.DistanceMatrixService();

    service.getDistanceMatrix(
      {
        origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
        destinations: schools.map(s => new window.google.maps.LatLng(s.lat, s.lng)),
        travelMode: window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status !== 'OK' || !response) {
          console.error("Distance Matrix API error:", status);
          resolve(
            schools.map(school => ({
              schoolId: school.id,
              distanceInKm: calculateHaversineFallback(origin, school) * tortuosityFactor,
              usedFallback: true,
            }))
          );
          return;
        }

        const results = schools.map((school, index) => {
          const element = response.rows[0]?.elements[index];

          if (element && element.status === 'OK') {
            // API success - use real driving distance and duration
            return {
              schoolId: school.id,
              distanceInKm: Number((element.distance.value / 1000).toFixed(2)),
              durationInMinutes: Math.ceil(element.duration.value / 60),
              usedFallback: false,
            };
          } else {
            // API failed for this specific school - use fallback
            return {
              schoolId: school.id,
              distanceInKm: calculateHaversineFallback(origin, school) * tortuosityFactor,
              usedFallback: true,
            };
          }
        });

        resolve(results);
      }
    );
  });
}

/**
 * Calculate straight-line distance using Haversine formula
 * Used as fallback when Distance Matrix API fails
 */
function calculateHaversineFallback(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(destination.lat - origin.lat);
  const dLng = toRadians(destination.lng - origin.lng);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(origin.lat)) * Math.cos(toRadians(destination.lat)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Number(distance.toFixed(2));
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Legacy single-distance calculation (kept for backwards compatibility)
export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceMatrixResult | null> {
  return new Promise((resolve) => {
    try {
      if (!window.google?.maps?.DistanceMatrixService) {
        console.error("Google Maps Distance Matrix Service not loaded");
        resolve(null);
        return;
      }

      const service = new window.google.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          if (status !== 'OK') {
            console.error("Distance Matrix API error:", status);
            resolve(null);
            return;
          }

          const element = response?.rows?.[0]?.elements?.[0];

          if (!element || element.status !== 'OK') {
            console.error("Distance Matrix element error:", element?.status);
            resolve(null);
            return;
          }

          const result = {
            distance: element.distance.text,
            duration: element.duration.text,
            distanceValue: element.distance.value,
            durationValue: element.duration.value,
          };
          
          resolve(result);
        }
      );
    } catch (error) {
      console.error("Error calculating distance:", error);
      resolve(null);
    }
  });
}
