import { expect, test, type Page } from "@playwright/test";
import { montarEscolas } from "../src/lib/escolasSupabase";
import { ESCOLAS, TURMAS, interceptarSupabase, marcarMigrado } from "./fixtures/escolas";
import type { School } from "../src/types/school";

// Visitante com endereço de casa salvo e cache de distâncias que cobre todas as escolas menos uma
// (caso real: escolas cadastradas depois do cálculo sumiam da lista). Escolas da fixture do Supabase.
const CASA = { lat: -22.9238, lng: -45.4617, address: "Centro, Pindamonhangaba - SP" };
const CHAVE_CACHE = `cachedDistances_${CASA.lat}_${CASA.lng}`;

let escolas: School[];
let faltante: School;

test.beforeAll(() => {
  escolas = montarEscolas(ESCOLAS, TURMAS);
  faltante = escolas[escolas.length - 1];
});

test.beforeEach(async ({ page }) => {
  await interceptarSupabase(page);
  await marcarMigrado(page);
});

async function prepararCacheIncompleto(page: Page) {
  const cache: Record<string, { distanceInKm: number; durationInMinutes: number }> = {};
  escolas
    .filter((e) => e.id !== faltante.id)
    .forEach((e, i) => (cache[e.id] = { distanceInKm: 1 + (i % 5), durationInMinutes: 3 + (i % 5) }));
  // Uma escola longe (acima dos 10 km / 30 min provisórios do filtro durante o carregamento).
  cache[escolas[0].id] = { distanceInKm: 25, durationInMinutes: 40 };
  await page.addInitScript(
    ([casa, chave, dados]) => {
      // Só na primeira carga: o teste confere depois o que o app gravou.
      if (localStorage.getItem("home-location")) return;
      localStorage.setItem("home-location", casa);
      localStorage.setItem("school-distances", dados);
      localStorage.setItem(chave, dados);
    },
    [JSON.stringify(CASA), CHAVE_CACHE, JSON.stringify(cache)]
  );
}

test("a escola que faltava no cache aparece na lista com distância @distancias", async ({ page }) => {
  await prepararCacheIncompleto(page);
  await page.goto("/lista");

  const cartao = page.locator("div.cursor-pointer", {
    has: page.getByRole("heading", { name: `${faltante.type} ${faltante.name}`, exact: true }),
  });
  await expect(cartao).toBeVisible({ timeout: 15_000 });
  await expect(cartao).toContainText(/\d+\.\d km/);

  const gravado = await page.evaluate((chave) => {
    return {
      geral: JSON.parse(localStorage.getItem("school-distances") ?? "{}"),
      endereco: JSON.parse(localStorage.getItem(chave) ?? "{}"),
    };
  }, CHAVE_CACHE);
  expect(gravado.geral[faltante.id]?.distanceInKm).toEqual(expect.any(Number));
  expect(gravado.endereco[faltante.id]?.distanceInKm).toEqual(expect.any(Number));
});

test("o filtro do mapa conta todas as escolas @distancias", async ({ page }) => {
  await prepararCacheIncompleto(page);
  await page.goto("/");

  await page.getByRole("button", { name: /Filtros/ }).click();
  await expect(page.getByRole("button", { name: `Mostrar ${escolas.length} escolas` })).toBeVisible({
    timeout: 15_000,
  });
});
