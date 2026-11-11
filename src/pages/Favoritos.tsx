import { useState, useEffect } from "react";
import { PrioritiesList } from "@/components/PrioritiesList";
import { SchoolDetailModal } from "@/components/SchoolDetailModal";
import { useSchoolsData } from "@/hooks/useSchoolsData";
import { useFavorites } from "@/hooks/useFavorites";
import { useHomeLocation } from "@/hooks/useHomeLocation";
import { useCampaign } from "@/contexts/CampaignContext";
import { School } from "@/types/school";
import { fimCurto, temVaga } from "@/lib/campanha";
import coruja from "../../design-system/assets/coruja.svg";
import { trackPageView } from "@/lib/analytics";
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
  const { campanha } = useCampaign();
  const favoritas = schools.filter((s) => favorites.includes(s.id));
  const comVaga = favoritas.filter(temVaga).length;

  // Track page view
  useEffect(() => {
    trackPageView('/favoritos', 'Favoritos - Lista de Prioridades');
  }, []);

  return <div className="flex flex-col h-screen bg-background overflow-hidden md:ml-16">
      {campanha && !loading && (
        <div
          data-testid="resumo-campanha"
          className="mx-4 mt-4 flex items-center gap-2.5 rounded-xl bg-info-bg py-3 pl-2 pr-3.5 text-info-fg md:mx-auto md:w-full md:max-w-2xl"
        >
          <img src={coruja} alt="" aria-hidden="true" className="h-[34px] w-[34px] flex-none" />
          <p className="flex min-w-0 flex-col text-[13px] leading-snug">
            <strong className="text-sm font-semibold">{campanha.nome}</strong>
            {favoritas.length === 1 ? (
              <span>
                Sua prioridade <strong>{comVaga ? "tem vaga" : "não tem vaga"}</strong> nesta fase.
              </span>
            ) : favoritas.length > 1 ? (
              <span>
                <strong>
                  {comVaga} das suas {favoritas.length}
                </strong>{" "}
                prioridades têm vaga nesta fase.
              </span>
            ) : (
              <span>Aberta até {fimCurto(campanha.fim)}.</span>
            )}
          </p>
        </div>
      )}

      {loading && <div className="flex items-center justify-center flex-1">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando escolas...</p>
          </div>
        </div>}

      {!loading && (
        <>
          <PrioritiesList 
            schools={schools} 
            favorites={favorites} 
            onReorder={reorderFavorites} 
            onRemoveFavorite={toggleFavorite} 
            homeLocation={homeLocation} 
            onSchoolClick={setSelectedSchool}
          />
        </>
      )}

      {selectedSchool && <SchoolDetailModal school={selectedSchool} isFavorite={favorites.includes(selectedSchool.id)} onToggleFavorite={toggleFavorite} onClose={() => setSelectedSchool(null)} homeLocation={homeLocation} schools={schools} onSelectSchool={setSelectedSchool} />}
    </div>;
};
export default Favoritos;