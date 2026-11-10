import { expect, test } from "./fixtures/base";
import type { Page } from "@playwright/test";
import { interceptarSupabase } from "./fixtures/escolas";

// Escola inativa (CAIC) com selo, e o detalhe mostrando os prédios onde as turmas dela funcionam.

const CAIC = "CMEI CAIC";
const SELO = "Prédio desativado";

const cardDe = (page: Page, nome: string) =>
  page.locator("div.cursor-pointer").filter({ has: page.getByRole("heading", { name: nome, exact: true }) });

async function abrirDetalhe(page: Page, nome: string) {
  await page.getByRole("heading", { name: nome, exact: true }).click();
  const detalhe = page.getByRole("dialog");
  await expect(detalhe).toBeVisible();
  return detalhe;
}

test.beforeEach(async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/lista");
});

test("card do CAIC mostra prédio desativado @caic", async ({ page }, info) => {
  await expect(cardDe(page, CAIC).getByText(SELO)).toBeVisible();
  await expect(cardDe(page, "EM Abdias Júnior Santiago e Silva").getByText(SELO)).toHaveCount(0);
  await cardDe(page, CAIC).screenshot({ path: info.outputPath("card-caic.png") });
});

test("detalhe do CAIC mostra aviso, observação e onde as turmas funcionam @caic", async ({ page }, info) => {
  const detalhe = await abrirDetalhe(page, CAIC);
  await expect(detalhe.getByText(SELO, { exact: true })).toBeVisible();
  await expect(detalhe.getByText("Observação", { exact: true })).toBeVisible();
  await expect(detalhe.getByText("O atendimento está sendo feito no CMEI Lucineia")).toBeVisible();
  await expect(detalhe.getByText("Turmas funcionando em")).toBeVisible();
  for (const sede of [
    "CMEI Lucineia Cristiani Marcelo do Amaral Carvalho",
    "CMEI Jonas Abib, Mons.",
    "EM Aníbal Ferreira Lima",
  ]) {
    await expect(detalhe.getByRole("button", { name: sede, exact: true })).toBeVisible();
  }
  await page.screenshot({ path: info.outputPath("detalhe-caic.png"), fullPage: true });
});

test("link da escola-sede troca o detalhe para ela @caic", async ({ page }) => {
  const detalhe = await abrirDetalhe(page, CAIC);
  await detalhe.getByRole("button", { name: "EM Aníbal Ferreira Lima", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Aníbal Ferreira Lima" })).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Rua General Ruy de Andrade Costa, 100")).toBeVisible();
  await expect(page.getByRole("dialog").getByText(SELO, { exact: true })).toHaveCount(0);
});

test.describe("no celular", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("detalhe do CAIC no celular mostra selo e escolas-sede @caic", async ({ page }, info) => {
    await cardDe(page, CAIC).screenshot({ path: info.outputPath("card-caic-celular.png") });
    const detalhe = await abrirDetalhe(page, CAIC);
    await expect(detalhe.getByText(SELO, { exact: true })).toBeVisible();
    await expect(detalhe.getByRole("button", { name: "EM Aníbal Ferreira Lima", exact: true })).toBeVisible();
    await page.waitForTimeout(500); // fim da animação do drawer, só para a captura
    await page.screenshot({ path: info.outputPath("detalhe-caic-celular.png") });
  });
});

test("escola ativa sem turmas fora não mostra selo nem a seção @caic", async ({ page }) => {
  const detalhe = await abrirDetalhe(page, "EM Abdias Júnior Santiago e Silva");
  await expect(detalhe.getByText("Rua João Maria Pires, 30")).toBeVisible();
  await expect(detalhe.getByText(SELO, { exact: true })).toHaveCount(0);
  await expect(detalhe.getByText("Turmas funcionando em")).toHaveCount(0);
});
