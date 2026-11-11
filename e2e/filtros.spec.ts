import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures/base";
import { ESCOLAS, TURMAS, interceptarSupabase, marcarMigrado } from "./fixtures/escolas";
import { avisoJaVisto, interceptarCampanha } from "./fixtures/campanha";
import { montarEscolas } from "../src/lib/escolasSupabase";

// Gaveta de Filtros: cartão "Só escolas com vagas" (com campanha) e o bloco de distância/tempo.
test.use({ viewport: { width: 390, height: 844 } });

const abrirFiltros = async (page: Page) => {
  await page.getByRole("button", { name: /Filtros/ }).click();
  return page.getByRole("dialog", { name: "Filtros" });
};

test("com campanha, 'Só escolas com vagas' liga e o botão conta só as com vaga @filtros", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarCampanha(page);
  await avisoJaVisto(page);
  await page.goto("/");

  const gaveta = await abrirFiltros(page);
  const interruptor = gaveta.getByRole("switch", { name: /Só escolas com vagas/ });
  await expect(interruptor).not.toBeChecked();
  await expect(gaveta).toContainText("Remoção 2027 · 1ª fase · 2 escolas");
  await interruptor.click();
  await expect(interruptor).toBeChecked();
  await expect(gaveta.getByRole("button", { name: "Mostrar 2 escolas" })).toBeVisible();
  await page.screenshot({ path: "test-results/filtros-campanha.png" });
});

test("sem campanha, o cartão não aparece @filtros", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarCampanha(page, null);
  await page.goto("/");

  const gaveta = await abrirFiltros(page);
  await expect(gaveta.getByRole("checkbox").first()).toBeVisible();
  await expect(gaveta.getByText("Só escolas com vagas")).toHaveCount(0);
});

test("com casa definida, o limite mostra quantas escolas cabem e o histograma acompanha @filtros", async ({ page }) => {
  const escolas = montarEscolas(ESCOLAS, TURMAS);
  const casa = { lat: -22.9238, lng: -45.4617, address: "Centro, Pindamonhangaba - SP" };
  const cache = Object.fromEntries(
    escolas.map((e, i) => [e.id, { distanceInKm: 1 + i * 2, durationInMinutes: 3 + i * 4, aproximado: false }]),
  );
  await interceptarSupabase(page);
  await marcarMigrado(page);
  await page.route("**/api/distancias", (rota) => rota.fulfill({ json: { estado: "normal", distancias: cache } }));
  await page.addInitScript(
    ([c, chave, dados]) => {
      localStorage.setItem("home-location", c);
      localStorage.setItem("school-distances", dados);
      localStorage.setItem(chave, dados);
    },
    [JSON.stringify(casa), `cachedDistances_${casa.lat}_${casa.lng}`, JSON.stringify(cache)],
  );
  await page.goto("/");

  const gaveta = await abrirFiltros(page);
  const limite = gaveta.getByTestId("limite-distancia");
  await expect(limite).toContainText(`${escolas.length} escolas`);
  await expect(gaveta.locator("[data-dentro=false]")).toHaveCount(0);

  const slider = gaveta.getByRole("slider");
  await slider.focus();
  for (let i = 0; i < 25; i++) await slider.press("ArrowLeft");
  await expect(limite).not.toContainText(`${escolas.length} escolas`);
  await expect(gaveta.locator("[data-dentro=false]").first()).toBeAttached();
  await page.screenshot({ path: "test-results/filtros-distancia.png" });
});
