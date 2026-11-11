import type { Page } from "@playwright/test";
import type { CampanhaNoAr } from "../../src/lib/campanha";

// Remoção 2027 de exemplo com os INEP do recorte de `escolas.ts`: Jonas Abib 2 vagas, Aníbal 1, Abdias sem vaga
// (fica fora do mapa, como no banco: só entram escolas com vaga > 0).
export const CAMPANHA_EXEMPLO: CampanhaNoAr = {
  id: "00000000-0000-4000-8000-000000000001",
  nome: "Remoção 2027 · 1ª fase",
  descricao: "Vagas iniciais publicadas pela Secretaria em 06/11/2026.",
  inicio: "2026-11-12T09:00:00Z",
  fim: "2026-11-13T10:00:00Z",
  fonte: "Vagas_Iniciais_para_Remocao_06_11_26.pdf",
  vagas: { "35010839": 2, "35191644": 1 },
  escolas_com_vaga: 2,
  total_vagas: 3,
};

/** O professor já fechou o aviso de abertura desta campanha numa visita anterior. */
export const avisoJaVisto = (page: Page) =>
  page.addInitScript((id) => localStorage.setItem(`dismissed_campaign_${id}`, "true"), CAMPANHA_EXEMPLO.id);

/** Finge o app instalado na tela inicial (iOS: `navigator.standalone`). */
export const comAppInstalado = (page: Page) =>
  page.addInitScript(() => Object.defineProperty(navigator, "standalone", { value: true, configurable: true }));

/** Finge que o navegador ofereceu a instalação (evento `beforeinstallprompt`). O `prompt()` falha como no Chrome
 *  sem toque do usuário, então quem aparece é o convite do app. */
export const oferecerInstalacao = (page: Page) =>
  page.evaluate(() => {
    const e = new Event("beforeinstallprompt") as Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> };
    e.prompt = () => Promise.reject(new Error("precisa de toque"));
    e.userChoice = new Promise(() => {});
    window.dispatchEvent(e);
  });

/** Responde `/api/campanha` com a campanha dada (`null` = nenhuma no ar) ou com o status de erro. */
export async function interceptarCampanha(page: Page, campanha: CampanhaNoAr | null | number = CAMPANHA_EXEMPLO) {
  await page.route(/\/api\/campanha(\?|$)/, (rota) =>
    typeof campanha === "number"
      ? rota.fulfill({ status: campanha, body: "erro" })
      : rota.fulfill({ contentType: "application/json", body: JSON.stringify({ campanha }) }),
  );
}
