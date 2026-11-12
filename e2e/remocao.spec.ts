import { expect, test } from "./fixtures/base";

// Página do Assistente de Remoção (public/remocao/): estática, fora do app React.

test.describe("@remocao página do assistente", () => {
  test("mostra o passo a passo e monta o favorito apontando para esta pasta", async ({ page, baseURL }) => {
    await page.goto("/remocao/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Assistente de Remoção");
    const favorito = page.locator("#favorito");
    await expect(favorito).toBeVisible();
    const href = (await favorito.getAttribute("href")) ?? "";
    expect(href.startsWith("javascript:")).toBe(true);
    expect(decodeURIComponent(href)).toContain(`${baseURL}/remocao/`);
  });

  test("sem a barra no fim, vai para /remocao/ (senão os caminhos relativos quebram)", async ({ page }) => {
    await page.goto("/remocao");
    await expect(page).toHaveURL(/\/remocao\/$/);
    await expect(page.locator("#favorito")).toBeVisible();
  });

  test("o script do assistente é servido como JavaScript", async ({ request }) => {
    const resposta = await request.get("/remocao/assistente.js");
    expect(resposta.ok()).toBe(true);
    expect(resposta.headers()["content-type"]).toMatch(/javascript/);
    expect(await resposta.text()).toContain("VERSAO");
  });

  test("clicar no favorito fora da APUS avisa e leva ao login, sem trocar a página por texto", async ({ page }) => {
    await page.route("https://educ.apus.info/**", (rota) =>
      rota.fulfill({ contentType: "text/html", body: "<title>login APUS</title>" }),
    );
    await page.goto("/remocao/");
    const href = (await page.locator("#favorito").getAttribute("href")) ?? "";
    await page.evaluate((codigo) => (0, eval)(codigo), decodeURIComponent(href.slice("javascript:".length)));
    await expect(page.getByText(/login da APUS/)).toBeVisible();
    await expect(page.locator("#favorito")).toBeVisible();
    await page.waitForURL("https://educ.apus.info/professor/pinda");
  });
});
