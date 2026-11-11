import { Filter } from "lucide-react";

interface FilterToastProps {
  schoolCount: number;
  hasActiveFilters: boolean;
  /** Sobe para não cobrir o selo das vagas abertas (só no mapa). */
  acimaDoSelo?: boolean;
}

export const FilterToast = ({ schoolCount, hasActiveFilters, acimaDoSelo = false }: FilterToastProps) => {
  if (!hasActiveFilters) {
    return null;
  }

  const posicao = acimaDoSelo
    ? "bottom-[calc(9.5rem+env(safe-area-inset-bottom))] md:bottom-[5.5rem]"
    : "bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-8";

  return (
    <div className={`fixed ${posicao} left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className="bg-foreground/85 text-background text-xs px-4 py-2 rounded-full shadow-floating backdrop-blur-sm flex items-center gap-2">
        <Filter className="w-3.5 h-3.5" strokeWidth={1.75} />
        <span>
          {schoolCount === 1 ? "Exibindo 1 escola filtrada" : `Exibindo ${schoolCount} escolas filtradas`}
        </span>
      </div>
    </div>
  );
};
