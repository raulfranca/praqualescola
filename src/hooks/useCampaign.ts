import { useMemo } from "react";
import { CAMPAIGN_CONFIG } from "@/config/campaign_config";

export function useCampaign() {
  const isActive = useMemo(() => {
    const now = new Date();
    const startDate = new Date(CAMPAIGN_CONFIG.startsAt);
    const endDate = new Date(CAMPAIGN_CONFIG.endsAt);
    
    return now >= startDate && now <= endDate;
  }, []);

  return {
    isActive,
    config: CAMPAIGN_CONFIG
  };
}
