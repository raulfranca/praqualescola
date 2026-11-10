// TEMPORÁRIO (Etapa 6 do plano design-system-coruja): capturas para revisão visual. Apagar depois.
import { test } from "@playwright/test";

const DIR = process.env.CAPTURAS_DIR!;
test.skip(!DIR, "só roda com CAPTURAS_DIR");

for (const [nome, viewport] of [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1280, height: 800 }],
] as const) {
  test(`capturas ${nome}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    page.on("console", (m) => { if (/google|maps/i.test(m.text())) console.log("CONSOLE", m.type(), m.text().slice(0, 300)); });
    const foto = (t: string) => page.screenshot({ path: `${DIR}/${nome}-${t}.png` });

    await page.goto("/");
    await page.waitForTimeout(5000);
    await foto("1-mapa");

    await page.goto("/lista");
    const cards = page.locator(".divide-y > *");
    await cards.first().waitFor();
    // favorita as 3 primeiras pelo botão da estrela do cartão
    for (let i = 0; i < 3; i++) await cards.nth(i).locator("button").first().click();
    await page.waitForTimeout(500);
    await foto("2-lista");

    await cards.nth(4).click();
    await page.waitForTimeout(800);
    await foto("3-detalhe");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: "Filtros" }).click();
    await page.waitForTimeout(800);
    await foto("4-filtros");
    await page.keyboard.press("Escape");
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /Favoritos|Prioridades/ }).first().click();
    await page.waitForTimeout(800);
    await foto("5-favoritos");

    // mapa com favoritas (estrelas)
    await page.getByRole("button", { name: "Mapa", exact: true }).first().click();
    await page.waitForTimeout(5000);
    await foto("6-mapa-favoritas");
  });
}
