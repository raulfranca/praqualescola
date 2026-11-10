import { School } from "@/types/school";
import { Star, MapPin, Phone, Building2, Car, Clock, School2, LogIn, Navigation, Info } from "lucide-react";
import { SeloDesativado } from "@/components/SeloDesativado";
import { Badge } from "@/components/ui/badge";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { distanciaSalva } from "@/hooks/useSchoolDistances";
import { formatarDistancia, formatarDuracao } from "@/lib/distanceCalculator";
import { SeloAproximado } from "@/components/SeloAproximado";
import { getSchoolLevelTags } from "@/lib/schoolTags";
import { useCampaign } from "@/hooks/useCampaign";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { trackEvent } from "@/lib/analytics";
interface SchoolDetailModalProps {
  school: School | null;
  isFavorite: boolean;
  onToggleFavorite: (schoolId: string) => void;
  onClose: () => void;
  homeLocation: HomeLocation | null;
  /** Todas as escolas, para achar os prédios onde funcionam turmas desta. */
  schools: School[];
  /** Troca a escola exibida (link das escolas-sede). */
  onSelectSchool: (school: School) => void;
}
export function SchoolDetailModal({
  school,
  isFavorite,
  onToggleFavorite,
  onClose,
  homeLocation,
  schools,
  onSelectSchool
}: SchoolDetailModalProps) {
  // Distância já calculada para a casa atual (lista/mapa); o detalhe nunca chama o Google.
  const distanceInfo = homeLocation && school ? distanciaSalva(school.id) : null;
  const isMobile = useIsMobile();
  const {
    isActive: isCampaignActive,
    config: campaign
  } = useCampaign();
  const handleGetDirections = () => {
    if (!school?.lat || !school?.lng) return;
    
    // Track directions view
    trackEvent('view_directions', {
      school_id: school.id,
      school_name: school.name
    });
    
    const { lat, lng, name } = school;
    
    // Detect mobile device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobileDevice) {
      // Use geo: URI to trigger native app picker on mobile
      const geoUri = `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name)})`;
      window.location.href = geoUri;
    } else {
      // Desktop: Open Google Maps directions in new tab
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      window.open(mapsUrl, "_blank");
    }
  };
  const sedes = (school?.hostedAt ?? [])
    .map(codigo => schools.find(s => s.id === codigo))
    .filter((s): s is School => !!s);

  // Content shared between mobile drawer and desktop dialog
  const content = school ? <div className="space-y-3 sm:space-y-4">
      {/* Observação do cadastro */}
      {school.note && <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Observação</p>
            <p className="text-sm text-foreground mt-1">{school.note}</p>
          </div>
        </div>}

      {/* Prédios onde funcionam turmas desta escola */}
      {sedes.length > 0 && <div className="flex items-start gap-2">
          <School2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Turmas funcionando em</p>
            <ul className="mt-1 space-y-1">
              {sedes.map(sede => <li key={sede.id}>
                  <button type="button" onClick={() => onSelectSchool(sede)} className="text-sm text-primary text-left font-medium rounded-sm hover:underline focus-visible:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    {sede.type} {sede.name}
                  </button>
                </li>)}
            </ul>
          </div>
        </div>}

      {/* Campaign Section */}
      {isCampaignActive && <div className="flex items-start gap-2">
          <LogIn className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{campaign.title}</p>
            <div className="mt-1">
              {school.vacancies && school.vacancies > 0 ? (
                <Badge className="bg-sucesso-bg text-sucesso-fg border-0 px-2.5 py-0.5 font-semibold">
                  {school.vacancies === 1 ? "1 vaga" : `${school.vacancies} vagas`}
                </Badge>
              ) : (
                <Badge className="bg-erro-bg text-erro-fg border-0 px-2.5 py-0.5 font-semibold">
                  Sem vagas
                </Badge>
              )}
            </div>
          </div>
        </div>}

      {/* Salas */}
      {(() => {
      const levelTags = getSchoolLevelTags(school);
      return levelTags.length > 0 && <div className="flex items-start gap-2">
            <School2 className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">Salas</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {levelTags.map((tag, index) => <Badge key={index} className={`${tag.className} border-0 px-2.5 py-0.5 font-medium`}>
                    {tag.label}
                  </Badge>)}
              </div>
            </div>
          </div>;
    })()}

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
          {school.cep && <p className="text-sm text-muted-foreground mt-1">
              CEP: {school.cep}
            </p>}
        </div>
      </div>

      {/* Telefone */}
      {school.phone && <div className="flex items-start gap-2">
          <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">Telefone</p>
            <p className="text-sm text-foreground mt-1">
              {school.phone}
            </p>
          </div>
        </div>}

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
      {homeLocation && <div className="bg-muted rounded-xl p-3">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium text-foreground">Distância de Casa</p>
            {distanceInfo?.aproximado && <SeloAproximado />}
          </div>

          {distanceInfo ? <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Distância</p>
                  <p className="text-sm font-semibold text-foreground">{formatarDistancia(distanceInfo.distanceInKm)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Tempo</p>
                  <p className="text-sm font-semibold text-foreground">
                    {distanceInfo.durationInMinutes !== undefined ? formatarDuracao(distanceInfo.durationInMinutes) : "—"}
                  </p>
                </div>
              </div>
            </div> : <p className="text-sm text-muted-foreground">Não foi possível calcular a distância</p>}
        </div>}

      {/* Botões */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 pb-4">
        <Button 
          onClick={() => {
            // Track adding to favorites (not removal)
            if (!isFavorite) {
              trackEvent('add_to_wishlist', {
                school_id: school.id,
                school_name: school.name,
                school_type: school.type
              });
            }
            onToggleFavorite(school.id);
          }} 
          variant={isFavorite ? "default" : "outline"} 
          className={`flex items-center justify-center gap-2 ${isFavorite ? "bg-favorite text-favorite-foreground hover:bg-favorite-strong" : ""}`}
        >
          <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? "fill-white" : ""}`} />
          <span className="whitespace-nowrap">{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</span>
        </Button>
        
        <Button onClick={handleGetDirections} className="flex items-center justify-center gap-2">
          <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="whitespace-nowrap">Como Chegar?</span>
        </Button>
      </div>
    </div> : null;

  // Mobile: Bottom drawer
  if (isMobile) {
    return <Drawer open={!!school} onOpenChange={open => !open && onClose()}>
        <DrawerContent className="max-h-[90vh]">
          {school && <>
              <DrawerHeader className="text-left border-b">
                <DrawerTitle className="text-lg sm:text-xl leading-tight pr-8">
                  {school.name}
                </DrawerTitle>
                {school.active === false && <SeloDesativado className="self-start justify-self-start" />}
                <DrawerDescription className="sr-only">
                  Detalhes da escola {school.name}
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 sm:p-6 overflow-y-auto">
                {content}
              </div>
            </>}
        </DrawerContent>
      </Drawer>;
  }

  // Desktop: Centered dialog
  return <Dialog open={!!school} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        {school && <>
            <DialogHeader>
              <DialogTitle className="text-xl leading-tight pr-8">
                {school.name}
              </DialogTitle>
              {school.active === false && <SeloDesativado className="self-start justify-self-start" />}
              <DialogDescription className="sr-only">
                Detalhes da escola {school.name}
              </DialogDescription>
            </DialogHeader>
            {content}
          </>}
      </DialogContent>
    </Dialog>;
}