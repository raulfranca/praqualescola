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
    <div className="absolute top-44 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-md">
      <div className="bg-amber-50 dark:bg-amber-950 rounded-xl shadow-lg p-5">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
            <Info className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm font-semibold">
              {config.bannerMessage}
            </p>
          </div>
          <Button
            onClick={onShowVacancies}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold"
            size="default"
          >
            Ver apenas escolas com vagas
          </Button>
        </div>
      </div>
    </div>
  );
}
