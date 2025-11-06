import { useState, useCallback } from "react";
import { GoogleMap, LoadScript, Marker } from "@react-google-maps/api";
import { School } from "@/types/school";
import { SchoolDetailModal } from "./SchoolDetailModal";

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
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => {
    return localStorage.getItem("google-maps-api-key") || "";
  });
  const [showKeyInput, setShowKeyInput] = useState(!googleMapsApiKey);

  const handleKeySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = formData.get("apiKey") as string;
    if (key) {
      localStorage.setItem("google-maps-api-key", key);
      setGoogleMapsApiKey(key);
      setShowKeyInput(false);
    }
  };

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

  if (showKeyInput || !googleMapsApiKey) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-2 text-foreground">
            Chave do Google Maps Necessária
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para visualizar o mapa, você precisa fornecer uma chave de API do Google Maps.
            Obtenha gratuitamente em{" "}
            <a
              href="https://console.cloud.google.com/google/maps-apis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Cloud Console
            </a>
          </p>
          <div className="mb-4 p-3 bg-primary/5 rounded border border-primary/20">
            <p className="text-xs text-muted-foreground">
              <strong>Dica:</strong> Ative a API "Maps JavaScript API" no console do Google Cloud.
            </p>
          </div>
          <form onSubmit={handleKeySubmit}>
            <input
              type="text"
              name="apiKey"
              placeholder="Cole sua chave de API aqui..."
              className="w-full px-3 py-2 border border-input rounded-md mb-3 bg-background text-foreground"
              required
            />
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Salvar Chave
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <LoadScript googleMapsApiKey={googleMapsApiKey}>
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
