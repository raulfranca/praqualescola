import { expect, test } from "@playwright/test";

// Design system "Coruja e Mapa": confere que a paleta e as fontes chegaram à tela.
// Valores de design-system/tokens.css.
// O app guarda as cores em HSL arredondado, então cada canal pode diferir em até 2 do hex original.
const AZUL_CORUJA = [22, 66, 146]; // #164292
const SUPERFICIE = [246, 249, 253]; // #f6f9fd

function pertoDe(rgb: string, alvo: number[]) {
  const canais = rgb.match(/\d+/g)!.slice(0, 3).map(Number);
  canais.forEach((c, i) => expect(Math.abs(c - alvo[i]), `${rgb} ≈ rgb(${alvo})`).toBeLessThanOrEqual(2));
}

test.use({ viewport: { width: 390, height: 844 } });

test("a página usa a fonte Inter e o fundo da coruja @design", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByPlaceholder(/Buscar escola/)).toBeVisible();
  const corpo = await page.evaluate(() => {
    const estilo = getComputedStyle(document.body);
    return { fonte: estilo.fontFamily, fundo: estilo.backgroundColor };
  });
  expect(corpo.fonte).toMatch(/^"?Inter Variable"?/);
  pertoDe(corpo.fundo, SUPERFICIE);
  // A fonte foi de fato carregada (não caiu na do sistema).
  expect(await page.evaluate(() => document.fonts.check('16px "Inter Variable"'))).toBe(true);
});

test("o item ativo da barra inferior é Azul Coruja @design", async ({ page }) => {
  await page.goto("/");
  const mapa = page.getByRole("button", { name: "Mapa", exact: true });
  await expect(mapa).toBeVisible();
  pertoDe(await mapa.evaluate((el) => getComputedStyle(el).color), AZUL_CORUJA);
});

test("o menu tem Mapa, Lista e Favoritos, sem Contribua @design", async ({ page }) => {
  await page.goto("/");
  for (const item of ["Mapa", "Lista", "Favoritos"]) {
    await expect(page.getByRole("button", { name: item, exact: true })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Contribua" })).toHaveCount(0);
});

// Fundo e texto de cada etiqueta de nível (tokens.css: --nivel-*-bg / --nivel-*-fg).
const NIVEIS: Record<string, { fundo: number[]; texto: number[] }> = {
  creche: { fundo: [226, 243, 240], texto: [23, 102, 93] }, // #e2f3f0 / #17665d
  pre: { fundo: [251, 234, 226], texto: [154, 74, 40] }, // #fbeae2 / #9a4a28
  fundamental: { fundo: [228, 236, 248], texto: [22, 66, 146] }, // #e4ecf8 / #164292
};

test("as etiquetas de nível da lista usam as cores de nível @design", async ({ page }) => {
  await page.goto("/lista");
  const etiqueta = page.locator('[class*="bg-nivel-"]').first();
  await expect(etiqueta).toBeVisible();
  const { nivel, fundo, texto } = await etiqueta.evaluate((el) => {
    const estilo = getComputedStyle(el);
    const nivel = el.className.match(/bg-nivel-(\w+)-bg/)![1];
    return { nivel, fundo: estilo.backgroundColor, texto: estilo.color };
  });
  pertoDe(fundo, NIVEIS[nivel].fundo);
  pertoDe(texto, NIVEIS[nivel].texto);
});
