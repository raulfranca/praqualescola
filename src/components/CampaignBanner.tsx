import { useState, useEffect } from "react";
import { useCampaign } from "@/hooks/useCampaign";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

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

  const handleShowVacancies = () => {
    handleDismiss(); // Dismiss banner permanently
    onShowVacancies(); // Execute the filter action
  };

  if (!isActive || isDismissed) return null;

  return (
    <div className="absolute top-44 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:max-w-lg">
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-xl shadow-lg p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              {config.bannerMessage}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleShowVacancies}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
              size="default"
            >
              Ver vagas disponíveis
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="default"
              className="w-full text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
