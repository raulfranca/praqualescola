export interface CampaignConfig {
  campaignId: string;
  title: string;
  bannerMessage: string;
  startsAt: string; // ISO Date string
  endsAt: string; // ISO Date string
  vacancyColumnHeader: string; // CSV column name for vacancies
}

export const CAMPAIGNS: CampaignConfig[] = [
  {
    campaignId: "remocao-2025",
    title: "Remoção 2025",
    bannerMessage: "Vagas para Remoção 2025 disponíveis",
    startsAt: "2025-01-01T00:00:00Z",
    endsAt: "2025-12-31T23:59:59Z",
    vacancyColumnHeader: "VAGAS_REMOCAO"
  }
  // Add future campaigns here - first active campaign in the array takes priority
];
