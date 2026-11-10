import { useState, useEffect } from "react";
import { useCampaign } from "@/hooks/useCampaign";
import { Button } from "@/components/ui/button";
import coruja from "../../design-system/assets/coruja.svg";

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
      <div className="bg-info-bg rounded-xl shadow-floating p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-3 text-info-fg">
            <img src={coruja} alt="" aria-hidden="true" className="h-8 w-8 flex-shrink-0" />
            <p className="text-sm font-semibold text-left">
              {config.bannerMessage}
            </p>
          </div>
          
          <div className="flex flex-col gap-2 w-full">
            <Button
              onClick={handleShowVacancies}
              className="w-full h-11 bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold"
              size="default"
            >
              Ver vagas disponíveis
            </Button>
            
            <Button
              onClick={handleDismiss}
              variant="ghost"
              size="default"
              className="w-full h-11 text-primary hover:bg-primary/10 hover:text-primary-strong"
            >
              Agora não
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
