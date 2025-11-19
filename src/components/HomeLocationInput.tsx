import { useState, useRef, useEffect } from "react";
import { Home, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { HomeLocation } from "@/hooks/useHomeLocation";

interface HomeLocationInputProps {
  onLocationSelected: (location: HomeLocation) => void;
  onClose: () => void;
  homeLocation: HomeLocation | null;
  onClearLocation: () => void;
}

export function HomeLocationInput({ onLocationSelected, onClose, homeLocation, onClearLocation }: HomeLocationInputProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(homeLocation?.address || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Wait for Google Maps to be loaded
    const checkGoogleMaps = setInterval(() => {
      if (window.google?.maps?.places) {
        setIsLoaded(true);
        clearInterval(checkGoogleMaps);
      }
    }, 100);

    return () => clearInterval(checkGoogleMaps);
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Initialize Google Places Autocomplete
    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "br" },
      fields: ["formatted_address", "geometry"],
    });

    // Listen for place selection
    autocompleteRef.current.addListener("place_changed", () => {
      const place = autocompleteRef.current?.getPlace();

      if (!place?.geometry?.location) {
        toast({
          title: "Erro",
          description: "Não foi possível obter a localização. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      const location: HomeLocation = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address || "",
      };

      onLocationSelected(location);
      toast({
        title: "Casa definida ✓",
        description: "Sua localização foi salva com sucesso!",
      });
    });
  }, [isLoaded, onLocationSelected, toast]);

  const handleClearLocation = () => {
    onClearLocation();
    toast({
      title: "Endereço removido",
      description: "Sua localização foi removida com sucesso.",
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-auto min-h-[280px] bg-card rounded-xl shadow-xl animate-in zoom-in-95 duration-300 mb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Definir Minha Casa</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {homeLocation 
              ? "Edite seu endereço ou remova a localização atual:"
              : "Digite seu endereço para calcular a distância até as escolas:"}
          </p>
          
          <Input
            ref={inputRef}
            type="text"
            placeholder="Digite seu endereço..."
            className="w-full"
            disabled={!isLoaded}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />

          <div className="min-h-[20px]">
            {!isLoaded && (
              <p className="text-xs text-muted-foreground">
                Carregando busca de endereços...
              </p>
            )}
          </div>

          <div className="min-h-[40px]">
            {homeLocation && (
              <Button
                variant="destructive"
                onClick={handleClearLocation}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remover endereço
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
