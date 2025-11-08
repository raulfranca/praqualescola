import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
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
            
            {/* Feedback Button */}
            <div className="absolute bottom-4 left-4 right-4 z-10">
              <Button
                onClick={() => navigate("/feedback")}
                className="w-full shadow-lg"
                size="lg"
              >
                Sugerir uma correção ou ideia
              </Button>
            </div>
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

      {!loading && activeTab === "priorities" && (
        <PrioritiesList
          schools={schools}
          favorites={favorites}
          onReorder={reorderFavorites}
          onRemoveFavorite={toggleFavorite}
          homeLocation={homeLocation}
        />
      )}
    </div>
  );
};

export default Index;
