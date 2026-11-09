import { expect, test } from "@playwright/test";

// Teste de fumaça: prova que o servidor sobe e o app desenha a tela. Serve de modelo para os demais.
test("a página inicial abre @fumaca", async ({ page }) => {
  const resposta = await page.goto("/");
  expect(resposta?.ok()).toBeTruthy();
  await expect(page).toHaveTitle(/Pra Qual Escola/);
  await expect(page.getByPlaceholder(/Buscar escola/)).toBeVisible();
});
