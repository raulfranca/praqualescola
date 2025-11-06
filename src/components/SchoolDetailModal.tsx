import { Star, MapPin, Phone, X } from "lucide-react";
import { School } from "@/types/school";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    school.address
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <Card className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 p-6 shadow-2xl border-border animate-in fade-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="pr-10">
          <div className="flex items-start gap-2 mb-2">
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-primary/10 text-primary">
              {school.type}
            </span>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-secondary text-secondary-foreground">
              Setor {school.sector}
            </span>
          </div>

          <h2 className="text-xl font-bold text-foreground mb-3">
            {school.name}
          </h2>

          <div className="space-y-3 mb-6">
            <div className="flex gap-3 text-sm">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-muted-foreground">{school.address}</p>
                <p className="text-foreground font-medium mt-1">
                  {school.neighborhood}
                </p>
              </div>
            </div>

            {school.phone && (
              <div className="flex gap-3 text-sm">
                <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">{school.phone}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={() => onToggleFavorite(school.id)}
              variant={isFavorite ? "default" : "outline"}
              className="flex-1"
            >
              <Star
                className={`w-4 h-4 mr-2 ${
                  isFavorite ? "fill-current" : ""
                }`}
              />
              {isFavorite ? "Favoritada" : "Favoritar"}
            </Button>

            <Button
              onClick={() => window.open(googleMapsUrl, "_blank")}
              variant="outline"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Ver no Mapa
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
