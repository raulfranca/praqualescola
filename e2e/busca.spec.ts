import { expect, test } from "./fixtures/base";
import { ESCOLAS, interceptarSupabase } from "./fixtures/escolas";

// A busca se apresenta ao celular como campo de busca (não formulário), para o teclado
// do Android não abrir a barra de senha/cartão/endereço. A barra em si só se vê no aparelho.
test.use({ viewport: { width: 390, height: 844 } });

test("busca é campo de busca e continua achando escolas @busca", async ({ page }) => {
  await interceptarSupabase(page);
  await page.goto("/");

  const busca = page.getByRole("searchbox");
  await expect(busca).toHaveAttribute("placeholder", /Buscar escola/);
  await expect(busca).toHaveAttribute("enterkeyhint", "search");
  await expect(busca).toHaveAttribute("autocomplete", "busca-escola");

  await busca.fill(ESCOLAS[0].nome.slice(0, 5));
  await page.getByRole("button", { name: new RegExp(ESCOLAS[0].nome) }).first().click();
  await expect(page.getByRole("dialog", { name: ESCOLAS[0].nome })).toBeVisible();
});
