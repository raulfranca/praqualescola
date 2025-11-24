import { Star, GripVertical, X, MapPin, Clock } from "lucide-react";
import { School } from "@/types/school";
import { HomeLocation } from "@/hooks/useHomeLocation";
import { useState, useEffect } from "react";
import { calculateDistance, DistanceMatrixResult } from "@/lib/distanceMatrix";
import { Badge } from "@/components/ui/badge";
import { getSchoolLevelTags } from "@/lib/schoolTags";
import { useCampaign } from "@/hooks/useCampaign";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
interface PrioritiesListProps {
  schools: School[];
  favorites: number[];
  onReorder: (newOrder: number[]) => void;
  onRemoveFavorite: (schoolId: number) => void;
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
  onRemove: (id: number) => void;
  homeLocation: HomeLocation | null;
  onSchoolClick: (school: School) => void;
  isCampaignActive: boolean;
}) {
  const [distanceInfo, setDistanceInfo] = useState<DistanceMatrixResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  useEffect(() => {
    if (homeLocation) {
      console.log(`[School ${school.name}] Starting calculation for home location`);
      setIsCalculating(true);
      calculateDistance({
        lat: homeLocation.lat,
        lng: homeLocation.lng
      }, {
        lat: school.lat,
        lng: school.lng
      }).then(result => {
        console.log(`[School ${school.name}] Distance result:`, result);
        setDistanceInfo(result);
        setIsCalculating(false);
      }).catch(error => {
        console.error(`[School ${school.name}] Error calculating distance:`, error);
        setDistanceInfo(null);
        setIsCalculating(false);
      });
    } else {
      console.log("No home location set, skipping distance calculation");
      setIsCalculating(false);
    }
  }, [homeLocation, school.lat, school.lng, school.name]);
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
  return <div ref={setNodeRef} style={style} className="bg-card border border-border rounded-lg p-3 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div {...attributes} {...listeners} className="flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none shrink-0">
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {order}
          </span>
        </div>

        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSchoolClick(school)}>
          <h3 className="font-semibold text-foreground truncate mb-1">
            {school.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">
              {school.neighborhood}
            </p>
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary/10 text-primary whitespace-nowrap">
              {school.type}
            </span>
          </div>

          {/* Tags de Níveis */}
          {(() => {
          const levelTags = getSchoolLevelTags(school);
          return levelTags.length > 0 && <div className="flex flex-wrap gap-1.5 mb-2">
                {levelTags.map((tag, index) => <Badge key={index} className={`${tag.className} text-xs`}>
                    {tag.label}
                  </Badge>)}
              </div>;
        })()}
          <div className="flex flex-wrap gap-1.5">
            {homeLocation && <>
                {isCalculating ? <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground whitespace-nowrap">
                    Calculando...
                  </span> : distanceInfo ? <>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-orange/10 text-orange font-medium whitespace-nowrap">
                      <MapPin className="w-3 h-3" />
                      {distanceInfo.distance}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-orange/10 text-orange font-medium whitespace-nowrap">
                      <Clock className="w-3 h-3" />
                      {distanceInfo.duration}
                    </span>
                  </> : null}
              </>}
            {isCampaignActive && (
              school.vacancies && school.vacancies > 0 ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded font-semibold whitespace-nowrap bg-lime-500 text-white">
                  {school.vacancies === 1 ? "1 vaga" : `${school.vacancies} vagas`}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded font-semibold whitespace-nowrap bg-red-500 text-white">
                  Sem vagas
                </span>
              )
            )}
          </div>
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
      const oldIndex = favorites.indexOf(active.id as number);
      const newIndex = favorites.indexOf(over.id as number);
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
  return <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Arraste as escolas para organizá-las em ordem de prioridade. 
            Suas preferências são salvas automaticamente neste dispositivo.
          </p>
        </div>

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