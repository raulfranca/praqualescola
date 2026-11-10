import { expect, test } from "./fixtures/base";
import { ESCOLAS, interceptarSupabase } from "./fixtures/escolas";

// Escolas lidas do Supabase da SME, id = código INEP, e o recomeço do aparelho na troca.

const TITULO_AVISO = "O app foi atualizado";
const ABDIAS = ESCOLAS.find((e) => e.codigo_inep === "35073179")!;

test("visitante novo vê as escolas do Supabase, sem aviso de recomeço @escolas", async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/lista");

  for (const escola of ESCOLAS) {
    await expect(page.getByRole("heading", { name: `${escola.tipo} ${escola.nome}`, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("dialog", { name: TITULO_AVISO })).toHaveCount(0);
});

test("professor antigo recomeça do zero e vê o aviso uma vez @escolas", async ({ page }) => {
  await interceptarSupabase(page);
  await page.addInitScript(() => {
    // Só antes da troca: depois dela o app grava a marca e a recarga não repõe os dados antigos.
    if (localStorage.getItem("school-data-version")) return;
    localStorage.setItem("school-favorites", "[1,34]");
    localStorage.setItem(
      "home-location",
      JSON.stringify({ lat: -22.9238, lng: -45.4617, address: "Centro, Pindamonhangaba - SP" })
    );
    localStorage.setItem("cachedDistances_-22.9238_-45.4617", JSON.stringify({ 1: { distanceInKm: 2 } }));
  });
  await page.goto("/");

  const aviso = page.getByRole("dialog", { name: TITULO_AVISO });
  await expect(aviso).toBeVisible();
  await expect(aviso).toContainText("cadastro oficial da Secretaria de Educação");
  await aviso.getByRole("button", { name: "Entendi" }).click();
  await expect(aviso).toBeHidden();

  const guardado = await page.evaluate(() => ({
    casa: localStorage.getItem("home-location"),
    cache: Object.keys(localStorage).filter((k) => k.startsWith("cachedDistances_")),
  }));
  expect(guardado).toEqual({ casa: null, cache: [] });

  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.getByText("Nenhuma escola favorita")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Nenhuma escola favorita")).toBeVisible();
  await expect(page.getByRole("dialog", { name: TITULO_AVISO })).toHaveCount(0);
});

test("falha do Supabase mostra o erro ao carregar escolas @escolas", async ({ page }) => {
  await interceptarSupabase(page, 500);
  await page.goto("/lista");
  await expect(page.getByText("Erro ao carregar escolas")).toBeVisible();
});

test("favoritar guarda o código INEP @escolas", async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/lista");

  await page.getByRole("heading", { name: `${ABDIAS.tipo} ${ABDIAS.nome}`, exact: true }).click();
  await page.getByRole("button", { name: "Adicionar aos Favoritos" }).click();
  await expect(page.getByRole("button", { name: "Remover dos Favoritos" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("school-favorites"))).toBe('["35073179"]');

  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Favoritos", exact: true }).click();
  await expect(page.getByText(ABDIAS.nome)).toBeVisible();
});
