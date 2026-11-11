import { Star, GripVertical, X, MapPin, Clock } from "lucide-react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { distanciaSalva } from "@/hooks/useSchoolDistances";
import { formatarDistancia, formatarDuracao } from "@/lib/distanceCalculator";
import { SeloAproximado } from "@/components/SeloAproximado";
import { Badge } from "@/components/ui/badge";
import { SeloDesativado } from "@/components/SeloDesativado";
import { getSchoolLevelTags } from "@/lib/schoolTags";
import { useCampaign } from "@/contexts/CampaignContext";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { trackEvent } from "@/lib/analytics";
interface PrioritiesListProps {
  schools: School[];
  favorites: string[];
  onReorder: (newOrder: string[]) => void;
  onRemoveFavorite: (schoolId: string) => void;
  homeLocation: HomeLocation | null;
  onSchoolClick: (school: School) => void;
}
function SortableSchoolItem({
  school,
  order,
  onRemove,
  homeLocation,
  onSchoolClick,
  isCampaignActive
}: {
  school: School;
  order: number;
  onRemove: (id: string) => void;
  homeLocation: HomeLocation | null;
  onSchoolClick: (school: School) => void;
  isCampaignActive: boolean;
}) {
  // Distância já calculada para a casa atual; a lista de prioridades nunca chama o Google.
  const distanceInfo = homeLocation ? distanciaSalva(school.id) : null;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: school.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className="bg-card rounded-xl shadow-ambient p-3 hover:shadow-floating transition-shadow">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 text-primary font-bold text-sm">
            {order}
          </span>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSchoolClick(school)}>
          <h3 className="font-semibold text-foreground truncate mb-1">
            {school.type} {school.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            {school.neighborhood}
          </p>

          {school.active === false && <div className="mb-2"><SeloDesativado /></div>}

          {/* Vacancy Badge - On its own line */}
          {isCampaignActive && (
            <div className="mb-2">
              {school.vacancies && school.vacancies > 0 ? (
                <Badge className="bg-sucesso-bg text-sucesso-fg border-0 px-2.5 py-0.5 text-xs font-semibold">
                  {school.vacancies === 1 ? "1 vaga" : `${school.vacancies} vagas`}
                </Badge>
              ) : (
                <Badge className="bg-muted text-muted-foreground border-0 px-2.5 py-0.5 text-xs font-semibold">
                  Sem vagas
                </Badge>
              )}
            </div>
          )}

          {/* Tags de Níveis */}
          {(() => {
          const levelTags = getSchoolLevelTags(school);
          return levelTags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">
                {levelTags.map((tag, index) => <Badge key={index} className={`${tag.className} border-0 px-2.5 py-0.5 text-xs font-medium`}>
                    {tag.label}
                  </Badge>)}
              </div>;
        })()}
          
          {/* Distance/Duration Badges */}
          {homeLocation && (
            <div className="flex flex-wrap gap-1.5">
              {distanceInfo ? (
                <>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium whitespace-nowrap">
                    <MapPin className="w-3 h-3" />
                    {formatarDistancia(distanceInfo.distanceInKm)}
                  </span>
                  {distanceInfo.durationInMinutes !== undefined && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-medium whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {formatarDuracao(distanceInfo.durationInMinutes)}
                    </span>
                  )}
                  {distanceInfo.aproximado && <SeloAproximado />}
                </>
              ) : null}
            </div>
          )}
        </div>

        <button onClick={() => onRemove(school.id)} className="p-2 rounded-full hover:bg-destructive/10 transition-colors group shrink-0" title="Remover dos favoritos">
          <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
        </button>
      </div>
    </div>;
}
export function PrioritiesList({
  schools,
  favorites,
  onReorder,
  onRemoveFavorite,
  homeLocation,
  onSchoolClick
}: PrioritiesListProps) {
  const {
    isActive: isCampaignActive
  } = useCampaign();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // Sort schools by the order in favorites array
  const favoriteSchools = favorites.map(id => schools.find(school => school.id === id)).filter((school): school is School => school !== undefined);
  const handleDragEnd = (event: DragEndEvent) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      const oldIndex = favorites.indexOf(active.id as string);
      const newIndex = favorites.indexOf(over.id as string);
      
      // Track reordering
      trackEvent('reorder_favorites', {
        school_id: active.id,
        old_position: oldIndex + 1,
        new_position: newIndex + 1
      });
      
      onReorder(arrayMove(favorites, oldIndex, newIndex));
    }
  };
  if (favoriteSchools.length === 0) {
    return <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <Star className="w-24 h-24 mx-auto mb-4 text-muted-foreground/30 stroke-1" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            Nenhuma escola favorita
          </h2>
          <p className="text-muted-foreground">
            Volte para o mapa e favorite as escolas que você tem interesse.
            Depois você poderá organizá-las aqui por ordem de prioridade.
          </p>
        </div>
      </div>;
  }
  return <div className="flex-1 overflow-y-auto p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-4">
      <div className="max-w-2xl mx-auto">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={favorites} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {favoriteSchools.map((school, index) => <SortableSchoolItem key={school.id} school={school} order={index + 1} onRemove={onRemoveFavorite} homeLocation={homeLocation} onSchoolClick={onSchoolClick} isCampaignActive={isCampaignActive} />)}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>;
}