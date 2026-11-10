import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import google from "../admin/google";
import login from "../admin/login";
import painel from "../admin/painel";
import { VALIDADE_TOKEN_MS, emitirToken, tokenValido } from "./admin";
import { inicioDoMesDaCota, unidadesEstimadasRoutes } from "./monitoring";

const SEGREDO = "segredo-do-token";
const ESCOLAS = [
  { codigo_inep: "A", latitude: -22.92, longitude: -45.46 },
  { codigo_inep: "B", latitude: -22.93, longitude: -45.47 },
];
const RESUMO = {
  mes: "2026-11",
  unidades: 120,
  acertos_cache: 4,
  calculos_google: 3,
  calibrado_em: null,
  modo_forcado: false,
  celulas: 2,
};

/** Supabase e Google falsos: registra as chamadas `pqe_*` e conta tentativas de login como o banco. */
function servidorFalso(opcoes: { monitoring?: unknown } = {}) {
  const chamadas: { nome: string; args: Record<string, unknown> }[] = [];
  const tentativas = new Map<string, number>();
  const fetchFalso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);
    if (url.includes("/rest/v1/escolas")) return new Response(JSON.stringify(ESCOLAS));
    const rpc = url.match(/\/rest\/v1\/rpc\/(\w+)/)?.[1];
    if (rpc) {
      const args = JSON.parse(String(init?.body ?? "{}"));
      chamadas.push({ nome: rpc, args });
      if (rpc === "pqe_limite") {
        const chave = `${args.p_hash}|${args.p_janela}`;
        const n = (tentativas.get(chave) ?? 0) + 1;
        tentativas.set(chave, n);
        return new Response(JSON.stringify(n <= args.p_maximo));
      }
      if (rpc === "pqe_resumo") return new Response(JSON.stringify(RESUMO));
      return new Response(null, { status: 204 });
    }
    if (url.startsWith("https://oauth2.googleapis.com/token")) {
      return new Response(JSON.stringify({ access_token: "acesso" }));
    }
    if (url.startsWith("https://monitoring.googleapis.com/")) {
      return new Response(JSON.stringify(opcoes.monitoring ?? { timeSeries: [] }));
    }
    throw new Error(`Requisição inesperada: ${url}`);
  });
  vi.stubGlobal("fetch", fetchFalso);
  return { chamadas, fetchFalso };
}

const postLogin = (senha: unknown, ip = "1.2.3.4") =>
  new Request("http://localhost/api/admin/login", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: JSON.stringify({ senha }),
  });

const comToken = (url: string, token: string, init: RequestInit = {}) =>
  new Request(url, { ...init, headers: { Authorization: `Bearer ${token}` } });

async function pemDeTeste(): Promise<string> {
  const par = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey("pkcs8", par.privateKey));
  const b64 = btoa(String.fromCharCode(...der));
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----\n`;
}

describe("token do painel", () => {
  it("vale até expirar e recusa adulteração", async () => {
    const agora = 1_000_000;
    const token = await emitirToken(SEGREDO, agora);
    expect(await tokenValido(token, SEGREDO, agora + 1)).toBe(true);
    expect(await tokenValido(token, SEGREDO, agora + VALIDADE_TOKEN_MS + 1)).toBe(false);
    expect(await tokenValido(token, "outro-segredo", agora + 1)).toBe(false);
    const [expira, assinatura] = token.split(".");
    expect(await tokenValido(`${Number(expira) + 1}.${assinatura}`, SEGREDO, agora + 1)).toBe(false);
    expect(await tokenValido("lixo", SEGREDO, agora)).toBe(false);
  });
});

describe("/api/admin/*", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pub");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_x");
    vi.stubEnv("PQE_HASH_SECRET", "hash");
    vi.stubEnv("PQE_ADMIN_PASSWORD", "senha-certa");
    vi.stubEnv("PQE_ADMIN_TOKEN_SECRET", SEGREDO);
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "projeto-teste");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("login: senha errada → 401; senha certa → token válido; IP vai como hash", async () => {
    const { chamadas } = servidorFalso();
    expect((await login(postLogin("errada"))).status).toBe(401);

    const r = await login(postLogin("senha-certa"));
    expect(r.status).toBe(200);
    const { token } = await r.json();
    expect(await tokenValido(token, SEGREDO)).toBe(true);

    const limite = chamadas.find((c) => c.nome === "pqe_limite")!;
    expect(limite.args.p_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(chamadas)).not.toContain("1.2.3.4");
  });

  it("login: 6ª tentativa no mesmo IP → 429, mesmo com a senha certa", async () => {
    servidorFalso();
    for (let i = 0; i < 5; i++) expect((await login(postLogin("errada"))).status).toBe(401);
    expect((await login(postLogin("senha-certa"))).status).toBe(429);
    expect((await login(postLogin("senha-certa", "5.6.7.8"))).status).toBe(200);
  });

  it("sem token, token adulterado ou expirado → 401 nos três endpoints, sem dados", async () => {
    const { fetchFalso } = servidorFalso();
    const expirado = await emitirToken(SEGREDO, Date.now() - VALIDADE_TOKEN_MS - 1);
    const adulterado = (await emitirToken(SEGREDO)).replace(/.$/, (c) => (c === "A" ? "B" : "A"));
    const deOutroSegredo = await emitirToken("outro");

    for (const [url, handler] of [
      ["http://localhost/api/admin/painel", painel],
      ["http://localhost/api/admin/google", google],
    ] as const) {
      expect((await handler(new Request(url))).status).toBe(401);
      for (const token of [expirado, adulterado, deOutroSegredo]) {
        const r = await handler(comToken(url, token));
        expect(r.status).toBe(401);
        expect(await r.json()).toEqual({ erro: "Não autorizado" });
      }
    }
    // Login com token não dá acesso: só a senha entra (e o login nunca devolve dados).
    expect(fetchFalso).not.toHaveBeenCalled();
  });

  it("painel GET devolve resumo e estado; POST de modo forçado chama pqe_config_definir", async () => {
    const { chamadas } = servidorFalso();
    const token = await emitirToken(SEGREDO);

    const r = await painel(comToken("http://localhost/api/admin/painel", token));
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.resumo.unidades).toBe(120);
    expect(corpo.estado).toBe("normal");
    expect(corpo.escolas).toBe(2);

    const p = await painel(
      comToken("http://localhost/api/admin/painel", token, { method: "POST", body: JSON.stringify({ modoForcado: true }) }),
    );
    expect(p.status).toBe(200);
    expect(chamadas).toContainEqual({ nome: "pqe_config_definir", args: { p_chave: "modo_forcado", p_valor: true } });

    const invalido = await painel(
      comToken("http://localhost/api/admin/painel", token, { method: "POST", body: JSON.stringify({ modoForcado: "sim" }) }),
    );
    expect(invalido.status).toBe(400);
  });

  it("google GET lê o Monitoring; POST calibrar chama pqe_calibrar com a estimativa", async () => {
    vi.stubEnv(
      "GOOGLE_MONITORING_CREDENTIALS",
      JSON.stringify({ client_email: "leitor@projeto-teste.iam.gserviceaccount.com", private_key: await pemDeTeste() }),
    );
    const serie = (service: string, ...valores: number[]) => ({
      resource: { labels: { service } },
      points: valores.map((v) => ({ value: { int64Value: String(v) } })),
    });
    const { chamadas, fetchFalso } = servidorFalso({
      monitoring: {
        timeSeries: [
          serie("routes.googleapis.com", 3, 2),
          serie("maps-backend.googleapis.com", 40),
          serie("places-backend.googleapis.com", 7),
          serie("places.googleapis.com", 1),
        ],
      },
    });
    const token = await emitirToken(SEGREDO);

    const r = await google(comToken("http://localhost/api/admin/google", token));
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.uso.requisicoes).toEqual({ routes: 5, mapas: 40, places: 8 });
    expect(corpo.unidadesRoutesEstimadas).toBe(10); // 5 requisições × 2 escolas
    expect(chamadas.some((c) => c.nome === "pqe_calibrar")).toBe(false);

    const urlMonitoring = fetchFalso.mock.calls.map(([u]) => String(u)).find((u) => u.includes("monitoring"))!;
    expect(urlMonitoring).toContain("projects/projeto-teste/timeSeries");
    expect(decodeURIComponent(urlMonitoring)).toContain("serviceruntime.googleapis.com/api/request_count");

    const c = await google(
      comToken("http://localhost/api/admin/google", token, { method: "POST", body: JSON.stringify({ calibrar: true }) }),
    );
    expect(c.status).toBe(200);
    expect(chamadas).toContainEqual({ nome: "pqe_calibrar", args: { p_unidades: 10 } });
  });
});

describe("mês da cota no Google", () => {
  it("começa à meia-noite do Pacífico (verão e inverno)", () => {
    expect(inicioDoMesDaCota(new Date("2026-11-10T12:00:00Z")).toISOString()).toBe("2026-11-01T07:00:00.000Z");
    expect(inicioDoMesDaCota(new Date("2026-12-10T12:00:00Z")).toISOString()).toBe("2026-12-01T08:00:00.000Z");
    // 1º de dezembro às 03:00 UTC ainda é novembro no Pacífico.
    expect(inicioDoMesDaCota(new Date("2026-12-01T03:00:00Z")).toISOString()).toBe("2026-11-01T07:00:00.000Z");
  });

  it("estimativa em unidades arredonda para cima pelo custo máximo de uma requisição", () => {
    expect(unidadesEstimadasRoutes(3, 67)).toBe(201);
    expect(unidadesEstimadasRoutes(0, 67)).toBe(0);
  });
});
