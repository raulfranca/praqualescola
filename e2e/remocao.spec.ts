import { expect, test } from "./fixtures/base";

// Página do Assistente de Remoção (public/remocao/): estática, fora do app React.

test.describe("@remocao página do assistente", () => {
  test("mostra o passo a passo e monta o favorito apontando para esta pasta", async ({ page, baseURL }) => {
    await page.goto("/remocao/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Assistente de Remoção");
    await expect(page.locator(".chrome-favoritos").first()).toBeVisible();
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

  test("clicar no favorito fora da APUS abre o login numa nova aba e mantém esta página", async ({ page, context }) => {
    await context.route("https://educ.apus.info/**", (rota) =>
      rota.fulfill({ contentType: "text/html", body: "<title>login APUS</title>" }),
    );
    await page.goto("/remocao/");
    const href = (await page.locator("#favorito").getAttribute("href")) ?? "";
    const novaAba = context.waitForEvent("page");
    await page.evaluate((codigo) => (0, eval)(codigo), decodeURIComponent(href.slice("javascript:".length)));
    const login = await novaAba;
    await login.waitForURL("https://educ.apus.info/professor/pinda");
    await expect(page.getByText(/login da APUS numa nova aba/)).toBeVisible();
    await expect(page).toHaveURL(/\/remocao\/$/);
    await expect(page.locator("#favorito")).toBeVisible();
  });

  test("no computador não mostra o aviso de celular", async ({ page }) => {
    await page.goto("/remocao/");
    await expect(page.locator("#favorito")).toBeVisible();
    await expect(page.locator("#aviso-celular")).toBeHidden();
    await expect(page.locator(".passos").first()).toBeVisible();
  });

  test("o passo a passo da remoção mostra os prints do painel sobre a APUS", async ({ page }) => {
    await page.goto("/remocao/");
    await expect(page.getByRole("heading", { name: "Na remoção, passo a passo" })).toBeVisible();
    const prints = page.locator(".print img");
    await expect(prints).toHaveCount(6);
    for (const img of await prints.all()) {
      await img.scrollIntoViewIfNeeded();
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth)).toBeGreaterThan(0);
    }
  });
});

const AVISO_CELULAR = /Abra esta página num computador ou Chromebook/;

test.describe("@remocao aviso no celular", () => {
  test.describe("Android", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    });
    test("mostra só o aviso de que é preciso computador ou Chromebook", async ({ page }) => {
      await page.goto("/remocao/");
      await expect(page.getByText(AVISO_CELULAR)).toBeVisible();
      for (const lista of await page.locator(".passos").all()) await expect(lista).toBeHidden();
      await expect(page.locator(".uso")).toBeHidden();
      await expect(page.locator(".sobre")).toBeHidden();
    });
  });

  test.describe("iPad (se apresenta como Mac)", () => {
    test.use({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
    });
    test("reconhece pela tela de toque e mostra só o aviso", async ({ page }) => {
      await page.addInitScript(() => Object.defineProperty(Navigator.prototype, "maxTouchPoints", { get: () => 5 }));
      await page.goto("/remocao/");
      await expect(page.getByText(AVISO_CELULAR)).toBeVisible();
      for (const lista of await page.locator(".passos").all()) await expect(lista).toBeHidden();
      await expect(page.locator(".uso")).toBeHidden();
      await expect(page.locator(".sobre")).toBeHidden();
    });
  });
});
