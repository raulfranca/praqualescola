import { Home, Filter, ArrowUpDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SortOption = "default" | "alphabetical" | "vacancies" | "distance" | "time";

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
  sortBy = "default",
  onSortChange,
  hasCampaign = false,
}: ActionChipsProps) {
  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case "alphabetical": return "A-Z";
      case "vacancies": return "Vagas";
      case "distance": return "Distância";
      case "time": return "Tempo";
      default: return "Ordem";
    }
  };

  return (
    <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto no-scrollbar py-1">
      <Button 
        onClick={onHomeClick} 
        size="sm" 
        className={cn(
          "rounded-full shadow-md h-8 px-3 gap-1.5 shrink-0 transition-all",
          hasHome 
            ? "bg-primary text-primary-foreground hover:bg-primary/90" 
            : "bg-white text-foreground hover:bg-white/90 border border-border"
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
                "rounded-full shadow-md h-8 px-3 gap-1.5 shrink-0 transition-all",
                sortBy !== "default"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-white text-foreground hover:bg-white/90 border border-border"
              )}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">{getSortLabel(sortBy)}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover">
            <DropdownMenuItem 
              onClick={() => onSortChange?.("default")}
              className="flex items-center justify-between"
            >
              <span>Ordem original</span>
              {sortBy === "default" && <Check className="w-4 h-4" />}
            </DropdownMenuItem>
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
        size="sm"
        className={cn(
          "rounded-full shadow-md h-8 px-3 gap-1.5 shrink-0 transition-all",
          hasActiveFilters
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-white text-foreground hover:bg-white/90 border border-border"
        )}
      >
        <Filter className="w-3.5 h-3.5" />
        <span className="text-xs font-medium">Filtros</span>
      </Button>
    </div>
  );
}
