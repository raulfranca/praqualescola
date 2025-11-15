import { useState, useCallback, useEffect, useRef } from "react";
import { GoogleMap, LoadScript, Marker, OverlayView } from "@react-google-maps/api";
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
  gestureHandling: 'greedy',
  styles: [
    {
      featureType: "poi",
      elementType: "labels",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "poi.business",
      stylers: [{ visibility: "off" }],
    },
    {
      featureType: "transit",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
  ],
};

export function MapView({ schools, favorites, onToggleFavorite, selectedSchool, onSchoolViewed, homeLocation }: MapViewProps) {
  const [clickedSchool, setClickedSchool] = useState<School | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(13);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [labelPositions, setLabelPositions] = useState<Map<number, 'top' | 'bottom'>>(new Map());

  const displayedSchool = selectedSchool || clickedSchool;

  const onMarkerClick = useCallback((school: School) => {
    try {
      setClickedSchool(school);
    } catch (error) {
      console.error("Error setting clicked school:", error);
    }
  }, []);

  // Calculate label positions to avoid collisions
  useEffect(() => {
    if (!mapRef.current || !isLoaded || currentZoom < 15) {
      setLabelPositions(new Map());
      return;
    }

    const visibleSchools = schools.filter(s => s.lat && s.lng);
    const positions = new Map<number, 'top' | 'bottom'>();
    const occupiedAreas: Array<{ 
      schoolId: number; 
      bounds: { north: number; south: number; east: number; west: number };
      position: 'top' | 'bottom';
    }> = [];

    // Sort schools by latitude (north to south) to process systematically
    const sortedSchools = [...visibleSchools].sort((a, b) => (b.lat || 0) - (a.lat || 0));

    sortedSchools.forEach((school) => {
      // Calculate label width based on text length (more accurate)
      // Average character width ~7px at 12px font, convert to degrees at zoom 15
      const charWidthInDegrees = 0.00008; // ~8m per character
      const labelWidthDegrees = school.name.length * charWidthInDegrees;
      const labelHeightDegrees = 0.00025; // Fixed height for single line text
      
      // Distance from pin center to label edge
      const verticalOffset = 0.00020; // ~20m spacing from pin center
      
      // Try TOP position first (default)
      let finalPosition: 'top' | 'bottom' = 'top';
      
      const topBounds = {
        north: school.lat! + verticalOffset + labelHeightDegrees,
        south: school.lat! + verticalOffset,
        east: school.lng! + labelWidthDegrees / 2,
        west: school.lng! - labelWidthDegrees / 2,
      };

      // Check for collisions with top position
      const hasTopCollision = occupiedAreas.some(area => {
        // Intersection check with padding
        const intersects = !(
          topBounds.south > area.bounds.north ||
          topBounds.north < area.bounds.south ||
          topBounds.west > area.bounds.east ||
          topBounds.east < area.bounds.west
        );
        return intersects;
      });

      // If top collides, use bottom
      if (hasTopCollision) {
        finalPosition = 'bottom';
        const bottomBounds = {
          north: school.lat! - verticalOffset,
          south: school.lat! - verticalOffset - labelHeightDegrees,
          east: school.lng! + labelWidthDegrees / 2,
          west: school.lng! - labelWidthDegrees / 2,
        };
        occupiedAreas.push({ 
          schoolId: school.id, 
          bounds: bottomBounds,
          position: 'bottom'
        });
      } else {
        occupiedAreas.push({ 
          schoolId: school.id, 
          bounds: topBounds,
          position: 'top'
        });
      }

      positions.set(school.id, finalPosition);
    });

    setLabelPositions(positions);
  }, [schools, isLoaded, currentZoom]);

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

  // Create custom marker icons with color coding (circles)
  const createMarkerIcon = (school: School, isFavorite: boolean) => {
    if (!isLoaded) return undefined;
    
    const { hasCreche, hasPre, hasFundamental } = getSchoolCategory(school);
    const categories = [hasCreche, hasPre, hasFundamental].filter(Boolean).length;
    
    // Colors from design system
    const crecheColor = "#80CBC4"; // Verde turquesa (Creche)
    const preColor = "#D4A849"; // Amarelo (Pré)
    const fundamentalColor = "#3D7C85"; // Azul petróleo (Fundamental)
    const primaryColor = "#1ba3c6"; // Azul principal do sistema
    
    // Dynamic size based on zoom level - smaller at city view, larger at street view
    // Streets with arrows typically appear at zoom 17+
    const baseSize = currentZoom < 16 ? 
      Math.max(18, 10 + (currentZoom * 0.8)) : // Slightly larger at city/neighborhood level
      Math.max(24, 14 + (currentZoom * 1.5)); // Grow faster at street level
    const size = baseSize;
    const radius = size / 2;
    
    // Increase canvas size to prevent shadow clipping
    const canvasSize = size + 16; // Extra space for shadow blur
    const offset = 8; // Center the circle in the larger canvas
    
    if (isFavorite) {
      // Golden star for favorites - dynamic scale
      const starScale = 0.8 + (currentZoom * 0.04);
      return {
        path: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
        fillColor: "#fbbf24",
        fillOpacity: 1,
        strokeColor: "#d97706",
        strokeWeight: 1.5,
        scale: starScale,
        anchor: new google.maps.Point(12, 12),
      };
    }
    
    // Single category - solid color circle
    if (categories === 1) {
      let color = primaryColor;
      if (hasCreche) color = crecheColor;
      else if (hasPre) color = preColor;
      else if (hasFundamental) color = fundamentalColor;
      
      const svg = `
        <svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
            </filter>
          </defs>
          <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                  fill="${color}" stroke="#ffffff" stroke-width="1.5" 
                  filter="url(#shadow)"/>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(canvasSize, canvasSize),
        anchor: new google.maps.Point(radius + offset, radius + offset),
      };
    }
    
    // Two categories - split circle (vertical half)
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
        <svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
            </filter>
            <clipPath id="leftHalf">
              <rect x="${offset}" y="${offset}" width="${radius}" height="${size}"/>
            </clipPath>
            <clipPath id="rightHalf">
              <rect x="${radius + offset}" y="${offset}" width="${radius}" height="${size}"/>
            </clipPath>
          </defs>
          <g filter="url(#shadow)">
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="${leftColor}" clip-path="url(#leftHalf)"/>
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="${rightColor}" clip-path="url(#rightHalf)"/>
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="none" stroke="#ffffff" stroke-width="1.5"/>
          </g>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(canvasSize, canvasSize),
        anchor: new google.maps.Point(radius + offset, radius + offset),
      };
    }
    
    // Three categories - tri-split circle (vertical thirds)
    if (categories === 3) {
      const svg = `
        <svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
            </filter>
            <clipPath id="leftThird">
              <rect x="${offset}" y="${offset}" width="${size / 3}" height="${size}"/>
            </clipPath>
            <clipPath id="middleThird">
              <rect x="${size / 3 + offset}" y="${offset}" width="${size / 3}" height="${size}"/>
            </clipPath>
            <clipPath id="rightThird">
              <rect x="${(size / 3) * 2 + offset}" y="${offset}" width="${size / 3}" height="${size}"/>
            </clipPath>
          </defs>
          <g filter="url(#shadow)">
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="${crecheColor}" clip-path="url(#leftThird)"/>
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="${preColor}" clip-path="url(#middleThird)"/>
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="${fundamentalColor}" clip-path="url(#rightThird)"/>
            <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                    fill="none" stroke="#ffffff" stroke-width="1.5"/>
          </g>
        </svg>
      `;
      
      return {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
        scaledSize: new google.maps.Size(canvasSize, canvasSize),
        anchor: new google.maps.Point(radius + offset, radius + offset),
      };
    }
    
    // Fallback - solid primary color circle
    const svg = `
      <svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.4"/>
          </filter>
        </defs>
        <circle cx="${radius + offset}" cy="${radius + offset}" r="${radius - 1.5}" 
                fill="${primaryColor}" stroke="#ffffff" stroke-width="1.5" 
                filter="url(#shadow)"/>
      </svg>
    `;
    
    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg),
      scaledSize: new google.maps.Size(canvasSize, canvasSize),
      anchor: new google.maps.Point(radius + offset, radius + offset),
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
          onZoomChanged={() => {
            if (mapRef.current) {
              const zoom = mapRef.current.getZoom();
              if (zoom !== undefined) {
                setCurrentZoom(zoom);
              }
            }
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

          {/* Custom clickable labels with collision detection */}
          {isLoaded && currentZoom >= 15 && schools.map((school) => {
            if (!school.lat || !school.lng) return null;

            const labelPosition = labelPositions.get(school.id) || 'top';
            
            return (
              <OverlayView
                key={`label-${school.id}`}
                position={{ lat: school.lat, lng: school.lng }}
                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              >
                <div
                  onClick={() => onMarkerClick(school)}
                  className="cursor-pointer select-none whitespace-nowrap"
                  style={{
                    position: 'absolute',
                    transform: labelPosition === 'top' 
                      ? 'translate(-50%, calc(-100% - 24px))' 
                      : 'translate(-50%, 24px)',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#3D7C85',
                    border: '1px solid rgba(61, 124, 133, 0.2)',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    transition: 'all 0.2s ease',
                    zIndex: 100,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(61, 124, 133, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(61, 124, 133, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                    e.currentTarget.style.borderColor = 'rgba(61, 124, 133, 0.2)';
                  }}
                >
                  {school.name}
                </div>
              </OverlayView>
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
