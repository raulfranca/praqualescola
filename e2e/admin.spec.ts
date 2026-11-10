import type { Page, Route } from "@playwright/test";
import { expect, test } from "./fixtures/base";
import { interceptarSupabase } from "./fixtures/escolas";

// Painel /admin: aberto pela busca, com senha conferida no servidor (APIs simuladas aqui).

const RESUMO = {
  mes: "2026-11",
  unidades: 6432,
  acertos_cache: 128,
  calculos_google: 96,
  calibrado_em: null,
  modo_forcado: false,
  celulas: 90,
};

function painel(modoForcado = false) {
  return {
    resumo: { ...RESUMO, modo_forcado: modoForcado },
    estado: modoForcado ? "aproximado" : "normal",
    escolas: 67,
    cota: 10000,
    economiaAPartirDe: 8000,
    teto: 9500,
  };
}

const json = (route: Route, corpo: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(corpo) });

/** Simula as três APIs do painel. Senha certa: "certa". Devolve os corpos POST recebidos. */
async function interceptarAdmin(page: Page) {
  const posts: { url: string; corpo: unknown }[] = [];
  await page.route("**/api/admin/**", async (route) => {
    const req = route.request();
    const url = new URL(req.url()).pathname;
    const corpo = req.method() === "POST" ? req.postDataJSON() : undefined;
    if (corpo !== undefined) posts.push({ url, corpo });

    if (url.endsWith("/login")) {
      return (corpo as { senha: string }).senha === "certa"
        ? json(route, { token: "token-de-teste", expiraEm: Date.now() + 3_600_000 })
        : json(route, { erro: "Senha incorreta" }, 401);
    }
    if (req.headers()["authorization"] !== "Bearer token-de-teste") return json(route, { erro: "Não autorizado" }, 401);
    if (url.endsWith("/painel")) {
      return json(route, painel((corpo as { modoForcado?: boolean } | undefined)?.modoForcado === true));
    }
    if (url.endsWith("/google")) {
      return json(route, {
        uso: { desde: "2026-11-01T07:00:00Z", ate: "2026-11-10T12:00:00Z", requisicoes: { routes: 98, mapas: 1204, places: 310 } },
        unidadesRoutesEstimadas: 6566,
        calibrado: false,
        resumo: RESUMO,
      });
    }
    return route.abort();
  });
  return posts;
}

async function abrirAdmin(page: Page) {
  await interceptarSupabase(page);
  const posts = await interceptarAdmin(page);
  await page.goto("/");
  const busca = page.getByPlaceholder("Buscar escola por nome, endereço ou bairro...");
  await busca.fill("/admin");
  return { busca, posts };
}

async function entrar(page: Page, senha: string) {
  const dialogo = page.getByRole("dialog", { name: "Área do administrador" });
  await dialogo.getByLabel("Senha").fill(senha);
  await dialogo.getByRole("button", { name: "Entrar" }).click();
}

test("/admin abre o pedido de senha, sem sugestões de escola @admin", async ({ page }) => {
  const { busca } = await abrirAdmin(page);
  await expect(page.getByRole("button", { name: /EMEF|EMEI|CEI/ })).toHaveCount(0);
  await busca.press("Enter");
  await expect(page.getByRole("dialog", { name: "Área do administrador" })).toBeVisible();
  await expect(busca).toHaveValue("");
});

test("senha errada mostra erro e não abre o painel @admin", async ({ page }) => {
  const { busca } = await abrirAdmin(page);
  await busca.press("Enter");
  await entrar(page, "errada");
  await expect(page.getByRole("alert")).toHaveText("Senha incorreta.");
  await expect(page.getByTestId("estado-cota")).toHaveCount(0);
});

test("senha certa mostra uso do mês, estado e economia @admin", async ({ page }) => {
  const { busca } = await abrirAdmin(page);
  await busca.press("Enter");
  await entrar(page, "certa");

  const dialogo = page.getByRole("dialog", { name: "Painel" });
  await expect(dialogo.getByTestId("estado-cota")).toHaveText("Normal");
  await expect(dialogo.getByTestId("unidades-mes")).toHaveText("6.432");
  await expect(dialogo).toContainText("Usado em novembro");
  await expect(dialogo).toContainText("Unidades poupadas8.576"); // 128 reaproveitados × 67 escolas
  await expect(dialogo).toContainText("A cota renova em 1º de dezembro.");
});

test("forçar modo aproximado envia o pedido e mostra Aproximado @admin", async ({ page }) => {
  const { busca, posts } = await abrirAdmin(page);
  await busca.press("Enter");
  await entrar(page, "certa");

  const interruptor = page.getByRole("switch", { name: "Forçar modo aproximado" });
  await expect(interruptor).not.toBeChecked();
  await interruptor.click();
  await expect(page.getByTestId("estado-cota")).toHaveText("Aproximado (forçado)");
  await expect(interruptor).toBeChecked();
  expect(posts).toContainEqual({ url: "/api/admin/painel", corpo: { modoForcado: true } });
});

test("conferir com o Google mostra os números devolvidos @admin", async ({ page }) => {
  const { busca } = await abrirAdmin(page);
  await busca.press("Enter");
  await entrar(page, "certa");

  const dialogo = page.getByRole("dialog", { name: "Painel" });
  await dialogo.getByRole("button", { name: "Conferir com o Google" }).click();
  await expect(dialogo).toContainText("98 pedidos");
  await expect(dialogo).toContainText("1.204 vezes");
  await expect(dialogo).toContainText("310 buscas");
  await expect(dialogo.getByRole("button", { name: "Ajustar contador para 6.566" })).toBeVisible();
});

test("/dev não faz mais nada @admin", async ({ page }) => {
  await interceptarSupabase(page);
  await interceptarAdmin(page);
  await page.goto("/");
  const busca = page.getByPlaceholder("Buscar escola por nome, endereço ou bairro...");
  await busca.fill("/dev");
  await busca.press("Enter");
  await expect(busca).toHaveValue("/dev");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("Modo Desenvolvedor")).toHaveCount(0);
});
