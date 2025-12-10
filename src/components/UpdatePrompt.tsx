import { useVersionedUpdatePrompt } from "@/hooks/useVersionedUpdatePrompt";
import { Button } from "@/components/ui/button";
import { RefreshCw, X } from "lucide-react";

export function UpdatePrompt() {
  const { showUpdatePrompt, handleUpdate, handleDismiss, title, subtitle } =
    useVersionedUpdatePrompt();

  if (!showUpdatePrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-4 md:left-auto md:right-4 md:max-w-md">
      <div className="bg-primary text-primary-foreground rounded-lg shadow-lg p-4 flex items-center gap-3 animate-in slide-in-from-bottom-5">
        <RefreshCw className="w-5 h-5 flex-shrink-0" />

        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs opacity-90 mt-0.5">{subtitle}</p>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            variant="secondary"
            className="font-medium"
          >
            Atualizar
          </Button>

          <Button
            onClick={handleDismiss}
            size="sm"
            variant="ghost"
            className="hover:bg-primary-foreground/20"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
