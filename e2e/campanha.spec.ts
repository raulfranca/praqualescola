import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures/base";
import { ESCOLAS, interceptarSupabase } from "./fixtures/escolas";
import { avisoJaVisto, comAppInstalado, interceptarCampanha, oferecerInstalacao } from "./fixtures/campanha";

// A campanha no ar vem de /api/campanha (banco); sem ela, o app fica como sempre.

const cartao = (page: Page, inep: string) => {
  const e = ESCOLAS.find((x) => x.codigo_inep === inep)!;
  return page.locator("div.border-b", { has: page.getByRole("heading", { name: `${e.tipo} ${e.nome}`, exact: true }) });
};
const JONAS = "35010839";
const ABDIAS = "35073179";

test("com campanha no ar, a lista mostra as vagas de cada escola @campanha", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarCampanha(page);
  await avisoJaVisto(page);
  await page.goto("/lista");

  await expect(cartao(page, JONAS).getByText("2 vagas")).toBeVisible();
  await expect(cartao(page, ABDIAS).getByText("Sem vagas")).toBeVisible();

  await page.getByRole("button", { name: "Ordem alfabética" }).click();
  await expect(page.getByRole("menuitem", { name: "Número de vagas" })).toBeVisible();
});

test("sem campanha, nenhuma escola mostra vagas nem a ordenação por vagas @campanha", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarCampanha(page, null);
  await page.goto("/lista");

  await expect(cartao(page, JONAS)).toBeVisible();
  await expect(page.getByText(/\bvagas?\b/i)).toHaveCount(0);

  await page.getByRole("button", { name: "Ordem alfabética" }).click();
  await expect(page.getByRole("menuitem", { name: "Ordem alfabética" })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "Número de vagas" })).toHaveCount(0);
});

// --- Favoritos e detalhe ---

// Sem a marca "school-data-version", o app trata os favoritos como da base antiga e os apaga.
const favoritar = (page: Page, ineps: string[]) =>
  page.addInitScript((ids) => {
    localStorage.setItem("school-data-version", "supabase");
    localStorage.setItem("school-favorites", JSON.stringify(ids));
  }, ineps);
const nomeDe = (inep: string) => ESCOLAS.find((x) => x.codigo_inep === inep)!.nome;

test.describe("nos Favoritos", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("o resumo conta as prioridades com vaga e cada uma mostra o selo @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await avisoJaVisto(page);
    await favoritar(page, [JONAS, ABDIAS]);
    await page.goto("/favoritos");

    const resumo = page.getByTestId("resumo-campanha");
    await expect(resumo).toContainText("Remoção 2027 · 1ª fase");
    await expect(resumo).toContainText("1 das suas 2 prioridades têm vaga nesta fase.");
    await expect(page.getByText("2 vagas", { exact: true })).toBeVisible();
    await expect(page.getByText("Sem vagas", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/campanha-favoritos.png" });
  });

  test("sem favoritas, o resumo mostra só o nome e o prazo @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await avisoJaVisto(page);
    await page.goto("/favoritos");

    const resumo = page.getByTestId("resumo-campanha");
    await expect(resumo).toContainText("Remoção 2027 · 1ª fase");
    await expect(resumo).toContainText("Aberta até 13/11.");
    await expect(resumo).not.toContainText("prioridades");
  });

  test("sem campanha, não há resumo @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page, null);
    await favoritar(page, [JONAS, ABDIAS]);
    await page.goto("/favoritos");

    await expect(page.getByText(nomeDe(JONAS))).toBeVisible();
    await expect(page.getByTestId("resumo-campanha")).toHaveCount(0);
  });

  test("o detalhe de uma escola sem vaga mostra a campanha com 'Sem vagas' @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await avisoJaVisto(page);
    await favoritar(page, [ABDIAS]);
    await page.goto("/favoritos");

    await expect(page.getByTestId("resumo-campanha")).toContainText("Sua prioridade não tem vaga nesta fase.");
    await page.getByText(nomeDe(ABDIAS)).click();
    const detalhe = page.getByRole("dialog");
    await expect(detalhe.getByText("Remoção 2027 · 1ª fase")).toBeVisible();
    await expect(detalhe.getByText("Sem vagas", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/campanha-detalhe.png" });
  });
});

// --- Mapa: aviso de abertura ---

const aviso = (page: Page) => page.getByRole("dialog");
const selo = (page: Page) => page.getByRole("button", { name: /Remoção 2027 · 1ª fase/ });
const convite = (page: Page) => page.getByText("Instale o app no seu dispositivo");

test.describe("no mapa", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("visitante sem app instalado vê o aviso uma vez e 'Agora não' não volta ao recarregar @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await page.goto("/");

    await expect(aviso(page)).toBeVisible();
    await expect(aviso(page).getByText("Vagas abertas")).toBeVisible();
    await expect(aviso(page).getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toBeVisible();
    await expect(aviso(page).getByText("escolas com vaga", { exact: true })).toBeVisible();
    await expect(aviso(page).getByText("vagas no total", { exact: true })).toBeVisible();
    await expect(aviso(page).getByText("13 de novembro, às 7h")).toBeVisible();
    await page.screenshot({ path: "test-results/campanha-aviso.png" });

    await aviso(page).getByRole("button", { name: "Agora não" }).click();
    await expect(aviso(page)).toHaveCount(0);

    await page.reload();
    await expect(page.getByRole("button", { name: "Filtros" })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(aviso(page)).toHaveCount(0);
    await expect(selo(page)).toHaveCount(0);
  });

  test("sem app instalado, o convite para instalar vem depois do aviso @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await page.goto("/");
    await expect(aviso(page)).toBeVisible();
    await oferecerInstalacao(page);
    await page.waitForTimeout(500);
    await expect(convite(page)).toHaveCount(0);

    await aviso(page).getByRole("button", { name: "Agora não" }).click();
    await expect(convite(page)).toBeVisible();
    await page.screenshot({ path: "test-results/campanha-convite.png" });

    await page.getByRole("button", { name: "Fechar convite" }).click();
    await expect(convite(page)).toHaveCount(0);
    await expect(selo(page)).toHaveCount(0);
  });

  test("com app instalado não há convite @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await comAppInstalado(page);
    await avisoJaVisto(page);
    await page.goto("/");
    await oferecerInstalacao(page);
    await expect(page.getByRole("button", { name: "Filtros" })).toBeVisible();
    await page.waitForTimeout(500);
    await expect(convite(page)).toHaveCount(0);
  });

  test("'Ver escolas com vagas' abre os Filtros com 'Só escolas com vagas' ligado @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page);
    await page.goto("/");

    await aviso(page).getByRole("button", { name: "Ver escolas com vagas" }).click();

    const interruptor = page.getByRole("switch", { name: /Só escolas com vagas/ });
    await expect(interruptor).toBeVisible();
    await expect(interruptor).toHaveAttribute("aria-checked", "true");
  });

  test.describe("primeira visita", () => {
    test.use({ tourVisto: false });

    test("o tour vem antes; o aviso abre quando o tour termina @campanha", async ({ page }) => {
      await interceptarSupabase(page);
      await interceptarCampanha(page);
      await page.goto("/");
      const balao = page.getByRole("dialog");
      await expect(balao.getByRole("heading", { name: "Pra Qual Escola Eu Vou?" })).toBeVisible();
      await page.waitForTimeout(500);
      await expect(page.getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toHaveCount(0);

      await balao.getByRole("button", { name: "Pular" }).click();
      await expect(aviso(page).getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toBeVisible();
    });
  });

  test("sem campanha, nem selo nem aviso @campanha", async ({ page }) => {
    await interceptarSupabase(page);
    await interceptarCampanha(page, null);
    await comAppInstalado(page);
    await page.goto("/");

    await expect(page.getByRole("button", { name: "Filtros" })).toBeVisible();
    await expect(selo(page)).toHaveCount(0);
    await expect(aviso(page)).toHaveCount(0);
  });
});

test("se a campanha não carrega, o app abre normalmente, sem vagas @campanha", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarCampanha(page, 500);
  await page.goto("/lista");

  for (const escola of ESCOLAS) {
    await expect(page.getByRole("heading", { name: `${escola.tipo} ${escola.nome}`, exact: true })).toBeVisible();
  }
  await expect(page.getByText(/\bvagas?\b/i)).toHaveCount(0);
});
