import { Home, Filter, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "alphabetical" | "vacancies" | "distance" | "time";

interface ActionChipsProps {
  hasHome: boolean;
  homeAddress?: string;
  onHomeClick: () => void;
  onFilterClick: () => void;
  hasActiveFilters?: boolean;
  showSortChip?: boolean;
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  hasCampaign?: boolean;
}

export function ActionChips({
  hasHome,
  homeAddress,
  onHomeClick,
  onFilterClick,
  hasActiveFilters = false,
  showSortChip = false,
  sortBy = "alphabetical",
  onSortChange,
  hasCampaign = false,
}: ActionChipsProps) {
  const getSortLabel = (sort: SortOption | undefined): string => {
    switch (sort) {
      case "alphabetical": return "Ordem alfabética";
      case "vacancies": return "Número de vagas";
      case "distance": return "Distância";
      case "time": return "Tempo";
      default: return "Ordem";
    }
  };

  return (
    // A fileira rola na horizontal, o que corta a sombra dos chips nas bordas. As margens negativas com
    // padding dão espaço à sombra (margem de baixo com ! porque o space-y da Lista a sobrescreveria); o espaço extra não captura cliques (o mapa por baixo continua clicável).
    <div className="flex items-center gap-1.5 w-[calc(100%+2rem)] md:w-auto overflow-x-auto no-scrollbar -mx-4 px-4 pt-1 !-mb-9 pb-10 pointer-events-none [&>*]:pointer-events-auto">
      <Button 
        onClick={onHomeClick}
        data-tour="casa"
        size="sm"
        className={cn(
          "rounded-full shadow-floating h-8 px-3 gap-1.5 shrink-0 transition-all",
          hasHome 
            ? "bg-secondary text-primary hover:bg-secondary/80" 
            : "bg-card text-muted-foreground hover:bg-muted"
        )}
      >
        <Home className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">
          {hasHome && homeAddress 
            ? homeAddress.split('-')[0].trim().substring(0, 18) + (homeAddress.length > 18 ? '...' : '') 
            : "Minha Casa"}
        </span>
      </Button>

      {showSortChip && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              size="sm"
              className={cn(
                "rounded-full shadow-floating h-8 px-3 gap-1.5 shrink-0 transition-all",
                sortBy
                  ? "bg-secondary text-primary hover:bg-secondary/80"
                  : "bg-card text-muted-foreground hover:bg-muted"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{getSortLabel(sortBy)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover">
            <DropdownMenuItem 
              onClick={() => onSortChange?.("alphabetical")}
              className="flex items-center justify-between"
            >
              <span>Ordem alfabética</span>
              {sortBy === "alphabetical" && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
            {hasCampaign && (
              <DropdownMenuItem 
                onClick={() => onSortChange?.("vacancies")}
                className="flex items-center justify-between"
              >
                <span>Número de vagas</span>
                {sortBy === "vacancies" && <Check className="w-4 h-4" />}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem 
              onClick={() => hasHome && onSortChange?.("distance")}
              disabled={!hasHome}
              className="flex items-center justify-between"
            >
              <span className={!hasHome ? "text-muted-foreground" : ""}>Distância</span>
              {sortBy === "distance" && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => hasHome && onSortChange?.("time")}
              disabled={!hasHome}
              className="flex items-center justify-between"
            >
              <span className={!hasHome ? "text-muted-foreground" : ""}>Tempo</span>
              {sortBy === "time" && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <Button 
        onClick={onFilterClick}
        data-tour="filtros"
        size="sm"
        className={cn(
          "rounded-full shadow-floating h-8 px-3 gap-1.5 shrink-0 transition-all",
          hasActiveFilters
            ? "bg-secondary text-primary hover:bg-secondary/80"
            : "bg-card text-muted-foreground hover:bg-muted"
        )}
      >
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Filtros</span>
      </Button>
    </div>
  );
}
