import { useCampaign } from "@/hooks/useCampaign";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface CampaignBannerProps {
  onShowVacancies: () => void;
}

export function CampaignBanner({ onShowVacancies }: CampaignBannerProps) {
  const { isActive, config } = useCampaign();

  if (!isActive) return null;

  return (
    <div className="absolute top-32 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md md:max-w-lg">
      <div className="bg-primary text-primary-foreground rounded-xl shadow-lg px-4 py-3 md:px-5 md:py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              {config.bannerMessage}
            </p>
          </div>
          <Button
            onClick={onShowVacancies}
            variant="secondary"
            size="sm"
            className="flex-shrink-0 font-semibold whitespace-nowrap"
          >
            Ver apenas escolas com vagas
          </Button>
        </div>
      </div>
    </div>
  );
}
