import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { MapView } from "@/components/MapView";
import { PrioritiesList } from "@/components/PrioritiesList";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { School } from "@/types/school";
import { Button } from "@/components/ui/button";
import { Home, X } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"map" | "priorities">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [showHomeInput, setShowHomeInput] = useState(false);
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite, reorderFavorites } = useFavorites();
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
    <div className="flex flex-col h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {loading && (
        <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando escolas...</p>
          </div>
        </div>
      )}

      {!loading && activeTab === "map" && (
        <>
          <div className="bg-background border-b border-border">
            <div className="px-4 py-3 flex items-center gap-2">
              {!hasHome ? (
                <Button
                  onClick={() => setShowHomeInput(true)}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Home className="w-4 h-4" />
                  🏠 Definir Minha Casa
                </Button>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-sm flex-1">
                    <Home className="w-4 h-4" />
                    <span className="truncate">{homeLocation.address}</span>
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
          <MapView
            schools={filteredSchools}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            selectedSchool={selectedSchool}
            onSchoolViewed={() => setSelectedSchool(null)}
            homeLocation={homeLocation}
          />
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

      {!loading && activeTab === "priorities" && (
        <PrioritiesList
          schools={schools}
          favorites={favorites}
          onReorder={reorderFavorites}
          onRemoveFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default Index;
