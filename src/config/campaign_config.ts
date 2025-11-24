export interface CampaignConfig {
  campaignId: string;
  title: string;
  bannerMessage: string;
  startsAt: string; // ISO Date string
  endsAt: string; // ISO Date string
  vacancyColumnHeader: string; // CSV column name for vacancies
}

export const campaigns = [
  // --- CAMPANHA 1: REMOÇÃO (Janeiro/Fevereiro) ---
  {
    campaignId: "remocao_2025_fase2",
    title: "2a Fase da Remoção 2025",
    bannerMessage: "2a Fase da Remoção aberta! Confira as vagas.",
    startsAt: "2025-11-24T00:00:00",
    endsAt: "2025-11-25T07:00:00",
    vacancyColumnHeader: "VAGAS_REMO"
  }, // <--- Note a vírgula separando os blocos

  // --- CAMPANHA 2: Blank ---
  {
    campaignId: "atribuicao_2025",
    title: "Atribuição de Aulas",
    bannerMessage: "Atribuição iniciada. Veja escolas com saldo.",
    startsAt: "2027-03-01T00:00:00", // Começa 1 segundo depois da anterior
    endsAt: "2027-03-15T23:59:59",
    vacancyColumnHeader: "SALDO_ATRIBUICAO" // Pode usar outra coluna da planilha!
  }
];
