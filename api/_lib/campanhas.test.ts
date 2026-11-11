import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import campanhasAdmin from "../admin/campanhas";
import campanha from "../campanha";
import { emitirToken } from "./admin";
import { estadoDaCampanha, validarEdicao } from "./campanhas";

const INICIO = "2026-11-12T06:00:00-03:00";
const FIM = "2026-11-13T07:00:00-03:00";
const em = (iso: string) => new Date(iso);

describe("estadoDaCampanha", () => {
  const c = { inicio: INICIO, fim: FIM, ligada: true };

  it("no ar, agendada, encerrada e desligada", () => {
    expect(estadoDaCampanha(c, em("2026-11-12T12:00:00-03:00"))).toBe("no_ar");
    expect(estadoDaCampanha(c, em("2026-11-12T05:59:59-03:00"))).toBe("agendada");
    expect(estadoDaCampanha(c, em("2026-11-13T07:00:01-03:00"))).toBe("encerrada");
    expect(estadoDaCampanha({ ...c, ligada: false }, em("2026-11-12T12:00:00-03:00"))).toBe("desligada");
  });

  it("no instante do fim ainda está no ar; desligada antes do início é desligada", () => {
    expect(estadoDaCampanha(c, em(FIM))).toBe("no_ar");
    expect(estadoDaCampanha({ ...c, ligada: false }, em("2026-11-01T00:00:00-03:00"))).toBe("desligada");
    expect(estadoDaCampanha({ ...c, ligada: false }, em("2026-11-20T00:00:00-03:00"))).toBe("encerrada");
  });
});

describe("validarEdicao", () => {
  const ok = { id: "x", nome: " Remoção ", descricao: "d", inicio: INICIO, fim: FIM, ligada: false };

  it("aceita e apara o nome", () => {
    expect(validarEdicao(ok)).toEqual({ dados: { ...ok, nome: "Remoção" } });
  });

  it("recusa nome vazio, datas inválidas, fim ≤ início e ligada não booleana", () => {
    expect(validarEdicao({ ...ok, nome: "  " })).toEqual({ erro: "O nome não pode ficar vazio." });
    expect(validarEdicao({ ...ok, fim: INICIO })).toEqual({ erro: "O fim precisa ser depois do início." });
    expect(validarEdicao({ ...ok, fim: "2026-11-11T00:00:00-03:00" })).toEqual({
      erro: "O fim precisa ser depois do início.",
    });
    expect(validarEdicao({ ...ok, inicio: "ontem" })).toEqual({ erro: "Data de início inválida." });
    expect(validarEdicao({ ...ok, ligada: "sim" })).toEqual({ erro: "Informe se a campanha está ligada." });
    expect(validarEdicao(null)).toEqual({ erro: "Campanha não informada." });
  });
});

const NO_AR = {
  id: "remocao-2027-1a-fase",
  nome: "Remoção 2027 · 1ª fase",
  descricao: "",
  inicio: INICIO,
  fim: FIM,
  fonte: null,
  vagas: { "35000001": 2 },
  escolas_com_vaga: 1,
  total_vagas: 2,
};

/** Supabase falso: cada função `pqe_*` responde pelo mapa (função → resposta); registra as chamadas. */
function supabaseFalso(respostas: Record<string, () => Response>) {
  const chamadas: { nome: string; args: Record<string, unknown> }[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
      const nome = String(entrada).match(/\/rest\/v1\/rpc\/(\w+)/)?.[1];
      if (!nome || !respostas[nome]) throw new Error(`Requisição inesperada: ${String(entrada)}`);
      chamadas.push({ nome, args: JSON.parse(String(init?.body ?? "{}")) });
      return respostas[nome]();
    }),
  );
  return chamadas;
}

describe("GET /api/campanha", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_x");
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const get = () => campanha(new Request("http://localhost/api/campanha"));

  it("devolve a campanha no ar, com cache curto", async () => {
    supabaseFalso({ pqe_campanha_no_ar: () => new Response(JSON.stringify(NO_AR)) });
    const r = await get();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ campanha: NO_AR });
    expect(r.headers.get("Cache-Control")).toBe("public, s-maxage=60, stale-while-revalidate=300");
  });

  it("nenhuma no ar → { campanha: null }", async () => {
    supabaseFalso({ pqe_campanha_no_ar: () => new Response("null") });
    expect(await (await get()).json()).toEqual({ campanha: null });
  });

  it("falha do banco → 200 { campanha: null }, com cache e registro do erro", async () => {
    supabaseFalso({ pqe_campanha_no_ar: () => new Response("{}", { status: 500 }) });
    const r = await get();
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ campanha: null });
    expect(r.headers.get("Cache-Control")).toContain("s-maxage=60");
    expect(console.error).toHaveBeenCalled();
  });

  it("sem chave secreta → { campanha: null } sem chamar o banco", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const chamadas = supabaseFalso({});
    expect(await (await get()).json()).toEqual({ campanha: null });
    expect(chamadas).toEqual([]);
  });
});

describe("/api/admin/campanhas", () => {
  const SEGREDO = "segredo-do-token";
  const URL_ADMIN = "http://localhost/api/admin/campanhas";
  const DO_BANCO = {
    ...NO_AR,
    ligada: true,
    arquivada: false,
    atualizada_em: INICIO,
    escolas_na_lista: 66,
    maiores: [],
  };

  beforeEach(() => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_x");
    vi.stubEnv("PQE_ADMIN_TOKEN_SECRET", SEGREDO);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  const post = async (corpo: unknown) =>
    campanhasAdmin(
      new Request(URL_ADMIN, {
        method: "POST",
        headers: { Authorization: `Bearer ${await emitirToken(SEGREDO)}` },
        body: JSON.stringify(corpo),
      }),
    );

  it("sem token → 401, sem chamar o banco", async () => {
    const chamadas = supabaseFalso({});
    expect((await campanhasAdmin(new Request(URL_ADMIN))).status).toBe(401);
    expect(chamadas).toEqual([]);
  });

  it("GET lista com o estado de cada campanha", async () => {
    supabaseFalso({ pqe_campanhas_admin: () => new Response(JSON.stringify([DO_BANCO])) });
    const r = await campanhasAdmin(
      new Request(URL_ADMIN, { headers: { Authorization: `Bearer ${await emitirToken(SEGREDO)}` } }),
    );
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.campanhas).toHaveLength(1);
    expect(["no_ar", "agendada", "encerrada"]).toContain(corpo.campanhas[0].estado);
    expect(typeof corpo.agora).toBe("string");
  });

  it("editar chama pqe_campanha_atualizar e devolve a lista; edição inválida → 400 sem chamar o banco", async () => {
    const chamadas = supabaseFalso({
      pqe_campanha_atualizar: () => new Response(null, { status: 204 }),
      pqe_campanhas_admin: () => new Response(JSON.stringify([DO_BANCO])),
    });
    const r = await post({ acao: "editar", id: NO_AR.id, nome: "Novo", descricao: "", inicio: INICIO, fim: FIM, ligada: true });
    expect(r.status).toBe(200);
    expect(chamadas[0]).toEqual({
      nome: "pqe_campanha_atualizar",
      args: { p_id: NO_AR.id, p_nome: "Novo", p_descricao: "", p_inicio: INICIO, p_fim: FIM, p_ligada: true },
    });
    expect((await r.json()).campanhas).toHaveLength(1);

    const invalida = await post({ acao: "editar", id: NO_AR.id, nome: "", inicio: INICIO, fim: FIM, ligada: true });
    expect(invalida.status).toBe(400);
    expect(await invalida.json()).toEqual({ erro: "O nome não pode ficar vazio." });
    expect(chamadas).toHaveLength(2);
  });

  it("arquivar antes do fim: o erro do banco volta como 400 com a mensagem", async () => {
    supabaseFalso({
      pqe_campanha_arquivar: () =>
        new Response(JSON.stringify({ code: "P0001", message: "Só dá para arquivar depois do fim da campanha." }), {
          status: 400,
        }),
    });
    const r = await post({ acao: "arquivar", id: NO_AR.id, arquivada: true });
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({ erro: "Só dá para arquivar depois do fim da campanha." });
  });

  it("erro interno do banco não vaza: 503 genérico", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    supabaseFalso({
      pqe_campanha_arquivar: () =>
        new Response(JSON.stringify({ code: "42501", message: "permission denied for table campanhas" }), { status: 403 }),
    });
    const r = await post({ acao: "arquivar", id: NO_AR.id, arquivada: true });
    expect(r.status).toBe(503);
    expect(await r.json()).toEqual({ erro: "Campanhas indisponíveis" });
    vi.restoreAllMocks();
  });
});
