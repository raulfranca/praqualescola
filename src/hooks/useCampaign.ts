import { useMemo } from "react";
import { CAMPAIGNS } from "@/config/campaign_config";

export function useCampaign() {
  const activeCampaign = useMemo(() => {
    const now = new Date();
    
    // Find first campaign where current date is within start/end range
    return CAMPAIGNS.find(campaign => {
      const startDate = new Date(campaign.startsAt);
      const endDate = new Date(campaign.endsAt);
      return now >= startDate && now <= endDate;
    });
  }, []);

  return {
    isActive: !!activeCampaign,
    config: activeCampaign || CAMPAIGNS[0] // Fallback to first campaign for type safety
  };
}
