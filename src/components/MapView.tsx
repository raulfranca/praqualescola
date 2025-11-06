import { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { School } from "@/types/school";
import { SchoolDetailModal } from "./SchoolDetailModal";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyAB6PNWQ6m8gkTSRXKfXtfvBthU50sljA8";

interface MapViewProps {
  schools: School[];
  favorites: number[];
  onToggleFavorite: (schoolId: number) => void;
}

// Default to Pindamonhangaba center
const DEFAULT_CENTER = { lat: -22.9249, lng: -45.4612 };

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
};

export function MapView({ schools, favorites, onToggleFavorite }: MapViewProps) {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);

  const onMarkerClick = useCallback((school: School) => {
    setSelectedSchool(school);
  }, []);

  // Create custom marker icons
  const createMarkerIcon = (isFavorite: boolean) => {
    if (isFavorite) {
      // Golden star for favorites
      return {
        path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        fillColor: "#fbbf24",
        fillOpacity: 1,
        strokeColor: "#d97706",
        strokeWeight: 2,
        scale: 1.5,
        anchor: { x: 12, y: 12 } as google.maps.Point,
      };
    } else {
      // Blue circle for regular schools
      return {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: "#1ba3c6",
        fillOpacity: 1,
        strokeColor: "#0e7490",
        strokeWeight: 2,
        scale: 10,
      };
    }
  };

  return (
    <>
      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={13}
          options={mapOptions}
        >
          {schools.map((school) => {
            if (!school.lat || !school.lng) return null;

            const isFavorite = favorites.includes(school.id);
            
            return (
              <Marker
                key={school.id}
                position={{ lat: school.lat, lng: school.lng }}
                icon={createMarkerIcon(isFavorite)}
                onClick={() => onMarkerClick(school)}
                title={school.name}
              />
            );
          })}
        </GoogleMap>
      </LoadScript>

      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          isFavorite={favorites.includes(selectedSchool.id)}
          onToggleFavorite={onToggleFavorite}
          onClose={() => setSelectedSchool(null)}
        />
      )}
    </>
  );
}
