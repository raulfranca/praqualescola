import { describe, expect, it, vi } from "vitest";
import { celulaDe, celulasVizinhas, centroDaCelula } from "../../src/lib/cota";
import { calcularDistancias, dentroDePinda, type Ambiente } from "./distancias";
import { URL_ROUTES } from "./google";

const URL = "https://exemplo.supabase.co";
const ENV: Ambiente = {
  supabaseUrl: URL,
  chavePublica: "pub",
  chaveSecreta: "secreta",
  chaveGoogle: "google",
  segredoHash: "segredo",
};

const ESCOLAS = [
  { codigo_inep: "A", latitude: -22.92, longitude: -45.46 },
  { codigo_inep: "B", latitude: "-22.93", longitude: "-45.47" },
  { codigo_inep: "SEM", latitude: null, longitude: null },
];
const CASA = { lat: -22.92513, lng: -45.46487 };
const CELULA = celulaDe(CASA.lat, CASA.lng);

const linha = (celula: string, inep: string, metros: number, lat: number, lng: number) => ({
  celula,
  codigo_inep: inep,
  metros,
  segundos: 600,
  escola_lat: lat,
  escola_lng: lng,
});
const CACHE_A = linha(CELULA.id, "A", 1500, -22.92, -45.46);
const CACHE_B = linha(CELULA.id, "B", 2500, -22.93, -45.47);

interface Cenario {
  resumo?: { unidades: number; modo_forcado?: boolean };
  cache?: ReturnType<typeof linha>[];
  limite?: boolean;
  reservar?: boolean;
  google?: { status: number; corpo?: unknown };
}

/** fetch simulado: responde por URL e registra as chamadas. */
function simular(c: Cenario) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- corpos JSON variados, inspecionados nos testes
  const chamadas: { url: string; corpo: any }[] = [];
  const fetchFn = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);
    const corpo = init?.body ? JSON.parse(String(init.body)) : undefined;
    chamadas.push({ url, corpo });
    const resp = (dados: unknown, status = 200) =>
      new Response(dados === undefined ? null : JSON.stringify(dados), { status });

    if (url.includes("/rest/v1/escolas")) return resp(ESCOLAS);
    if (url.endsWith("/rpc/pqe_resumo")) return resp({ unidades: 0, modo_forcado: false, ...c.resumo });
    if (url.endsWith("/rpc/pqe_buscar")) return resp(c.cache ?? []);
    if (url.endsWith("/rpc/pqe_limite")) return resp(c.limite ?? true);
    if (url.endsWith("/rpc/pqe_reservar")) return resp(c.reservar ?? true);
    if (url.includes("/rpc/")) return resp(undefined, 204);
    if (url === URL_ROUTES) {
      const g = c.google ?? { status: 200, corpo: [] };
      return resp(g.corpo ?? { error: "x" }, g.status);
    }
    throw new Error(`URL inesperada: ${url}`);
  });
  const rpcs = () => chamadas.filter((ch) => ch.url.includes("/rpc/")).map((ch) => ch.url.split("/rpc/")[1]);
  const google = () => chamadas.filter((ch) => ch.url === URL_ROUTES);
  const rpc = (nome: string) => chamadas.find((ch) => ch.url.endsWith(`/rpc/${nome}`));
  return { fetchFn: fetchFn as unknown as typeof fetch, chamadas, rpcs, google, rpc };
}

const rodar = (s: ReturnType<typeof simular>, env: Ambiente = ENV) =>
  calcularDistancias({ ...CASA, ip: "1.2.3.4", env, fetchFn: s.fetchFn });

describe("calcularDistancias", () => {
  it("cache completo: nenhuma chamada ao Google e conta o acerto", async () => {
    const s = simular({ cache: [CACHE_A, CACHE_B] });
    const r = await rodar(s);
    expect(s.google()).toHaveLength(0);
    expect(s.rpcs()).toContain("pqe_contar_acerto");
    expect(s.rpcs()).not.toContain("pqe_reservar");
    expect(r.estado).toBe("normal");
    expect(r.distancias).toEqual({
      A: { distanceInKm: 1.5, durationInMinutes: 10, aproximado: false },
      B: { distanceInKm: 2.5, durationInMinutes: 10, aproximado: false },
    });
  });

  it("uma escola faltando: Google com 1 destino a partir do centro da célula, reserva 1 e grava", async () => {
    const s = simular({
      cache: [CACHE_A],
      google: {
        status: 200,
        corpo: [{ originIndex: 0, destinationIndex: 0, distanceMeters: 3210, duration: "420s", condition: "ROUTE_EXISTS" }],
      },
    });
    const r = await rodar(s);

    expect(s.google()).toHaveLength(1);
    const pedido = s.google()[0].corpo;
    expect(pedido.destinations).toHaveLength(1);
    expect(pedido.destinations[0].waypoint.location.latLng).toEqual({ latitude: -22.93, longitude: -45.47 });
    expect(pedido.origins[0].waypoint.location.latLng).toEqual({
      latitude: CELULA.centro.lat,
      longitude: CELULA.centro.lng,
    });
    expect(s.rpc("pqe_reservar")!.corpo).toEqual({ p_unidades: 1, p_limite: 9500 });
    expect(s.rpc("pqe_gravar")!.corpo).toMatchObject({
      p_celula: CELULA.id,
      p_linhas: [{ codigo_inep: "B", metros: 3210, segundos: 420, escola_lat: -22.93, escola_lng: -45.47 }],
    });
    expect(s.rpcs()).not.toContain("pqe_contar_acerto");
    expect(r.distancias.B).toEqual({ distanceInKm: 3.21, durationInMinutes: 7, aproximado: false });
    expect(r.distancias.A.aproximado).toBe(false);
  });

  it("nunca manda a coordenada exata da casa ao banco nem ao Google", async () => {
    const s = simular({ google: { status: 200, corpo: [] } });
    await rodar(s);
    const tudo = JSON.stringify(s.chamadas.map((c) => c.corpo));
    expect(tudo).not.toContain(String(CASA.lat));
    expect(tudo).not.toContain(String(CASA.lng));
  });

  it("escola com coordenada corrigida pela SME é recalculada", async () => {
    const velha = linha(CELULA.id, "B", 2500, -22.94, -45.47);
    const s = simular({ cache: [CACHE_A, velha], google: { status: 200, corpo: [] } });
    await rodar(s);
    expect(s.google()[0].corpo.destinations).toHaveLength(1);
  });

  it("reserva recusada: estimativas marcadas como aproximadas, sem Google", async () => {
    const s = simular({ reservar: false });
    const r = await rodar(s);
    expect(s.google()).toHaveLength(0);
    expect(r.distancias.A.aproximado).toBe(true);
    expect(r.distancias.B.aproximado).toBe(true);
    expect(s.rpcs()).not.toContain("pqe_gravar");
  });

  it("limite por IP estourado: não reserva nem chama o Google", async () => {
    const s = simular({ limite: false });
    const r = await rodar(s);
    expect(s.rpcs()).not.toContain("pqe_reservar");
    expect(s.google()).toHaveLength(0);
    expect(r.distancias.A.aproximado).toBe(true);
    expect(s.rpc("pqe_limite")!.corpo.p_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(s.rpc("pqe_limite")!.corpo)).not.toContain("1.2.3.4");
  });

  it("Google 429: devolve a reserva e responde estimativas", async () => {
    const s = simular({ google: { status: 429 } });
    const r = await rodar(s);
    expect(s.rpc("pqe_devolver")!.corpo).toEqual({ p_unidades: 2 });
    expect(s.rpcs()).not.toContain("pqe_gravar");
    expect(r.distancias.A.aproximado).toBe(true);
    expect(r.distancias.B.aproximado).toBe(true);
  });

  it("estado aproximado (forçado): usa o cache que houver, nunca o Google", async () => {
    const s = simular({ resumo: { unidades: 0, modo_forcado: true }, cache: [CACHE_A] });
    const r = await rodar(s);
    expect(r.estado).toBe("aproximado");
    expect(s.rpcs()).not.toContain("pqe_reservar");
    expect(s.google()).toHaveLength(0);
    expect(r.distancias.A.aproximado).toBe(false);
    expect(r.distancias.B.aproximado).toBe(true);
  });

  it("modo Economia: aproveita a vizinha mais próxima que cobre todas as escolas", async () => {
    const [longe, perto] = celulasVizinhas(CELULA.id)
      .map((id) => ({ id, d: Math.hypot(centroDaCelula(id).lat - CASA.lat, centroDaCelula(id).lng - CASA.lng) }))
      .sort((a, b) => b.d - a.d);
    const cache = [
      linha(longe.id, "A", 9000, -22.92, -45.46),
      linha(longe.id, "B", 9000, -22.93, -45.47),
      linha(perto.id, "A", 1100, -22.92, -45.46),
      linha(perto.id, "B", 2200, -22.93, -45.47),
    ];
    const s = simular({ resumo: { unidades: 8000 }, cache });
    const r = await rodar(s);
    expect(r.estado).toBe("economia");
    expect(s.rpc("pqe_buscar")!.corpo.p_celulas).toHaveLength(9);
    expect(s.google()).toHaveLength(0);
    expect(r.distancias.A.distanceInKm).toBe(1.1);
    expect(s.rpcs()).toContain("pqe_contar_acerto");
  });

  it("modo Normal não olha as vizinhas", async () => {
    const s = simular({ google: { status: 200, corpo: [] } });
    await rodar(s);
    expect(s.rpc("pqe_buscar")!.corpo.p_celulas).toEqual([CELULA.id]);
  });

  it("sem chaves de servidor: só estimativas, sem tocar a cota", async () => {
    const s = simular({});
    const r = await rodar(s, { supabaseUrl: URL, chavePublica: "pub" });
    expect(r.estado).toBe("aproximado");
    expect(Object.keys(r.distancias).sort()).toEqual(["A", "B"]);
    expect(s.rpcs()).toHaveLength(0);
    expect(s.google()).toHaveLength(0);
  });

  it("banco da cota fora do ar: estimativas em vez de erro", async () => {
    const s = simular({});
    s.fetchFn = (async (u: RequestInfo | URL, i?: RequestInit) =>
      String(u).includes("/rpc/") ? new Response("", { status: 500 }) : simular({}).fetchFn(u, i)) as typeof fetch;
    const r = await rodar(s);
    expect(r.estado).toBe("aproximado");
    expect(r.distancias.A.aproximado).toBe(true);
  });
});

describe("dentroDePinda", () => {
  it("aceita o centro da cidade e recusa São Paulo e texto", () => {
    expect(dentroDePinda(-22.925, -45.462)).toBe(true);
    expect(dentroDePinda(-23.55, -46.63)).toBe(false);
    expect(dentroDePinda("-22.9", -45.4)).toBe(false);
  });
});
