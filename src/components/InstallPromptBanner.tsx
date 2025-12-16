import { X, Download, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePWAInstallPrompt } from "@/hooks/usePWAInstallPrompt";
import { IOSInstallBanner } from "./IOSInstallBanner";

export function InstallPromptBanner() {
  const {
    canInstall,
    isIOS,
    showIOSBanner,
    triggerInstallPrompt,
    dismissIOSBanner,
    dismissInstallBanner,
  } = usePWAInstallPrompt();

  // Show iOS banner for iOS devices
  if (isIOS && showIOSBanner) {
    return <IOSInstallBanner onDismiss={dismissIOSBanner} />;
  }

  // Show install banner for Android/Desktop when install prompt is available
  if (!canInstall) {
    return null;
  }

  const handleInstall = async () => {
    await triggerInstallPrompt();
  };

  const handleDismiss = () => {
    dismissInstallBanner();
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-background border border-border rounded-xl shadow-lg p-4 md:left-20 md:max-w-sm animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Instale o app no seu dispositivo
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Acesso rápido e funciona offline!
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              onClick={handleInstall}
              className="h-8 px-3 text-xs"
            >
              <Download className="w-3 h-3 mr-1.5" />
              Instalar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-8 px-3 text-xs text-muted-foreground"
            >
              Agora não
            </Button>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-8 w-8"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
