import { X, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface IOSInstallBannerProps {
  onDismiss: () => void;
}

export function IOSInstallBanner({ onDismiss }: IOSInstallBannerProps) {
  return (
    <div className="fixed bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-8 left-4 right-4 z-50 bg-card rounded-xl shadow-floating p-4 md:left-20 md:max-w-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
          <Share className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            Instale o app no seu iPhone
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Toque em{" "}
            <Share className="inline w-3 h-3 align-text-bottom" /> e depois em
            "Adicionar à Tela de Início"
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0 h-11 w-11 -m-1.5"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
