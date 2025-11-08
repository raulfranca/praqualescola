import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { School } from "@/types/school";
import { SchoolDetailModal } from "./SchoolDetailModal";
import { HomeLocation } from "@/hooks/useHomeLocation";

// Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyAB6PNWQ6m8gkTSRXKfXtfvBthU50sljA8";

interface MapViewProps {
  schools: School[];
  favorites: number[];
  onToggleFavorite: (schoolId: number) => void;
  selectedSchool: School | null;
  onSchoolViewed: () => void;
  homeLocation: HomeLocation | null;
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

export function MapView({ schools, favorites, onToggleFavorite, selectedSchool, onSchoolViewed, homeLocation }: MapViewProps) {
  const [clickedSchool, setClickedSchool] = useState<School | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  const displayedSchool = selectedSchool || clickedSchool;

  const onMarkerClick = useCallback((school: School) => {
    setClickedSchool(school);
  }, []);

  // When a school is selected from search, center map and show details
  useEffect(() => {
    if (selectedSchool && mapRef.current) {
      mapRef.current.panTo({ lat: selectedSchool.lat, lng: selectedSchool.lng });
      mapRef.current.setZoom(16);
    }
  }, [selectedSchool]);

  const handleCloseModal = () => {
    setClickedSchool(null);
    if (selectedSchool) {
      onSchoolViewed();
    }
  };

  // Create custom marker icons
  const createMarkerIcon = (isFavorite: boolean) => {
    if (!isLoaded) return undefined;
    
    if (isFavorite) {
      // Golden star for favorites
      return {
        path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        fillColor: "#fbbf24",
        fillOpacity: 1,
        strokeColor: "#d97706",
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 12),
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
      <LoadScript 
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onLoad={() => setIsLoaded(true)}
        libraries={["places"]}
      >
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={DEFAULT_CENTER}
          zoom={13}
          options={mapOptions}
          onLoad={(map) => {
            mapRef.current = map;
          }}
        >
          {isLoaded && schools.map((school) => {
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

          {/* Home location marker */}
          {isLoaded && homeLocation && (
            <Marker
              position={{ lat: homeLocation.lat, lng: homeLocation.lng }}
              icon={{
                path: "M12 2L2 12h3v8h14v-8h3L12 2zm0 2.5L18 10v8h-3v-5H9v5H6v-8l6-5.5z",
                fillColor: "#22c55e",
                fillOpacity: 1,
                strokeColor: "#16a34a",
                strokeWeight: 2,
                scale: 1.8,
                anchor: new google.maps.Point(12, 24),
              }}
              title="🏠 Minha Casa"
            />
          )}
        </GoogleMap>
      </LoadScript>

      {displayedSchool && (
        <SchoolDetailModal
          school={displayedSchool}
          isFavorite={favorites.includes(displayedSchool.id)}
          onToggleFavorite={onToggleFavorite}
          onClose={handleCloseModal}
          homeLocation={homeLocation}
        />
      )}
    </>
  );
}
