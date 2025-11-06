import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { School } from "@/types/school";
import { SchoolDetailModal } from "./SchoolDetailModal";

interface MapViewProps {
  schools: School[];
  favorites: number[];
  onToggleFavorite: (schoolId: number) => void;
}

// Default to Pindamonhangaba center
const DEFAULT_CENTER: [number, number] = [-45.4612, -22.9249];

export function MapView({ schools, favorites, onToggleFavorite }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  // Check for token in localStorage or show input
  useEffect(() => {
    const storedToken = localStorage.getItem("mapbox-token");
    if (storedToken) {
      setMapboxToken(storedToken);
    } else {
      setShowTokenInput(true);
    }
  }, []);

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const token = formData.get("token") as string;
    if (token) {
      localStorage.setItem("mapbox-token", token);
      setMapboxToken(token);
      setShowTokenInput(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/light-v11",
        center: DEFAULT_CENTER,
        zoom: 13,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

      // Add markers for schools
      schools.forEach((school) => {
        if (!school.lat || !school.lng) return;

        const isFavorite = favorites.includes(school.id);
        
        // Create custom marker element
        const el = document.createElement("div");
        el.className = "school-marker";
        el.style.width = "32px";
        el.style.height = "32px";
        el.style.cursor = "pointer";
        el.style.transition = "transform 0.2s";
        
        el.innerHTML = isFavorite
          ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(45, 100%, 51%)" stroke="hsl(45, 100%, 35%)" stroke-width="1.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>`
          : `<svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(195, 85%, 45%)" stroke="hsl(195, 85%, 35%)" stroke-width="1.5">
              <circle cx="12" cy="12" r="8"/>
            </svg>`;

        el.addEventListener("mouseenter", () => {
          el.style.transform = "scale(1.2)";
        });
        
        el.addEventListener("mouseleave", () => {
          el.style.transform = "scale(1)";
        });

        const marker = new mapboxgl.Marker(el)
          .setLngLat([school.lng, school.lat])
          .addTo(map.current!);

        el.addEventListener("click", () => {
          setSelectedSchool(school);
        });

        markers.current.push(marker);
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setShowTokenInput(true);
    }

    return () => {
      markers.current.forEach((marker) => marker.remove());
      markers.current = [];
      map.current?.remove();
    };
  }, [schools, mapboxToken]);

  // Update markers when favorites change
  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach((marker, index) => {
      const school = schools[index];
      if (!school) return;

      const isFavorite = favorites.includes(school.id);
      const el = marker.getElement();
      
      el.innerHTML = isFavorite
        ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(45, 100%, 51%)" stroke="hsl(45, 100%, 35%)" stroke-width="1.5">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>`
        : `<svg width="32" height="32" viewBox="0 0 24 24" fill="hsl(195, 85%, 45%)" stroke="hsl(195, 85%, 35%)" stroke-width="1.5">
            <circle cx="12" cy="12" r="8"/>
          </svg>`;
    });
  }, [favorites, schools]);

  if (showTokenInput) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 border border-border">
          <h3 className="text-lg font-semibold mb-2 text-foreground">Token do Mapbox Necessário</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Para visualizar o mapa, você precisa fornecer um token público do Mapbox. 
            Obtenha um em{" "}
            <a
              href="https://mapbox.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
          <form onSubmit={handleTokenSubmit}>
            <input
              type="text"
              name="token"
              placeholder="Cole seu token público aqui..."
              className="w-full px-3 py-2 border border-input rounded-md mb-3 bg-background text-foreground"
              required
            />
            <button
              type="submit"
              className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Salvar Token
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <>
      <div ref={mapContainer} className="flex-1 w-full" />
      
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
