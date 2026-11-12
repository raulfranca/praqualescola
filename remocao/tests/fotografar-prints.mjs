// Refaz os prints da página de passo a passo (public/remocao/prints/) a partir de prints.html:
// o painel real, com dados de exemplo, sobre um esboço da página da remoção.
// Uso: node remocao/tests/fotografar-prints.mjs
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';

const cena = new URL('./prints.html', import.meta.url);
const saida = new URL('../../public/remocao/prints/', import.meta.url);
const CENAS = ['abrir', 'onde', 'finalizar', 'conferir', 'mudou', 'trocar'];

const navegador = await chromium.launch({ channel: process.env.CHROME_PATH ? undefined : 'chrome', executablePath: process.env.CHROME_PATH });
const pagina = await navegador.newPage({ deviceScaleFactor: 2, viewport: { width: 900, height: 900 } });
for (const nome of CENAS) {
  await pagina.goto(`${cena.href}?cena=${nome}`);
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.waitForTimeout(300);
  await pagina.locator('#janela').screenshot({ path: fileURLToPath(new URL(`${nome}.png`, saida)) });
  console.log(`${nome}.png`);
}
await navegador.close();
