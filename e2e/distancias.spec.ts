import { expect, test } from "./fixtures/base";
import type { Page, Route } from "@playwright/test";
import { montarEscolas } from "../src/lib/escolasSupabase";
import { ESCOLAS, TURMAS, interceptarSupabase, marcarMigrado } from "./fixtures/escolas";
import type { School } from "../src/types/school";

// Distâncias vêm só da função do servidor (/api/distancias), sempre interceptada aqui.
// O Places do Google é trocado por um Autocomplete falso (o real é pago e fica bloqueado).
const CASA = { lat: -22.9238, lng: -45.4617, address: "Centro, Pindamonhangaba - SP" };
const CHAVE_CACHE = `cachedDistances_${CASA.lat}_${CASA.lng}`;
const ENDERECOS = [
  { lat: -22.9301, lng: -45.4502, address: "Rua Um, Pindamonhangaba - SP" },
  { lat: -22.9155, lng: -45.4701, address: "Rua Dois, Pindamonhangaba - SP" },
  { lat: -22.9402, lng: -45.4405, address: "Rua Três, Pindamonhangaba - SP" },
];

// Chip da casa: "Minha Casa" ou o endereço cortado em 18 caracteres.
const CHIP_CASA = /Minha Casa|Pindamon/;

let escolas: School[];
let faltante: School;

test.beforeAll(() => {
  escolas = montarEscolas(ESCOLAS, TURMAS);
  faltante = escolas[escolas.length - 1];
});

test.beforeEach(async ({ page }) => {
  await interceptarSupabase(page);
  await marcarMigrado(page);
  await page.addInitScript(() => {
    type Lugar = { lat: number; lng: number; address: string };
    const w = window as unknown as {
      google?: { maps?: { places?: unknown } };
      __escolherLugar?: (l: Lugar) => void;
    };
    let ouvinte: (() => void) | null = null;
    let lugar: Lugar | null = null;
    class Autocomplete {
      addListener(_evento: string, cb: () => void) {
        ouvinte = cb;
      }
      getPlace() {
        return lugar && {
          formatted_address: lugar.address,
          geometry: { location: { lat: () => lugar!.lat, lng: () => lugar!.lng } },
        };
      }
    }
    class AutocompleteSessionToken {}
    w.__escolherLugar = (l) => {
      lugar = l;
      ouvinte?.();
    };
    // O script do mapa pode recriar google.maps.places depois: reafirma o falso.
    setInterval(() => {
      const maps = w.google?.maps;
      const places = maps?.places as { Autocomplete?: unknown } | undefined;
      if (maps && places?.Autocomplete !== Autocomplete) maps.places = { Autocomplete, AutocompleteSessionToken };
    }, 20);
  });
});

/** Responde /api/distancias com todas as escolas (2,5 km / 7 min) no estado pedido. */
async function responderDistancias(page: Page, estado: "normal" | "aproximado") {
  const pedidos: unknown[] = [];
  await page.route("**/api/distancias", async (rota: Route) => {
    pedidos.push(rota.request().postDataJSON());
    const distancias = Object.fromEntries(
      escolas.map((e) => [e.id, { distanceInKm: 2.5, durationInMinutes: 7, aproximado: estado === "aproximado" }])
    );
    await rota.fulfill({ json: { estado, distancias } });
  });
  return pedidos;
}

function cartao(page: Page, escola: School) {
  return page.locator("div.cursor-pointer", {
    has: page.getByRole("heading", { name: `${escola.type} ${escola.name}`, exact: true }),
  });
}

async function definirCasa(page: Page, lugar: { lat: number; lng: number; address: string }) {
  await page.getByRole("button", { name: CHIP_CASA }).first().click();
  const campo = page.getByPlaceholder("Digite seu endereço...");
  await expect(campo).toBeEnabled({ timeout: 15_000 });
  await page.evaluate((l) => (window as unknown as { __escolherLugar: (x: typeof l) => void }).__escolherLugar(l), lugar);
  await page.getByRole("button", { name: "Calcular distância e tempo" }).click();
  await expect(page.getByRole("heading", { name: "Definir Minha Casa" })).toBeHidden();
}

async function prepararCache(page: Page, opcoes: { faltando?: boolean; aproximado?: boolean }) {
  const cache: Record<string, { distanceInKm: number; durationInMinutes: number; aproximado?: boolean }> = {};
  escolas
    .filter((e) => !opcoes.faltando || e.id !== faltante.id)
    .forEach((e, i) => (cache[e.id] = { distanceInKm: 1 + (i % 5), durationInMinutes: 3 + (i % 5), aproximado: opcoes.aproximado }));
  // Uma escola longe (acima dos 10 km / 30 min provisórios do filtro durante o carregamento).
  cache[escolas[0].id] = { distanceInKm: 25, durationInMinutes: 40, aproximado: opcoes.aproximado };
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
  await responderDistancias(page, "normal");
  await prepararCache(page, { faltando: true });
  await page.goto("/lista");

  await expect(cartao(page, faltante)).toBeVisible({ timeout: 15_000 });
  await expect(cartao(page, faltante)).toContainText("2.5 km");

  const gravado = await page.evaluate((chave) => {
    return {
      geral: JSON.parse(localStorage.getItem("school-distances") ?? "{}"),
      endereco: JSON.parse(localStorage.getItem(chave) ?? "{}"),
    };
  }, CHAVE_CACHE);
  expect(gravado.geral[faltante.id]?.distanceInKm).toBe(2.5);
  expect(gravado.endereco[faltante.id]?.distanceInKm).toBe(2.5);
});

test("o filtro do mapa conta todas as escolas @distancias", async ({ page }) => {
  await responderDistancias(page, "normal");
  await prepararCache(page, { faltando: true });
  await page.goto("/");

  await page.getByRole("button", { name: /Filtros/ }).click();
  await expect(page.getByRole("button", { name: `Mostrar ${escolas.length} escolas` })).toBeVisible({
    timeout: 15_000,
  });
});

test("resposta aproximada mostra o selo na lista e o aviso no modal @distancias", async ({ page }) => {
  const pedidos = await responderDistancias(page, "aproximado");
  await page.goto("/lista");
  await definirCasa(page, ENDERECOS[0]);

  expect(pedidos[0]).toEqual({ lat: ENDERECOS[0].lat, lng: ENDERECOS[0].lng });
  await expect(cartao(page, faltante)).toContainText("2.5 km");
  await expect(cartao(page, faltante).getByText("aproximado", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: CHIP_CASA }).first().click();
  await expect(page.getByText(/As distâncias deste endereço são aproximadas/)).toBeVisible();
});

test("distâncias aproximadas salvas viram reais quando a função responde @distancias", async ({ page }) => {
  await responderDistancias(page, "normal");
  await prepararCache(page, { aproximado: true });
  await page.goto("/lista");

  await expect(cartao(page, faltante)).toContainText("2.5 km", { timeout: 15_000 });
  await expect(page.getByText("aproximado", { exact: true })).toHaveCount(0);
});

test("3 endereços novos por dia; no 4º o campo fica bloqueado @distancias", async ({ page }) => {
  const pedidos = await responderDistancias(page, "normal");
  await page.goto("/lista");

  for (const endereco of ENDERECOS) {
    await definirCasa(page, endereco);
    await expect(cartao(page, faltante)).toContainText("2.5 km");
  }
  expect(pedidos).toHaveLength(3);

  await page.getByRole("button", { name: CHIP_CASA }).first().click();
  await expect(page.getByText("Limite diário atingido", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Digite seu endereço...")).toBeDisabled();
});

test("com sessão do painel /admin o limite diário não vale @distancias @admin", async ({ page }) => {
  const pedidos = await responderDistancias(page, "normal");
  await page.addInitScript(() => {
    const d = new Date();
    const p = (n: number) => String(n).padStart(2, "0");
    const hoje = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
    localStorage.setItem("enderecos-do-dia", JSON.stringify({ data: hoje, quantidade: 3 }));
    sessionStorage.setItem("pqe-admin", JSON.stringify({ token: "t", expiraEm: Date.now() + 3_600_000 }));
  });
  await page.goto("/lista");

  await definirCasa(page, ENDERECOS[0]);
  await expect(cartao(page, faltante)).toContainText("2.5 km");
  expect(pedidos).toHaveLength(1);
});

test("função indisponível: o app mostra distâncias aproximadas sem erro @distancias", async ({ page }) => {
  await page.route("**/api/distancias", (rota) => rota.abort());
  await page.goto("/lista");
  await definirCasa(page, ENDERECOS[0]);

  await expect(cartao(page, faltante)).toContainText(/\d+\.\d km/);
  await expect(cartao(page, faltante).getByText("aproximado", { exact: true })).toBeVisible();
  await expect(page.getByText(/Erro/)).toHaveCount(0);
});
