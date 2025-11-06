import { useState, useMemo } from "react";
import { Header } from "@/components/Header";
import { SearchBar } from "@/components/SearchBar";
import { MapView } from "@/components/MapView";
import { PrioritiesList } from "@/components/PrioritiesList";
import { schools } from "@/data/schoolsData";
import { useFavorites } from "@/hooks/useFavorites";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"map" | "priorities">("map");
  const [searchQuery, setSearchQuery] = useState("");
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

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === "map" && (
        <>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <MapView
            schools={filteredSchools}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
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
