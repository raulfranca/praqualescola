import { expect, test } from "./fixtures/base";
import { ESCOLAS, interceptarSupabase } from "./fixtures/escolas";

// Tour de primeira visita: aparece uma vez por aparelho, na tela do mapa.
test.use({ tourVisto: false, viewport: { width: 390, height: 844 } });
test.beforeEach(({ page }) => interceptarSupabase(page));

const TITULOS = ["As cores mostram as turmas", "Busque uma escola", "Minha Casa", "Filtros", "Lista", "Favoritos"];

test("primeira visita percorre as seis etapas e o tour não volta @tour", async ({ page }) => {
  await page.goto("/");
  const balao = page.getByRole("dialog");

  for (const [i, titulo] of TITULOS.entries()) {
    await expect(balao.getByRole("heading", { name: titulo, exact: true })).toBeVisible();
    await expect(balao).toContainText(`${i + 1} de ${TITULOS.length}`);
    await expect(balao).toBeInViewport({ ratio: 1 });
    if (i === 0) await expect(balao).toContainText("Pré-escola");
    await balao.getByRole("button", { name: i === TITULOS.length - 1 ? "Começar" : "Próximo" }).click();
  }
  await expect(balao).toHaveCount(0);

  // Livre para usar: a busca responde.
  await page.getByPlaceholder(/Buscar escola/).fill(ESCOLAS[0].nome.slice(0, 5));
  await expect(page.getByRole("button", { name: new RegExp(ESCOLAS[0].nome) }).first()).toBeVisible();

  await page.reload();
  await expect(page.getByPlaceholder(/Buscar escola/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("voltar retorna à etapa anterior @tour", async ({ page }) => {
  await page.goto("/");
  const balao = page.getByRole("dialog");
  await balao.getByRole("button", { name: "Próximo" }).click();
  await expect(balao.getByRole("heading", { name: TITULOS[1] })).toBeVisible();
  await balao.getByRole("button", { name: "Voltar" }).click();
  await expect(balao.getByRole("heading", { name: TITULOS[0] })).toBeVisible();
});

test("pular fecha o tour para sempre @tour", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("dialog").getByRole("button", { name: "Pular" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  await page.reload();
  await expect(page.getByPlaceholder(/Buscar escola/)).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("no computador o tour aponta para a barra lateral @tour", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  const balao = page.getByRole("dialog");
  for (let i = 0; i < TITULOS.length - 1; i++) await balao.getByRole("button", { name: "Próximo" }).click();
  await expect(balao.getByRole("heading", { name: "Favoritos" })).toBeVisible();
  await expect(balao).toBeInViewport({ ratio: 1 });
});

test("a tela de favoritos não mostra mais a dica de arrastar @tour", async ({ page }) => {
  await page.addInitScript((id) => {
    localStorage.setItem("tour-visto", "1");
    localStorage.setItem("school-data-version", "supabase");
    localStorage.setItem("school-favorites", JSON.stringify([id]));
  }, ESCOLAS[0].codigo_inep);
  await page.goto("/favoritos");
  await expect(page.getByText(ESCOLAS[0].nome)).toBeVisible();
  await expect(page.getByText("Dica:")).toHaveCount(0);
});
