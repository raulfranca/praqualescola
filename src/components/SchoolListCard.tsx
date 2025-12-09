import { Star, MapPin, Clock } from "lucide-react";
import { School } from "@/types/school";
import { getSchoolLevelTags } from "@/lib/schoolTags";
import { useCampaign } from "@/hooks/useCampaign";
import { cn } from "@/lib/utils";

interface SchoolListCardProps {
  school: School & { distanceInKm?: number; durationInMinutes?: number };
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClick: () => void;
  hasHomeLocation: boolean;
}

export function SchoolListCard({
  school,
  isFavorite,
  onToggleFavorite,
  onClick,
  hasHomeLocation,
}: SchoolListCardProps) {
  const { isActive, config } = useCampaign();
  const levelTags = getSchoolLevelTags(school);

  const formatDistance = (km: number): string => {
    return `${km.toFixed(1)} km`;
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins.toString().padStart(2, "0")}min`;
  };

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite();
  };

  return (
    <div
      onClick={onClick}
      className="px-4 py-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors"
      style={{
        position: 'relative',
        width: '100vw',
        maxWidth: '100vw',
        minWidth: '320px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      {/* Container principal com posicionamento absoluto */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 'auto',
          minHeight: '60px',
          boxSizing: 'border-box'
        }}
      >
        {/* Coluna esquerda - posicionada absolutamente */}
        <div
          style={{
            position: 'absolute',
            left: '16px',
            right: '126px',
            top: '12px',
            bottom: '12px',
            overflow: 'hidden'
          }}
        >
          <h3
            className="font-semibold text-sm text-foreground"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {school.type} {school.name}
          </h3>

          {isActive && (
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className="text-xs text-muted-foreground"
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px'
                }}
              >
                {config.title}
              </span>
              <span
                className={cn(
                  "text-xs font-medium px-1.5 py-0.5 rounded flex-shrink-0",
                  school.vacancies && school.vacancies > 0
                    ? "bg-green-500/15 text-green-700"
                    : "bg-red-500/15 text-red-700"
                )}
              >
                {school.vacancies && school.vacancies > 0
                  ? `${school.vacancies} ${school.vacancies === 1 ? "vaga" : "vagas"}`
                  : "Sem vagas"}
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {levelTags.map((tag, idx) => (
              <span
                key={idx}
                className={cn("text-xs px-1.5 py-0.5 rounded font-medium flex-shrink-0", tag.className)}
              >
                {tag.label}
              </span>
            ))}

            {hasHomeLocation && school.distanceInKm !== undefined && (
              <>
                {levelTags.length > 0 && <span className="text-muted-foreground text-xs">•</span>}
                <span className="flex items-center gap-0.5 text-xs text-orange-600 font-medium flex-shrink-0">
                  <MapPin className="w-3 h-3" />
                  {formatDistance(school.distanceInKm)}
                </span>
              </>
            )}

            {hasHomeLocation && school.durationInMinutes !== undefined && (
              <span className="flex items-center gap-0.5 text-xs text-orange-600 font-medium flex-shrink-0">
                <Clock className="w-3 h-3" />
                {formatDuration(school.durationInMinutes)}
              </span>
            )}
          </div>
        </div>

        {/* Coluna direita - posicionada absolutamente */}
        <div
          style={{
            position: 'absolute',
            right: '16px',
            top: '12px',
            bottom: '12px',
            width: '110px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            boxSizing: 'border-box'
          }}
        >
          <span
            className="text-xs text-muted-foreground text-right"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              boxSizing: 'border-box'
            }}
          >
            {school.neighborhood}
          </span>
          <button
            onClick={handleStarClick}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label={isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          >
            <Star
              className={cn(
                "w-5 h-5",
                isFavorite ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
