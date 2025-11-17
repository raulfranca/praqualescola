import { useState } from "react";
import { PrioritiesList } from "@/components/PrioritiesList";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { School } from "@/types/school";

const Favoritos = () => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite, reorderFavorites } = useFavorites();
  const { homeLocation } = useHomeLocation();

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-16">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-center text-foreground">
            Favoritos
          </h1>
        </div>
      </header>

      {loading && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando escolas...</p>
          </div>
        </div>
      )}

      {!loading && (
        <PrioritiesList
          schools={schools}
          favorites={favorites}
          onReorder={reorderFavorites}
          onRemoveFavorite={toggleFavorite}
          homeLocation={homeLocation}
          onSchoolClick={setSelectedSchool}
        />
      )}

      {selectedSchool && (
        <SchoolDetailModal
          school={selectedSchool}
          isFavorite={favorites.includes(selectedSchool.id)}
          onToggleFavorite={toggleFavorite}
          onClose={() => setSelectedSchool(null)}
          homeLocation={homeLocation}
        />
      )}
    </div>
  );
};

export default Favoritos;
