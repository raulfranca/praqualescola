import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { LoadScript } from "@react-google-maps/api";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { Maintenance } from "./pages/Maintenance";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import Index from "./pages/Index";
import Favoritos from "./pages/Favoritos";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

// Google Maps API Key and Libraries
const GOOGLE_MAPS_API_KEY = "AIzaSyAB6PNWQ6m8gkTSRXKfXtfvBthU50sljA8";
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const queryClient = new QueryClient();

// To enable maintenance mode (production/Vercel):
// 1. In Vercel dashboard: Add environment variable VITE_MAINTENANCE_MODE=true
// 2. Redeploy the app
// To disable maintenance mode: set VITE_MAINTENANCE_MODE=false or remove variable and redeploy.
// For local testing: create a `.env.local` with `VITE_MAINTENANCE_MODE=true` and run `npm run dev`.
const App = () => {
  // Check maintenance mode first. This early return prevents any other app code from running.
  const isMaintenanceMode = import.meta.env.VITE_MAINTENANCE_MODE === 'true';
  if (isMaintenanceMode) {
    return <Maintenance />;
  }

  return (
    <QueryClientProvider client={queryClient}>
    <LoadScript
      googleMapsApiKey={GOOGLE_MAPS_API_KEY}
      libraries={GOOGLE_MAPS_LIBRARIES}
      loadingElement={<div>Carregando...</div>}
    >
      <TooltipProvider>
        <Toaster />
        <Sonner 
          position="bottom-center" 
          className="mb-20 md:mb-4"
          toastOptions={{
            className: "w-full max-w-[calc(100vw-2rem)]",
          }}
        />
        <UpdatePrompt />
        <BrowserRouter>
          <SideNav />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/favoritos" element={<Favoritos />} />
            <Route path="/feedback" element={<Feedback />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <BottomNav />
        </BrowserRouter>
      </TooltipProvider>
      <Analytics />
    </LoadScript>
    </QueryClientProvider>
  );
};

export default App;
