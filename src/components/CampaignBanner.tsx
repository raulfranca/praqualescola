import { useState, useEffect } from "react";
import { useCampaign } from "@/hooks/useCampaign";
import { Button } from "@/components/ui/button";
import { Info, X } from "lucide-react";

interface CampaignBannerProps {
  onShowVacancies: () => void;
}

export function CampaignBanner({ onShowVacancies }: CampaignBannerProps) {
  const { isActive, config } = useCampaign();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if this campaign has been dismissed
    const dismissKey = `dismissed_campaign_${config.campaignId}`;
    const wasDismissed = localStorage.getItem(dismissKey) === "true";
    setIsDismissed(wasDismissed);
  }, [config.campaignId]);

  const handleDismiss = () => {
    const dismissKey = `dismissed_campaign_${config.campaignId}`;
    localStorage.setItem(dismissKey, "true");
    setIsDismissed(true);
  };

  if (!isActive || isDismissed) return null;

  return (
    <div className="absolute top-44 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:max-w-lg">
      <div className="relative bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl shadow-lg p-5">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="absolute top-2 right-2 h-6 w-6 text-blue-600 hover:text-blue-900 hover:bg-blue-100 dark:text-blue-400 dark:hover:text-blue-200"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </Button>
        
        <div className="flex flex-col items-center gap-3 text-center pr-6">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              {config.bannerMessage}
            </p>
          </div>
          <Button
            onClick={onShowVacancies}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            size="default"
          >
            Ver apenas escolas com vagas
          </Button>
        </div>
      </div>
    </div>
  );
}
