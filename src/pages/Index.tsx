import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { MapView } from "@/components/MapView";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { School } from "@/types/school";
import { Button } from "@/components/ui/button";
import { Home, X } from "lucide-react";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showHomeInput, setShowHomeInput] = useState(false);
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite } = useFavorites();
  const { homeLocation, setHome, clearHome, hasHome } = useHomeLocation();

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;

    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.address.toLowerCase().includes(query) ||
        school.neighborhood.toLowerCase().includes(query)
    );
  }, [searchQuery, schools]);

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-16">
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="px-4 py-3">
          <h1 className="text-lg font-semibold text-center text-foreground">
            Pra Qual Escola Eu Vou?
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
        <>
          <div className="bg-background border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
              {!hasHome ? (
                <Button
                  onClick={() => setShowHomeInput(true)}
                  variant="default"
                  size="sm"
                  className="gap-2 w-full"
                >
                  <Home className="w-4 h-4" />
                  Definir Minha Casa
                </Button>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm flex-1 min-w-0">
                    <Home className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {homeLocation.address.split('-')[0].trim()}
                    </span>
                  </div>
                  <Button
                    onClick={clearHome}
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery}
            schools={schools}
            onSelectSchool={handleSelectSchool}
          />
          <div className="relative flex-1">
            <MapView
              schools={filteredSchools}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              selectedSchool={selectedSchool}
              onSchoolViewed={() => setSelectedSchool(null)}
              homeLocation={homeLocation}
            />
          </div>
        </>
      )}

      {showHomeInput && (
        <HomeLocationInput
          onLocationSelected={(location) => {
            setHome(location);
            setShowHomeInput(false);
          }}
          onClose={() => setShowHomeInput(false)}
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

export default Index;
