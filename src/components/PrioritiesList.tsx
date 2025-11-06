import { Star, GripVertical, X } from "lucide-react";
import { School } from "@/types/school";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface PrioritiesListProps {
  schools: School[];
  favorites: number[];
  onReorder: (newOrder: number[]) => void;
  onRemoveFavorite: (schoolId: number) => void;
}

function SortableSchoolItem({
  school,
  order,
  onRemove,
}: {
  school: School;
  order: number;
  onRemove: (id: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: school.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {order}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            {school.name}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            {school.neighborhood}
          </p>
          <div className="flex gap-2">
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-primary/10 text-primary">
              {school.type}
            </span>
            <span className="inline-block px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground">
              Setor {school.sector}
            </span>
          </div>
        </div>

        <button
          onClick={() => onRemove(school.id)}
          className="p-2 rounded-full hover:bg-destructive/10 transition-colors group"
          title="Remover dos favoritos"
        >
          <X className="w-5 h-5 text-muted-foreground group-hover:text-destructive" />
        </button>
      </div>
    </div>
  );
}

export function PrioritiesList({
  schools,
  favorites,
  onReorder,
  onRemoveFavorite,
}: PrioritiesListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const favoriteSchools = schools.filter((school) =>
    favorites.includes(school.id)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = favorites.indexOf(active.id as number);
      const newIndex = favorites.indexOf(over.id as number);
      onReorder(arrayMove(favorites, oldIndex, newIndex));
    }
  };

  if (favoriteSchools.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
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
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Dica:</strong> Arraste as escolas para organizá-las em ordem de prioridade. 
            Suas preferências são salvas automaticamente neste dispositivo.
          </p>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={favorites}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {favoriteSchools.map((school, index) => (
                <SortableSchoolItem
                  key={school.id}
                  school={school}
                  order={index + 1}
                  onRemove={onRemoveFavorite}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
}
