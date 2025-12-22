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
    campaignId: "remocao-2-2025",
    title: "Remoção 2025 - 2ª Fase",
    bannerMessage: "2ª Fase da Remoção aberta!",
    startsAt: "2025-11-24T00:00:00Z",
    endsAt: "2025-11-25T07:00:00Z",
    vacancyColumnHeader: "VAGAS_REMO",
  },
  {
    campaignId: "remocao-3-2025",
    title: "Remoção 2025 - 3ª Fase",
    bannerMessage: "3ª Fase da Remoção aberta!",
    startsAt: "2025-11-25T00:00:00Z",
    endsAt: "2025-11-28T07:00:00Z",
    vacancyColumnHeader: "VAGAS_REMO",
  },
  {
    campaignId: "vagas-sede-2026",
    title: "Vagas para Sede 2026",
    bannerMessage: "Vagas para sede disponíveis!",
    startsAt: "2025-12-01T00:00:00Z",
    endsAt: "2025-12-22T10:45:00Z",
    vacancyColumnHeader: "VAGAS_SEDE",
  },
  // Add future campaigns here - first active campaign in the array takes priority
];
