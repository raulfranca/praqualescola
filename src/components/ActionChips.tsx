import { Home, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ActionChipsProps {
  hasHome: boolean;
  homeAddress?: string;
  onHomeClick: () => void;
  onFilterClick: () => void;
}

export function ActionChips({ 
  hasHome, 
  homeAddress, 
  onHomeClick, 
  onFilterClick 
}: ActionChipsProps) {
  return (
    <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
      <Button
        onClick={onHomeClick}
        size="sm"
        className={cn(
          "rounded-full shadow-md h-10 px-4 gap-2 shrink-0 transition-all",
          hasHome
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-white text-foreground hover:bg-white/90 border border-border"
        )}
      >
        <Home className="w-4 h-4" />
        <span className="text-sm font-medium">
          {hasHome && homeAddress 
            ? homeAddress.split('-')[0].trim().substring(0, 20) + (homeAddress.length > 20 ? '...' : '')
            : "Minha Casa"
          }
        </span>
      </Button>

      <Button
        onClick={onFilterClick}
        size="sm"
        className="rounded-full shadow-md h-10 px-4 gap-2 shrink-0 bg-white text-foreground hover:bg-white/90 border border-border"
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filtros</span>
      </Button>
    </div>
  );
}
