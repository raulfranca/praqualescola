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
    <div className="absolute top-0 left-0 right-0 z-40 bg-primary text-primary-foreground shadow-lg">
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
        <div className="flex items-center gap-2 flex-1">
          <Info className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">
            {config.bannerMessage}
          </p>
        </div>
        <Button
          onClick={onShowVacancies}
          variant="secondary"
          size="sm"
          className="flex-shrink-0 font-semibold"
        >
          Ver apenas escolas com vagas
        </Button>
      </div>
    </div>
  );
}
