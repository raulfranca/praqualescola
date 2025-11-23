import { useState, useMemo } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ActionChips } from "@/components/ActionChips";
import { MapView } from "@/components/MapView";
import { HomeLocationInput } from "@/components/HomeLocationInput";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { FilterDrawer, SchoolLevel, ManagementType } from "@/components/FilterDrawer";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { School } from "@/types/school";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [shouldCenterMap, setShouldCenterMap] = useState(false);
  const [showHomeInput, setShowHomeInput] = useState(false);
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [selectedLevels, setSelectedLevels] = useState<SchoolLevel[]>(["creche", "pre", "fundamental"]);
  const [selectedManagement, setSelectedManagement] = useState<ManagementType[]>(["prefeitura", "terceirizada"]);
  const { schools, loading } = useSchoolsData();
  const { favorites, toggleFavorite } = useFavorites();
  const { homeLocation, setHome, clearHome, hasHome } = useHomeLocation();

  const hasLevel = (school: School, level: SchoolLevel): boolean => {
    switch (level) {
      case "creche":
        return !!(school.bercario || school.infantil1 || school.infantil2);
      case "pre":
        return !!(school.pre1 || school.pre2);
      case "fundamental":
        return !!(school.ano1 || school.ano2 || school.ano3 || school.ano4 || school.ano5);
      default:
        return false;
    }
  };

  const hasAnyLevel = (school: School): boolean => {
    return !!(
      school.bercario || school.infantil1 || school.infantil2 ||
      school.pre1 || school.pre2 ||
      school.ano1 || school.ano2 || school.ano3 || school.ano4 || school.ano5
    );
  };

  const filteredSchools = useMemo(() => {
    let filtered = schools;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (school) =>
          school.name.toLowerCase().includes(query) ||
          school.address.toLowerCase().includes(query) ||
          school.neighborhood.toLowerCase().includes(query)
      );
    }

    // Apply filters with exception rule
    filtered = filtered.filter((school) => {
      // Exception: Schools with NO levels are ALWAYS visible
      if (!hasAnyLevel(school)) {
        return true;
      }

      // For schools with levels, apply both filters
      const matchesLevel = selectedLevels.some((level) => hasLevel(school, level));
      
      const matchesManagement = selectedManagement.some((type) => {
        if (type === "prefeitura") {
          return !school.outsourced || school.outsourced.trim() === "";
        } else {
          return school.outsourced && school.outsourced.trim() !== "";
        }
      });

      return matchesLevel && matchesManagement;
    });

    return filtered;
  }, [searchQuery, schools, selectedLevels, selectedManagement]);

  // When selecting from search bar - should center map
  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
    setShouldCenterMap(true);
  };

  // When clicking on map marker - should NOT center map
  const handleSchoolClickOnMap = (school: School) => {
    setSelectedSchool(school);
    setShouldCenterMap(false);
  };

  const handleFilterClick = () => {
    setShowFilterDrawer(true);
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
              hasActiveFilters={selectedLevels.length < 3 || selectedManagement.length < 2}
            />
          </div>

          {/* Map View - Full Screen */}
          <div className="relative flex-1 w-full h-full">
            <MapView
              schools={filteredSchools}
              favorites={favorites}
              onToggleFavorite={toggleFavorite}
              selectedSchool={selectedSchool}
              onSchoolClick={handleSchoolClickOnMap}
              shouldCenterMap={shouldCenterMap}
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
          homeLocation={homeLocation}
          onClearLocation={() => {
            clearHome();
            setShowHomeInput(false);
          }}
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

      {/* Filter Drawer */}
      <FilterDrawer
        open={showFilterDrawer}
        onOpenChange={setShowFilterDrawer}
        selectedLevels={selectedLevels}
        onLevelsChange={setSelectedLevels}
        selectedManagement={selectedManagement}
        onManagementChange={setSelectedManagement}
        schoolCount={filteredSchools.length}
      />
    </div>
  );
};

export default Index;
