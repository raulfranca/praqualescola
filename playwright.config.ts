import { defineConfig } from "@playwright/test";
import { existsSync, readFileSync } from "node:fs";

// Trava: projeto com Supabase só testa contra o banco local. Sem `.env.local` o servidor cairia no
// `.env`, que aponta para a PRODUÇÃO. Variável definida no processo tem prioridade sobre os arquivos
// .env, então o que é lido aqui vale para o servidor do teste. Projeto sem banco não precisa disso.
function envLocal(): Record<string, string> {
  const temBanco = existsSync("supabase");
  if (!temBanco && !existsSync(".env.local")) return {};
  const vars: Record<string, string> = {};
  const texto = existsSync(".env.local") ? readFileSync(".env.local", "utf8") : "";
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^(VITE_[A-Z_]+)\s*=\s*"?([^"]*)"?\s*$/);
    if (m) vars[m[1]] = m[2];
  }
  const url = vars.VITE_SUPABASE_URL ?? "";
  if (temBanco && !/^http:\/\/(127\.0\.0\.1|localhost):/.test(url)) {
    throw new Error(`e2e recusado: VITE_SUPABASE_URL não é o banco local (${url || "ausente"}).`);
  }
  return vars;
}

// Porta própria: não encosta no servidor de desenvolvimento do usuário.
const PORTA = 8090;

export default defineConfig({
  testDir: "e2e",
  // Os testes compartilham o mesmo banco local: um de cada vez.
  fullyParallel: false,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${PORTA}`,
    // Na nuvem a VM traz o Chrome em CHROME_PATH; na máquina, usa o Chrome instalado.
    ...(process.env.CHROME_PATH
      ? { launchOptions: { executablePath: process.env.CHROME_PATH } }
      : { channel: "chrome" }),
    headless: true,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx vite --port 8090 --strictPort --host 127.0.0.1",
    url: `http://127.0.0.1:${PORTA}`,
    reuseExistingServer: true,
    // O e2e nunca chama o Supabase real: os testes interceptam `**/rest/v1/**` (e2e/fixtures/escolas.ts).
    env: {
      VITE_SUPABASE_URL: "https://supabase.teste.invalid",
      VITE_SUPABASE_PUBLISHABLE_KEY: "chave-ficticia",
      // Cota do Google: chave inválida não gasta cota de ninguém. O script do mapa ainda carrega (o app
      // espera por ele), mas o mapa não abre; o resto do Google é barrado em e2e/fixtures/base.ts.
      ...envLocal(),
      VITE_GOOGLE_MAPS_API_KEY: "chave-ficticia",
    },
    timeout: 60_000,
  },
});
