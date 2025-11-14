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
    try {
      setClickedSchool(school);
    } catch (error) {
      console.error("Error setting clicked school:", error);
    }
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

  // Determine school category
  const getSchoolCategory = (school: School) => {
    const hasCreche = (school.bercario || 0) > 0 || (school.infantil1 || 0) > 0 || (school.infantil2 || 0) > 0;
    const hasPre = (school.pre1 || 0) > 0 || (school.pre2 || 0) > 0;
    const hasFundamental = (school.ano1 || 0) > 0 || (school.ano2 || 0) > 0 || (school.ano3 || 0) > 0 || (school.ano4 || 0) > 0 || (school.ano5 || 0) > 0;
    
    return { hasCreche, hasPre, hasFundamental };
  };

  // Create custom marker icons with color coding
  const createMarkerIcon = (school: School, isFavorite: boolean) => {
    if (!isLoaded) return undefined;
    
    const { hasCreche, hasPre, hasFundamental } = getSchoolCategory(school);
    const categories = [hasCreche, hasPre, hasFundamental].filter(Boolean).length;
    
    // Colors from design system
    const crecheColor = "#80CBC4"; // Verde turquesa (Creche)
    const preColor = "#D4A849"; // Amarelo (Pré)
    const fundamentalColor = "#3D7C85"; // Azul petróleo (Fundamental)
    const primaryColor = "#1ba3c6"; // Azul principal do sistema
    
    // Pin shape SVG path (classic map pin/drop shape)
    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";
    
    if (isFavorite) {
      // Golden star for favorites (smaller and thinner)
      return {
        path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        fillColor: "#fbbf24",
        fillOpacity: 1,
        strokeColor: "#d97706",
        strokeWeight: 1.5,
        scale: 1.2,
        anchor: new google.maps.Point(12, 12),
      };
    }
    
    // Single category - solid color pin
    if (categories === 1) {
      let color = primaryColor;
      if (hasCreche) color = crecheColor;
      else if (hasPre) color = preColor;
      else if (hasFundamental) color = fundamentalColor;
      
      return {
        path: pinPath,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 1.5,
        scale: 1.3,
        anchor: new google.maps.Point(12, 22),
        labelOrigin: new google.maps.Point(12, 10),
      };
    }
    
    // Multiple categories - use SVG data URL for split colors
    if (categories === 2) {
      let leftColor = crecheColor;
      let rightColor = fundamentalColor;
      
      if (hasCreche && hasPre) {
        leftColor = crecheColor;
        rightColor = preColor;
      } else if (hasCreche && hasFundamental) {
        leftColor = crecheColor;
        rightColor = fundamentalColor;
      } else if (hasPre && hasFundamental) {
        leftColor = preColor;
        rightColor = fundamentalColor;
      }
      
      const svg = `
        <svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                  fill="${leftColor}" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M12 2v20s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                  fill="${rightColor}" stroke="#ffffff" stroke-width="1.5"/>
          </g>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(31, 42),
        anchor: new google.maps.Point(15.5, 42),
      };
    }
    
    // Three categories - tricolor or neutral
    if (categories === 3) {
      const svg = `
        <svg width="24" height="32" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
            </filter>
          </defs>
          <g filter="url(#shadow)">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                  fill="${crecheColor}" stroke="#ffffff" stroke-width="1.5"/>
            <path d="M9 2.5C7.5 3.2 6.2 4.3 5.3 5.7L12 22s3-3.5 5-7.5L9 2.5z" 
                  fill="${preColor}"/>
            <path d="M15 2.5c1.5 0.7 2.8 1.8 3.7 3.2L12 22s-3-3.5-5-7.5L15 2.5z" 
                  fill="${fundamentalColor}"/>
          </g>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(31, 42),
        anchor: new google.maps.Point(15.5, 42),
      };
    }
    
    // Fallback
    return {
      path: pinPath,
      fillColor: primaryColor,
      fillOpacity: 1,
      strokeColor: "#ffffff",
      strokeWeight: 1.5,
      scale: 1.3,
      anchor: new google.maps.Point(12, 22),
    };
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
                icon={createMarkerIcon(school, isFavorite)}
                onClick={() => onMarkerClick(school)}
                title={school.name}
                zIndex={isFavorite ? 1000 : 1}
              />
            );
          })}

          {/* Home location marker */}
          {isLoaded && homeLocation && (
            <Marker
              position={{ lat: homeLocation.lat, lng: homeLocation.lng }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="28" height="32" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <filter id="homeShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
                      </filter>
                    </defs>
                    <g filter="url(#homeShadow)">
                      <path d="M14 2L2 12h3v12h7v-8h4v8h7V12h3L14 2z" 
                            fill="#22c55e" stroke="#ffffff" stroke-width="1.5"/>
                    </g>
                  </svg>
                `),
                scaledSize: new google.maps.Size(28, 32),
                anchor: new google.maps.Point(14, 32),
              }}
              title="🏠 Minha Casa"
              zIndex={2000}
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
