import { useState } from "react";
import { PrioritiesList } from "@/components/PrioritiesList";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { useCampaign } from "@/hooks/useCampaign";
import { School } from "@/types/school";
const Favoritos = () => {
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const {
    schools,
    loading
  } = useSchoolsData();
  const {
    favorites,
    toggleFavorite,
    reorderFavorites
  } = useFavorites();
  const {
    homeLocation
  } = useHomeLocation();
  const {
    isActive: isCampaignActive,
    config: campaign
  } = useCampaign();
  return <div className="flex flex-col h-screen bg-background overflow-hidden pb-16 md:pb-0 md:ml-16">
      {isCampaignActive && <div className="sticky top-0 z-50 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-100 dark:border-blue-900 px-4 py-3">
          <p className="text-sm text-blue-900 dark:text-blue-100 text-center truncate whitespace-nowrap overflow-hidden font-bold">
            {campaign.bannerMessage}
          </p>
        </div>}

      {loading && <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando escolas...</p>
          </div>
        </div>}

      {!loading && <PrioritiesList schools={schools} favorites={favorites} onReorder={reorderFavorites} onRemoveFavorite={toggleFavorite} homeLocation={homeLocation} onSchoolClick={setSelectedSchool} />}

      {selectedSchool && <SchoolDetailModal school={selectedSchool} isFavorite={favorites.includes(selectedSchool.id)} onToggleFavorite={toggleFavorite} onClose={() => setSelectedSchool(null)} homeLocation={homeLocation} />}
    </div>;
};
export default Favoritos;