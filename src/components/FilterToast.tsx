import { Filter } from "lucide-react";

interface FilterToastProps {
  schoolCount: number;
  hasActiveFilters: boolean;
}

export const FilterToast = ({ schoolCount, hasActiveFilters }: FilterToastProps) => {
  if (!hasActiveFilters) {
    return null;
  }

  return (
    <div className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="bg-black/80 text-white text-xs px-4 py-2 rounded-full shadow-lg backdrop-blur-sm flex items-center gap-2">
        <Filter className="w-3.5 h-3.5" />
        <span>
          {schoolCount === 1 ? "1 escola filtrada" : `${schoolCount} escolas filtradas`}
        </span>
      </div>
    </div>
  );
};
