import { MapIcon, List, Star } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    {
      icon: MapIcon,
      label: "Mapa",
      path: "/",
      isActive: location.pathname === "/",
    },
    {
      icon: List,
      label: "Lista",
      path: "/lista",
      isActive: location.pathname === "/lista",
    },
    {
      icon: Star,
      label: "Favoritos",
      path: "/favoritos",
      isActive: location.pathname === "/favoritos",
    },
  ];

  return (
    <nav className="fixed bottom-[calc(1.75rem+env(safe-area-inset-bottom))] left-3 right-3 z-50 bg-card shadow-floating rounded-2xl md:hidden">
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            data-tour={item.label.toLowerCase()}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[70px]",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", item.isActive && "fill-primary/20")} strokeWidth={1.75} />
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
