import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@fontsource-variable/inter";
import "@fontsource/work-sans/500.css";
import "@fontsource/work-sans/600.css";
import "./index.css";
import { initGA } from "./lib/analytics";
import { MaintenancePage } from "./components/MaintenancePage";
import { recomecarAparelho } from "./lib/recomeco";

interface MaintenanceConfig {
  isUnderMaintenance: boolean;
  title: string;
  message: string;
}

async function checkMaintenance(): Promise<MaintenanceConfig | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    // Fetch from Vercel Edge Function that reads from Edge Config
    const response = await fetch(`/api/maintenance?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const config: MaintenanceConfig = await response.json();
    return config.isUnderMaintenance ? config : null;
  } catch (error) {
    // Fail gracefully - assume app is available
    console.warn('Could not check maintenance status:', error);
    return null;
  }
}

async function init() {
  const root = createRoot(document.getElementById("root")!);
  
  const maintenanceConfig = await checkMaintenance();

  if (maintenanceConfig) {
    root.render(
      <MaintenancePage 
        title={maintenanceConfig.title} 
        message={maintenanceConfig.message} 
      />
    );
  } else {
    // Initialize Google Analytics 4
    initGA();
    // Antes do render: os hooks leem favoritos, casa e distâncias do localStorage no estado inicial.
    recomecarAparelho(localStorage);
    root.render(<App />);
  }
}

init();
