import { MapIcon, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: "map" | "priorities";
  onTabChange: (tab: "map" | "priorities") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
      <div className="px-4 py-3">
        <h1 className="text-lg font-semibold text-center text-foreground mb-3">
          Pra Qual Escola Eu Vou?
        </h1>
        
        <nav className="flex gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => onTabChange("map")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all",
              activeTab === "map"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <MapIcon className="w-4 h-4" />
            <span className="text-sm">Mapa</span>
          </button>
          
          <button
            onClick={() => onTabChange("priorities")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md font-medium transition-all",
              activeTab === "priorities"
                ? "bg-card text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <ListOrdered className="w-4 h-4" />
            <span className="text-sm">Minhas Prioridades</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
