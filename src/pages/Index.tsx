import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ActionChips } from "@/components/ActionChips";
import { MapView } from "@/components/MapView";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { School } from "@/types/school";

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

  const handleFilterClick = () => {
    console.log("Filtros clicked - functionality coming soon");
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden pb-16 md:pb-0 md:ml-16">
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
          {/* Floating Search Bar and Action Chips */}
          <div className="absolute top-4 left-4 right-4 md:left-20 z-50 flex flex-col md:flex-row gap-3 md:items-start">
            <SearchBar
              value={searchQuery} 
              onChange={setSearchQuery}
              schools={schools}
              onSelectSchool={handleSelectSchool}
            />
            <ActionChips
              hasHome={hasHome}
              homeAddress={homeLocation?.address}
              onHomeClick={() => setShowHomeInput(true)}
              onFilterClick={handleFilterClick}
            />
          </div>

          {/* Map View - Full Screen */}
          <div className="relative flex-1 w-full h-full">
            <MapView
              schools={filteredSchools}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              selectedSchool={selectedSchool}
              onSchoolClick={handleSelectSchool}
              homeLocation={homeLocation}
            />
          </div>
        </>
      )}

      {/* Home Location Input - Always mounted, controlled by showHomeInput state */}
      {showHomeInput && (
        <HomeLocationInput
          onLocationSelected={(location) => {
            setHome(location);
            setShowHomeInput(false);
          }}
          onClose={() => setShowHomeInput(false)}
        />
      )}

      {/* School Detail Modal - Always mounted, controlled by open prop */}
      <SchoolDetailModal
        school={selectedSchool}
        isFavorite={selectedSchool ? favorites.includes(selectedSchool.id) : false}
        onToggleFavorite={() => selectedSchool && toggleFavorite(selectedSchool.id)}
        onClose={() => setSelectedSchool(null)}
        homeLocation={homeLocation}
      />
    </div>
  );
};

export default Index;
