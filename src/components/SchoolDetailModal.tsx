import { School } from "@/types/school";
import { X, Star, MapPin, Phone, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SchoolDetailModalProps {
  school: School;
  isFavorite: boolean;
  onToggleFavorite: (schoolId: number) => void;
  onClose: () => void;
}

export function SchoolDetailModal({
  school,
  isFavorite,
  onToggleFavorite,
  onClose,
}: SchoolDetailModalProps) {
  const handleOpenInMaps = () => {
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-card rounded-xl shadow-xl animate-in zoom-in-95 duration-300 max-h-[80vh] sm:max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-card border-b border-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-base sm:text-xl font-bold text-foreground pr-8 leading-tight">
            {school.name}
          </h2>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

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

          {/* Botões */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              onClick={() => onToggleFavorite(school.id)}
              className={`flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium transition-colors ${
                isFavorite
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              <Star
                className={`w-4 h-4 sm:w-5 sm:h-5 ${isFavorite ? "fill-white" : ""}`}
              />
              <span className="whitespace-nowrap">{isFavorite ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}</span>
            </button>
            
            <button
              onClick={handleOpenInMaps}
              className="flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="whitespace-nowrap">Ver no Google Maps</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
