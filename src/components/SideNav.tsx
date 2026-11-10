import { MapIcon, List, Star } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export function SideNav() {
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
    <nav className="fixed left-0 top-0 h-screen w-16 z-50 bg-card shadow-floating hidden md:flex flex-col">
      <div className="flex flex-col items-center justify-start gap-2 py-4">
        {items.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-0.5 py-3 rounded-lg transition-colors w-16",
              item.isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", item.isActive && "fill-primary/20")} strokeWidth={1.75} />
            <span className="text-xs font-medium text-center">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
