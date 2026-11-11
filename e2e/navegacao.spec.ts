import { expect, test } from "./fixtures/base";
import { interceptarSupabase } from "./fixtures/escolas";

// A barra inferior do celular flutua sobre o conteúdo; nenhuma tela pode ficar escondida atrás dela.

test.use({ viewport: { width: 390, height: 844 } });

test("no fim da Lista, a última escola fica inteira acima da barra @navegacao", async ({ page }) => {
  // Tela baixa: as escolas de teste são poucas e, em 844 px, a lista nem chegaria a rolar.
  await page.setViewportSize({ width: 390, height: 480 });
  await interceptarSupabase(page);
  await page.goto("/lista");

  const lista = page.getByTestId("lista-escolas");
  const ultima = lista.locator(":scope > *").last();
  await expect(ultima).toBeVisible();

  const rolagem = page.locator("[data-radix-scroll-area-viewport]");
  // A lista precisa ser maior que a tela, senão o teste não prova nada.
  expect(await rolagem.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await rolagem.evaluate((el) => el.scrollTo(0, el.scrollHeight));

  const barra = page.getByRole("navigation").filter({ has: page.getByRole("button", { name: "Favoritos" }) });
  await expect(barra).toBeVisible();
  await expect(async () => {
    const caixaUltima = (await ultima.boundingBox())!;
    const caixaBarra = (await barra.boundingBox())!;
    expect(caixaUltima.y + caixaUltima.height).toBeLessThanOrEqual(caixaBarra.y);
  }).toPass();
});

test("no mapa, a barra deixa livre a faixa de baixo, onde fica o logo do Google @navegacao", async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/");

  const barra = page.getByRole("navigation").filter({ has: page.getByRole("button", { name: "Favoritos" }) });
  await expect(barra).toBeVisible();
  const caixa = (await barra.boundingBox())!;
  // Logo e "Termos" do Google ocupam ~26 px no rodapé do mapa (termos de uso pedem que fiquem visíveis).
  expect(844 - (caixa.y + caixa.height)).toBeGreaterThanOrEqual(26);
});

test("tocar Favoritos na barra abre Favoritos e marca o item como ativo @navegacao", async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/lista");

  const barra = page.getByRole("navigation").filter({ has: page.getByRole("button", { name: "Favoritos" }) });
  await barra.getByRole("button", { name: "Favoritos" }).click();

  await expect(page).toHaveURL(/\/favoritos$/);
  await expect(barra.getByRole("button", { name: "Favoritos" })).toHaveClass(/text-primary/);
  await expect(barra.getByRole("button", { name: "Lista" })).not.toHaveClass(/text-primary/);
});
