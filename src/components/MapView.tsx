import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { trackEvent } from "@/lib/analytics";
import { mapColors } from "@/lib/mapColors";
import { montarIconeEscola, tamanhoMarcador } from "@/lib/marcadorEscola";
import corujaBranca from "../../design-system/assets/coruja-branca.svg?raw";

// Alfinete "Minha Casa": tinta azul-noite com a coruja branca na cabeça (design-system/README.md)
const corujaInterna = corujaBranca.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const homePinSvg = `
  <svg width="36" height="44" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="homeShadow" x="-50%" y="-50%" width="200%" height="200%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="${mapColors["on-surface"]}" flood-opacity="0.35"/>
      </filter>
    </defs>
    <path d="M18 41C18 41 5 27 5 17A13 13 0 1 1 31 17C31 27 18 41 18 41Z"
          fill="${mapColors["marcador-casa"]}" stroke="${mapColors["marcador-contorno"]}" stroke-width="2"
          filter="url(#homeShadow)"/>
    <svg x="5" y="4" width="26" height="26" viewBox="0 0 1200 1200">${corujaInterna}</svg>
  </svg>
`;

interface MapViewProps {
  schools: School[];
  favorites: string[];
  onToggleFavorite: (schoolId: string) => void;
  selectedSchool: School | null;
  onSchoolClick: (school: School) => void;
  shouldCenterMap: boolean;
  homeLocation: HomeLocation | null;
  isActive?: boolean; // Whether the map tab is currently active
}

// Default to Pindamonhangaba center
const DEFAULT_CENTER = { lat: -22.9249, lng: -45.4612 };

const mapContainerStyle = {
  width: "100%",
  height: "100%",
};

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: false,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  keyboardShortcuts: false,
  clickableIcons: false,
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

export function MapView({ schools, favorites, onToggleFavorite, selectedSchool, onSchoolClick, shouldCenterMap, homeLocation, isActive = true }: MapViewProps) {
  const [currentZoom, setCurrentZoom] = useState(13);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const userInteractingRef = useRef(false);
  const fitBoundsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const prevSchoolIdsRef = useRef<string>("");

  // Check if Google Maps is loaded
  useEffect(() => {
    if (window.google?.maps) {
      setIsLoaded(true);
    }
  }, []);

  const onMarkerClick = useCallback((school: School) => {
    // Track school view from map pin
    trackEvent('view_item', {
      item_id: school.id,
      item_name: school.name,
      item_category: school.type,
      source: 'map_pin'
    });
    
    onSchoolClick(school);
  }, [onSchoolClick]);

  // Only center map when shouldCenterMap is true (from search bar)
  useEffect(() => {
    if (selectedSchool && shouldCenterMap && mapRef.current) {
      mapRef.current.panTo({ lat: selectedSchool.lat, lng: selectedSchool.lng });
      mapRef.current.setZoom(16);
    }
  }, [selectedSchool, shouldCenterMap]);

  // Create stable school IDs string for comparison
  const schoolIdsString = useMemo(() => {
    return schools
      .filter(s => s.lat && s.lng)
      .map(s => s.id)
      .sort()
      .join(',');
  }, [schools]);

  // Fit bounds to visible SCHOOL markers only (excludes home location)
  const fitBoundsToMarkers = useCallback(() => {
    if (!mapRef.current || !isLoaded || userInteractingRef.current) return;

    const validSchools = schools.filter(s => s.lat && s.lng);
    
    if (validSchools.length === 0) {
      // No markers - keep default view
      return;
    }

    // Responsive padding: smaller on mobile, larger on desktop
    const isMobile = window.innerWidth < 768;
    const padding = {
      top: isMobile ? 60 : 80,    // Space for search bar
      right: isMobile ? 40 : 60,
      bottom: isMobile ? 150 : 80, // Barra flutuante, selo e faixa do Google no celular
      left: isMobile ? 40 : 60
    };

    if (validSchools.length === 1) {
      // Single marker - center on it with neighborhood zoom
      const school = validSchools[0];
      mapRef.current.panTo({ lat: school.lat, lng: school.lng });
      mapRef.current.setZoom(14);
      return;
    }

    // 2-3 schools: closer zoom with maxZoom constraint
    if (validSchools.length <= 3) {
      const bounds = new google.maps.LatLngBounds();
      validSchools.forEach(school => {
        bounds.extend({ lat: school.lat, lng: school.lng });
      });
      mapRef.current.fitBounds(bounds, padding);
      // Constrain max zoom for 2-3 schools
      const listener = mapRef.current.addListener('idle', () => {
        const currentZoom = mapRef.current?.getZoom();
        if (currentZoom !== undefined && currentZoom > 15) {
          mapRef.current?.setZoom(15);
        }
        google.maps.event.removeListener(listener);
      });
      return;
    }

    // 4+ schools - let fitBounds calculate naturally (no maxZoom)
    const bounds = new google.maps.LatLngBounds();
    validSchools.forEach(school => {
      bounds.extend({ lat: school.lat, lng: school.lng });
    });

    // Fit bounds to SCHOOL markers only - home marker is visible but doesn't affect zoom
    mapRef.current.fitBounds(bounds, padding);
  }, [schools, isLoaded]);

  // Debounced fitBounds when schools change or tab becomes active
  useEffect(() => {
    if (!isLoaded || !isActive) return;

    // Skip if schools haven't actually changed
    if (prevSchoolIdsRef.current === schoolIdsString && prevSchoolIdsRef.current !== "") {
      return;
    }
    prevSchoolIdsRef.current = schoolIdsString;

    // Clear any pending timeout
    if (fitBoundsTimeoutRef.current) {
      clearTimeout(fitBoundsTimeoutRef.current);
    }

    // Debounce fitBounds to avoid rapid calls during filter changes
    fitBoundsTimeoutRef.current = setTimeout(() => {
      fitBoundsToMarkers();
    }, 300);

    return () => {
      if (fitBoundsTimeoutRef.current) {
        clearTimeout(fitBoundsTimeoutRef.current);
      }
    };
  }, [schoolIdsString, isActive, isLoaded, fitBoundsToMarkers]);

  // Track user interaction to prevent fitBounds during manual pan/zoom
  const handleUserInteractionStart = useCallback(() => {
    userInteractingRef.current = true;
  }, []);

  const handleUserInteractionEnd = useCallback(() => {
    // Small delay to ensure interaction is complete
    setTimeout(() => {
      userInteractingRef.current = false;
    }, 100);
  }, []);

  // Determine school category
  const getSchoolCategory = (school: School) => {
    const hasCreche = (school.bercario || 0) > 0 || (school.infantil1 || 0) > 0 || (school.infantil2 || 0) > 0;
    const hasPre = (school.pre1 || 0) > 0 || (school.pre2 || 0) > 0;
    const hasFundamental = (school.ano1 || 0) > 0 || (school.ano2 || 0) > 0 || (school.ano3 || 0) > 0 || (school.ano4 || 0) > 0 || (school.ano5 || 0) > 0;
    
    return { hasCreche, hasPre, hasFundamental };
  };

  // Ícone do marcador (SVG montado em src/lib/marcadorEscola.ts); `vacancies` só existe com campanha no ar
  const createMarkerIcon = (school: School, isFavorite: boolean) => {
    const { hasCreche, hasPre, hasFundamental } = getSchoolCategory(school);
    const icone = montarIconeEscola({
      niveis: { creche: hasCreche, pre: hasPre, fundamental: hasFundamental },
      favorito: isFavorite,
      zoom: currentZoom,
      vagas: school.vacancies,
    });
    return {
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(icone.svg),
        scaledSize: new google.maps.Size(icone.tamanho, icone.tamanho),
        anchor: new google.maps.Point(icone.centro, icone.centro),
      },
      centro: icone.centro,
    };
  };

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={DEFAULT_CENTER}
      zoom={13}
      options={mapOptions}
      onLoad={(map) => {
        mapRef.current = map;
        setIsLoaded(true);
        // Trigger initial fitBounds after map loads
        setTimeout(() => {
          fitBoundsToMarkers();
        }, 100);
      }}
      onZoomChanged={() => {
        if (mapRef.current) {
          const zoom = mapRef.current.getZoom();
          if (zoom !== undefined) {
            setCurrentZoom(zoom);
          }
        }
      }}
      onDragStart={handleUserInteractionStart}
      onDragEnd={handleUserInteractionEnd}
    >
          {isLoaded && schools.map((school) => {
            if (!school.lat || !school.lng) return null;

            const isFavorite = favorites.includes(school.id);
            const showLabel = currentZoom >= 15;
            
            // Calculate zIndex based on latitude (lower lat = more south = higher zIndex)
            // This ensures markers visually "in front" (lower on screen) are clickable over ones "behind"
            const latitudeZIndex = Math.round((90 + school.lat) * 1000);
            const finalZIndex = isFavorite ? latitudeZIndex + 100000 : latitudeZIndex;
            
            const baseSize = tamanhoMarcador(currentZoom);
            const markerSize = isFavorite ? baseSize * 1.8 : baseSize;
            const clickRadius = (markerSize / 2) + 4; // Add small safety margin
            const { icon, centro: centerOffset } = createMarkerIcon(school, isFavorite);

            return (
              <Marker
                key={school.id}
                position={{ lat: school.lat, lng: school.lng }}
                icon={icon}
                onClick={() => onMarkerClick(school)}
                title={school.name}
                zIndex={finalZIndex}
                options={{
                  optimized: true,
                }}
                shape={{
                  coords: [centerOffset, centerOffset, clickRadius],
                  type: 'circle'
                }}
                label={showLabel ? {
                  text: school.name,
                  color: mapColors["on-surface"],
                  fontFamily: '"Inter Variable", Inter, sans-serif',
                  fontSize: '12px',
                  fontWeight: '400',
                  className: 'marker-label'
                } : undefined}
              />
            );
          })}

          {/* Home location marker */}
          {isLoaded && homeLocation && (
            <Marker
              position={{ lat: homeLocation.lat, lng: homeLocation.lng }}
              icon={{
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(homePinSvg),
                scaledSize: new google.maps.Size(36, 44),
                anchor: new google.maps.Point(18, 41),
              }}
              title="🏠 Minha Casa"
              zIndex={2000}
        />
      )}
    </GoogleMap>
  );
}
