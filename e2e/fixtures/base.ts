import { expect, test as base } from "@playwright/test";

// Trava da cota do Google: nenhum teste de navegador chega ao Google nem às funções reais em /api/.
// Toda spec importa `test` e `expect` daqui. Requisições bloqueadas são abortadas; as de serviços
// pagos por consulta (distâncias, rotas, Places) e as de /api/ sem interceptação no próprio teste
// reprovam o teste. Só passam os arquivos de código do mapa, porque o app espera por eles para abrir;
// o servidor de teste usa chave fictícia (playwright.config.ts), então nem eles gastam cota.

const GOOGLE = /^https?:\/\/([a-z0-9-]+\.)*(googleapis\.com|gstatic\.com)\//i;
const API_SERVIDOR = /^https?:\/\/[^/]+\/api\/(distancias|admin)(\/|\?|$)/i;
const CODIGO_DO_MAPA = /^https:\/\/maps\.googleapis\.com\/(maps\/api\/js\?|maps-api-v3\/api\/js\/)/i;
const PAGO = /routes\.googleapis\.com|places\.googleapis\.com|distancematrix|\/maps\/api\/place\//i;

export const MENSAGEM_TRAVA = "Trava da cota do Google: o teste tentou chamar um serviço pago";

export const test = base.extend<{ travaGoogle: void }>({
  travaGoogle: [
    async ({ context }, use) => {
      const reprovadas: string[] = [];
      const bloquear = (url: string) => {
        if (API_SERVIDOR.test(url) || PAGO.test(url)) reprovadas.push(url);
      };
      // Rotas registradas depois (no teste) têm prioridade: um teste que intercepta /api/distancias
      // responde antes desta trava.
      await context.route(GOOGLE, (rota) => {
        if (CODIGO_DO_MAPA.test(rota.request().url())) return rota.continue();
        bloquear(rota.request().url());
        return rota.abort("blockedbyclient");
      });
      await context.route(API_SERVIDOR, (rota) => {
        bloquear(rota.request().url());
        return rota.abort("blockedbyclient");
      });
      await use();
      expect(reprovadas, MENSAGEM_TRAVA).toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
