import { useState, useRef, useEffect, useCallback } from "react";
import { Home, X, Trash2, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { LIMITE_ENDERECOS_POR_DIA, enderecosRestantesHoje } from "@/lib/utils";
import { temSessaoAdmin } from "@/lib/admin";

interface HomeLocationInputProps {
  onLocationSelected: (location: HomeLocation) => void;
  onClose: () => void;
  homeLocation: HomeLocation | null;
  onClearLocation: () => void;
  onCalculateDistances?: (location: HomeLocation) => Promise<{ aproximado: boolean }>;
  isCalculating?: boolean;
  hasCachedDistances?: (location: HomeLocation) => boolean;
  /** As distâncias salvas da casa atual são estimativas em linha reta. */
  distanciasAproximadas?: boolean;
}

export function HomeLocationInput({
  onLocationSelected,
  onClose,
  homeLocation,
  onClearLocation,
  onCalculateDistances,
  isCalculating = false,
  hasCachedDistances,
  distanciasAproximadas = false,
}: HomeLocationInputProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputValue, setInputValue] = useState(homeLocation?.address || "");
  const [pendingLocation, setPendingLocation] = useState<HomeLocation | null>(null);
  // Lido ao abrir: o modal fecha depois de cada cálculo.
  const [restantesHoje] = useState(() => enderecosRestantesHoje());
  // Sessão do painel /admin não tem limite diário.
  const [semLimite] = useState(() => temSessaoAdmin());
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);
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

  // Create a new session token when focusing the input
  const createSessionToken = useCallback(() => {
    if (window.google?.maps?.places) {
      sessionTokenRef.current = new google.maps.places.AutocompleteSessionToken();
      console.log("🔑 Created new AutocompleteSessionToken");
    }
  }, []);

  useEffect(() => {
    if (!isLoaded || !inputRef.current) return;

    // Create initial session token
    createSessionToken();

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

      // Set as pending location instead of immediately selecting
      setPendingLocation(location);
      setInputValue(location.address);
      
      // Create new session token for next search
      createSessionToken();
      
      toast({
        title: "Endereço selecionado",
        description: "Clique em 'Calcular distância e tempo' para continuar.",
      });
    });
  }, [isLoaded, toast, createSessionToken]);

  const handleCalculateDistances = async () => {
    const locationToCalculate = pendingLocation || homeLocation;
    
    if (!locationToCalculate) {
      toast({
        title: "Erro",
        description: "Selecione um endereço primeiro.",
        variant: "destructive",
      });
      return;
    }

    // If there's a pending location, save it first
    if (pendingLocation) {
      onLocationSelected(pendingLocation);
    }

    if (onCalculateDistances) {
      const { aproximado } = await onCalculateDistances(locationToCalculate);
      toast(
        aproximado
          ? {
              title: "Distâncias aproximadas",
              description: "Estimadas em linha reta. Serão atualizadas com a rota real quando possível.",
            }
          : {
              title: "Distâncias calculadas ✓",
              description: "As distâncias foram calculadas e salvas com sucesso!",
            }
      );
      setPendingLocation(null);
      onClose();
    }
  };

  const handleClearLocation = () => {
    onClearLocation();
    setPendingLocation(null);
    setInputValue("");
    toast({
      title: "Endereço removido",
      description: "Sua localização foi removida com sucesso.",
    });
  };

  const handleInputFocus = () => {
    // Create new session token when user starts typing
    createSessionToken();
  };

  // Check if we already have cached distances for current/pending location
  const locationToCheck = pendingLocation || homeLocation;
  const hasCache = locationToCheck && hasCachedDistances ? hasCachedDistances(locationToCheck) : false;
  const showCalculateButton = pendingLocation || (homeLocation && !hasCache);
  const limiteAtingido = !semLimite && restantesHoje === 0;
  const isInputDisabled = !isLoaded || limiteAtingido;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-20 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-card rounded-xl shadow-xl animate-fade-in will-change-[opacity] mb-4"
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
          {limiteAtingido && (
            <div role="status" className="p-3 bg-aviso-bg text-aviso-fg rounded-lg">
              <p className="text-sm font-medium">Limite diário atingido</p>
              <p className="text-sm">
                Você já definiu {LIMITE_ENDERECOS_POR_DIA} endereços novos hoje. Amanhã você pode definir outro.
              </p>
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            {homeLocation 
              ? "Edite seu endereço ou remova a localização atual:"
              : "Digite seu endereço para calcular a distância até as escolas:"}
          </p>
          
          <div className="space-y-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Digite seu endereço..."
              className="w-full"
              disabled={isInputDisabled}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={handleInputFocus}
            />

            {!isLoaded ? (
              <p className="text-xs text-muted-foreground">
                Carregando busca de endereços...
              </p>
            ) : !limiteAtingido && !semLimite && (
              <p className="text-xs text-muted-foreground">
                {restantesHoje === 1
                  ? "Você ainda pode definir 1 endereço novo hoje."
                  : `Você ainda pode definir ${restantesHoje} endereços novos hoje.`}
              </p>
            )}
          </div>

          {showCalculateButton && (
            <Button
              onClick={handleCalculateDistances}
              disabled={isCalculating || hasCache}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Calculando...
                </>
              ) : hasCache ? (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Distâncias já calculadas
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4 mr-2" />
                  Calcular distância e tempo
                </>
              )}
            </Button>
          )}

          {homeLocation && !pendingLocation && hasCache && (
            distanciasAproximadas ? (
              <p role="status" className="p-3 text-sm bg-info-bg text-info-fg rounded-lg">
                As distâncias deste endereço são aproximadas (linha reta). Serão atualizadas com a rota real
                quando possível.
              </p>
            ) : (
              <p className="text-xs text-center text-muted-foreground">
                ✓ Distâncias calculadas para este endereço
              </p>
            )
          )}

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
  );
}
