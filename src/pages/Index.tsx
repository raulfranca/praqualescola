import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { MapView } from "@/components/MapView";
import { PrioritiesList } from "@/components/PrioritiesList";
import { schools } from "@/data/schoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { School } from "@/types/school";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"map" | "priorities">("map");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const { favorites, toggleFavorite, reorderFavorites } = useFavorites();

  const filteredSchools = useMemo(() => {
    if (!searchQuery.trim()) return schools;

    const query = searchQuery.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(query) ||
        school.address.toLowerCase().includes(query) ||
        school.neighborhood.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleSelectSchool = (school: School) => {
    setSelectedSchool(school);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "map" && (
        <>
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
          />
        </>
      )}

      {activeTab === "priorities" && (
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
