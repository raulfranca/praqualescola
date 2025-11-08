export interface DistanceMatrixResult {
  distance: string;
  duration: string;
  distanceValue: number; // in meters
  durationValue: number; // in seconds
}

export async function calculateDistance(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<DistanceMatrixResult | null> {
  return new Promise((resolve) => {
    try {
      console.log("Starting distance calculation...", { origin, destination });
      
      if (!window.google?.maps?.DistanceMatrixService) {
        console.error("Google Maps Distance Matrix Service not loaded");
        resolve(null);
        return;
      }

      console.log("Google Maps API is loaded, creating service...");
      const service = new window.google.maps.DistanceMatrixService();

      console.log("Requesting distance matrix...");
      service.getDistanceMatrix(
        {
          origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
          destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
          travelMode: window.google.maps.TravelMode.DRIVING,
          unitSystem: window.google.maps.UnitSystem.METRIC,
        },
        (response, status) => {
          console.log("Distance Matrix response:", { status, response });
          
          if (status !== window.google.maps.DistanceMatrixStatus.OK) {
            console.error("Distance Matrix API error:", status);
            resolve(null);
            return;
          }

          const element = response?.rows[0]?.elements[0];

          if (!element || element.status !== window.google.maps.DistanceMatrixElementStatus.OK) {
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
          
          console.log("Distance calculated successfully:", result);
          resolve(result);
        }
      );
    } catch (error) {
      console.error("Error calculating distance:", error);
      resolve(null);
    }
  });
}
