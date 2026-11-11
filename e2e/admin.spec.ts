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

function campanha(extra: Record<string, unknown> = {}) {
  return {
    id: "c1",
    nome: "Remoção 2027 · 1ª fase",
    descricao: "",
    inicio: "2026-11-12T09:00:00Z",
    fim: "2026-11-13T10:00:00Z",
    ligada: false,
    arquivada: false,
    fonte: "Vagas_Iniciais_para_Remocao_06_11_26.pdf",
    atualizada_em: "2026-11-11T12:00:00Z",
    escolas_na_lista: 66,
    escolas_com_vaga: 29,
    total_vagas: 44,
    maiores: [{ nome_na_fonte: "EMEF Exemplo", codigo_inep: "111", vagas: 4 }],
    estado: "desligada",
    ...extra,
  };
}

/** Estado das campanhas simuladas: muda conforme os POSTs, como o servidor faria. */
function simularCampanhas(inicial: ReturnType<typeof campanha>[]) {
  let lista = inicial;
  return (corpo: Record<string, unknown> | undefined) => {
    if (corpo?.acao === "editar") {
      if (Date.parse(corpo.fim as string) <= Date.parse(corpo.inicio as string)) {
        return { status: 400, corpo: { erro: "O fim precisa ser depois do início." } };
      }
      lista = lista.map((c) =>
        c.id === corpo.id ? { ...c, ...corpo, estado: corpo.ligada ? "no_ar" : "desligada" } : c,
      ) as typeof lista;
    }
    if (corpo?.acao === "arquivar") {
      lista = lista.map((c) => (c.id === corpo.id ? { ...c, arquivada: corpo.arquivada as boolean } : c));
    }
    return { status: 200, corpo: { campanhas: lista, agora: "2026-11-12T12:00:00Z" } };
  };
}

const json = (route: Route, corpo: unknown, status = 200) =>
  route.fulfill({ status, contentType: "application/json", body: JSON.stringify(corpo) });

/** Simula as três APIs do painel. Senha certa: "certa". Devolve os corpos POST recebidos. */
async function interceptarAdmin(page: Page, campanhas = [campanha()]) {
  const posts: { url: string; corpo: unknown }[] = [];
  const responderCampanhas = simularCampanhas(campanhas);
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
    if (url.endsWith("/campanhas")) {
      const r = responderCampanhas(corpo as Record<string, unknown> | undefined);
      return json(route, r.corpo, r.status);
    }
    return route.abort();
  });
  return posts;
}

async function abrirAdmin(page: Page, campanhas?: ReturnType<typeof campanha>[]) {
  await interceptarSupabase(page);
  const posts = await interceptarAdmin(page, campanhas);
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

async function abrirCampanhas(page: Page, campanhas?: ReturnType<typeof campanha>[]) {
  const { busca, posts } = await abrirAdmin(page, campanhas);
  await busca.press("Enter");
  await entrar(page, "certa");
  const dialogo = page.getByRole("dialog", { name: "Painel" });
  await dialogo.getByRole("tab", { name: "Campanhas" }).click();
  return { dialogo, posts };
}

test("ligar a campanha envia a edição e a etiqueta vira No ar @admin", async ({ page }) => {
  const { dialogo, posts } = await abrirCampanhas(page);
  await expect(dialogo.getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toBeVisible();
  await expect(dialogo.getByTestId("estado-campanha")).toHaveText("Desligada");
  await expect(dialogo).toContainText("12/11, 6h");
  await expect(dialogo).toContainText("29 de 66");

  await dialogo.getByRole("switch", { name: "Campanha ligada" }).click();
  await expect(dialogo.getByTestId("estado-campanha")).toHaveText("No ar");
  expect(posts).toContainEqual({
    url: "/api/admin/campanhas",
    corpo: {
      acao: "editar",
      id: "c1",
      nome: "Remoção 2027 · 1ª fase",
      descricao: "",
      inicio: "2026-11-12T09:00:00Z",
      fim: "2026-11-13T10:00:00Z",
      ligada: true,
    },
  });
});

test("fim antes do início mostra erro e não salva @admin", async ({ page }) => {
  const { dialogo, posts } = await abrirCampanhas(page);
  await dialogo.getByRole("button", { name: "Editar" }).click();
  const form = dialogo.getByRole("form", { name: "Editar campanha" });
  await expect(form.getByLabel("Início")).toHaveValue("2026-11-12T06:00");
  await form.getByLabel("Fim").fill("2026-11-11T08:00");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(form.getByRole("alert")).toHaveText("O fim precisa ser depois do início.");
  expect(posts.filter((p) => p.url === "/api/admin/campanhas")).toHaveLength(0);
});

test("editar o nome salva com as datas em Brasília e volta à lista @admin", async ({ page }) => {
  const { dialogo, posts } = await abrirCampanhas(page);
  await dialogo.getByRole("button", { name: "Editar" }).click();
  const form = dialogo.getByRole("form", { name: "Editar campanha" });
  await form.getByLabel("Nome").fill("Remoção 2027 · fase 1");
  await form.getByRole("button", { name: "Salvar" }).click();
  await expect(dialogo.getByRole("heading", { name: "Remoção 2027 · fase 1" })).toBeVisible();
  expect(posts).toContainEqual({
    url: "/api/admin/campanhas",
    corpo: expect.objectContaining({
      acao: "editar",
      nome: "Remoção 2027 · fase 1",
      inicio: "2026-11-12T06:00:00-03:00",
      fim: "2026-11-13T07:00:00-03:00",
    }),
  });
});

test("campanha encerrada pode ser arquivada e desarquivada @admin", async ({ page }) => {
  const { dialogo } = await abrirCampanhas(page, [campanha({ estado: "encerrada" })]);
  await expect(dialogo.getByTestId("estado-campanha")).toHaveText("Encerrada");
  await dialogo.getByRole("button", { name: "Arquivar" }).click();
  await expect(dialogo.getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toHaveCount(0);
  await dialogo.getByText("Arquivadas (1)").click();
  await dialogo.getByRole("button", { name: "Desarquivar Remoção 2027 · 1ª fase" }).click();
  await expect(dialogo.getByRole("heading", { name: "Remoção 2027 · 1ª fase" })).toBeVisible();
  await expect(dialogo.getByText(/Arquivadas/)).toHaveCount(0);
});

test("duas campanhas no ar mostram o aviso @admin", async ({ page }) => {
  const { dialogo } = await abrirCampanhas(page, [
    campanha({ estado: "no_ar", ligada: true }),
    campanha({ id: "c2", nome: "Atribuição 2027", estado: "no_ar", ligada: true }),
  ]);
  await expect(dialogo.getByRole("status")).toContainText("O aplicativo mostra a que começou primeiro.");
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
