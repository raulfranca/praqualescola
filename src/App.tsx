import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { LoadScript } from "@react-google-maps/api";
import { UpdatePrompt } from "@/components/UpdatePrompt";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { FilterProvider } from "@/contexts/FilterContext";
import Index from "./pages/Index";
import Lista from "./pages/Lista";
import Favoritos from "./pages/Favoritos";
import Feedback from "./pages/Feedback";
import NotFound from "./pages/NotFound";

// Google Maps API Key and Libraries
const GOOGLE_MAPS_API_KEY = "AIzaSyAB6PNWQ6m8gkTSRXKfXtfvBthU50sljA8";
const GOOGLE_MAPS_LIBRARIES: ("places")[] = ["places"];

const queryClient = new QueryClient();

const App = () => (
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
        <InstallPromptBanner />
        <FilterProvider>
          <BrowserRouter>
            <SideNav />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/lista" element={<Lista />} />
              <Route path="/favoritos" element={<Favoritos />} />
              <Route path="/feedback" element={<Feedback />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </FilterProvider>
      </TooltipProvider>
      <Analytics />
    </LoadScript>
  </QueryClientProvider>
);

export default App;
