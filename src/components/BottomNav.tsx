import { MapIcon, Star, MessageSquare } from "lucide-react";
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
      icon: Star,
      label: "Favoritos",
      path: "/favoritos",
      isActive: location.pathname === "/favoritos",
    },
    {
      icon: MessageSquare,
      label: "Contribua",
      path: "/feedback",
      isActive: location.pathname === "/feedback",
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex justify-around items-center h-16 px-2">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-[70px]",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", item.isActive && "fill-primary/20")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
