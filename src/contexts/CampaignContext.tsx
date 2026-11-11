import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { lerCampanha, type CampanhaNoAr } from "@/lib/campanha";

interface CampaignContextType {
  /** Campanha no ar, ou `null` sem campanha, com erro ou enquanto carrega. */
  campanha: CampanhaNoAr | null;
  isActive: boolean;
}

const CampaignContext = createContext<CampaignContextType>({ campanha: null, isActive: false });

/** Busca `/api/campanha` uma vez por abertura do app, sem bloquear a tela. */
export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campanha, setCampanha] = useState<CampanhaNoAr | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch("/api/campanha")
      .then((r) => (r.ok ? r.json() : null))
      .then((corpo) => {
        if (vivo) setCampanha(lerCampanha(corpo));
      })
      .catch(() => {
        // Sem rede ou sem /api (vite local): o app segue sem campanha.
      });
    return () => {
      vivo = false;
    };
  }, []);

  return (
    <CampaignContext.Provider value={{ campanha, isActive: campanha !== null }}>{children}</CampaignContext.Provider>
  );
}

export const useCampaign = (): CampaignContextType => useContext(CampaignContext);
