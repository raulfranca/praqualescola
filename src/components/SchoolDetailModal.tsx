import { School } from "@/types/school";
import { Star, MapPin, Phone, Building2, Car, Clock, School2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { calculateDistance, DistanceMatrixResult } from "@/lib/distanceMatrix";
import { useState, useEffect } from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

interface SchoolDetailModalProps {
  school: School | null;
  isFavorite: boolean;
  onToggleFavorite: (schoolId: number) => void;
  onClose: () => void;
  homeLocation: HomeLocation | null;
}

export function SchoolDetailModal({
  school,
  isFavorite,
  onToggleFavorite,
  onClose,
  homeLocation,
}: SchoolDetailModalProps) {
  const [distanceInfo, setDistanceInfo] = useState<DistanceMatrixResult | null>(null);
  const [loadingDistance, setLoadingDistance] = useState(false);

  useEffect(() => {
    if (!homeLocation || !school?.lat || !school?.lng) {
      setDistanceInfo(null);
      return;
    }

    setLoadingDistance(true);
    calculateDistance(
      { lat: homeLocation.lat, lng: homeLocation.lng },
      { lat: school.lat, lng: school.lng }
    )
      .then((result) => {
        setDistanceInfo(result);
      })
      .catch((error) => {
        console.error("Error calculating distance:", error);
        setDistanceInfo(null);
      })
      .finally(() => {
        setLoadingDistance(false);
      });
  }, [homeLocation, school?.lat, school?.lng]);
  const handleOpenInMaps = () => {
    if (!school?.address) return;
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      school.address
    )}`;
    window.open(mapsUrl, "_blank");
  };

  const formatPhone = (phone: string, extension?: string) => {
    if (!phone) return "Não disponível";
    if (extension) {
      return `${phone} (Ramal ${extension})`;
    }
    return phone;
  };

  if (!school) return null;

  return (
    <Drawer open={!!school} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="text-left border-b">
          <DrawerTitle className="text-lg sm:text-xl leading-tight pr-8">
            {school.name}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            Detalhes da escola {school.name}
          </DrawerDescription>
        </DrawerHeader>

        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="default" className="text-sm">
              {school.type}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Setor {school.sector}
            </Badge>
            {school.outsourced && (
              <Badge 
                variant="outline" 
                className="text-sm bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100"
              >
                {school.outsourced}
              </Badge>
            )}
          </div>

          {/* Salas */}
          {(school.bercario > 0 || school.infantil1 > 0 || school.infantil2 > 0 || 
            school.pre1 > 0 || school.pre2 > 0 || school.ano1 > 0 || 
            school.ano2 > 0 || school.ano3 > 0 || school.ano4 > 0 || school.ano5 > 0) && (
            <div className="flex items-start gap-2">
              <School2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Salas</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {school.bercario > 0 && (
                    <Badge className="bg-infantil text-infantil-foreground hover:bg-infantil/90">
                      Berçário
                    </Badge>
                  )}
                  {(school.infantil1 > 0 || school.infantil2 > 0) && (
                    <Badge className="bg-infantil text-infantil-foreground hover:bg-infantil/90">
                      Inf. 1 e 2
                    </Badge>
                  )}
                  {(school.pre1 > 0 || school.pre2 > 0) && (
                    <Badge className="bg-pre text-pre-foreground hover:bg-pre/90">
                      Pré 1 e 2
                    </Badge>
                  )}
                  {(school.ano1 > 0 || school.ano2 > 0 || school.ano3 > 0 || school.ano4 > 0 || school.ano5 > 0) && (
                    <Badge className="bg-fundamental text-fundamental-foreground hover:bg-fundamental/90">
                      1º ao 5º ano
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Bairro Badge */}
          <div className="flex items-start gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Bairro</p>
              <Badge variant="outline" className="mt-1">
                {school.neighborhood}
              </Badge>
            </div>
          </div>

          {/* Endereço */}
          <div className="flex items-start gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Endereço</p>
              <p className="text-sm text-foreground mt-1">{school.address}</p>
              {school.cep && (
                <p className="text-sm text-muted-foreground mt-1">
                  CEP: {school.cep}
                </p>
              )}
            </div>
          </div>

          {/* Telefone */}
          {school.phone && (
            <div className="flex items-start gap-2">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">Telefone</p>
                <p className="text-sm text-foreground mt-1">
                  {formatPhone(school.phone, school.extension)}
                </p>
              </div>
            </div>
          )}

          {/* Polo */}
          <div className="flex items-start gap-2">
            <Building2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Secretaria Polo
              </p>
              <p className="text-sm text-foreground mt-1">{school.polo}</p>
            </div>
          </div>

          {/* Distance and Duration */}
          {homeLocation && (
            <div className="bg-muted/50 rounded-lg p-3 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-primary" />
                <p className="text-sm font-medium text-foreground">Distância de Casa</p>
              </div>
              
              {loadingDistance ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  Calculando rota...
                </div>
              ) : distanceInfo ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Distância</p>
                      <p className="text-sm font-semibold text-foreground">{distanceInfo.distance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo</p>
                      <p className="text-sm font-semibold text-foreground">{distanceInfo.duration}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Não foi possível calcular a distância</p>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 pb-4">
            <Button
              onClick={() => onToggleFavorite(school.id)}
              variant={isFavorite ? "default" : "outline"}
              className={`flex items-center justify-center gap-2 ${
                isFavorite
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : ""
              }`}
            >
              <Star
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? "fill-white" : ""}`}
              />
              <span className="whitespace-nowrap">{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</span>
            </Button>
            
            <Button
              onClick={handleOpenInMaps}
              className="flex items-center justify-center gap-2"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Ver no Google Maps</span>
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
