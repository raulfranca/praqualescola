import { describe, expect, it, vi } from "vitest";
import { buscarDadosEscolas, montarEscolas, type LinhaEscola, type LinhaTurma } from "./escolasSupabase";

const escola = (codigo: string, extra: Partial<LinhaEscola> = {}): LinhaEscola => ({
  codigo_inep: codigo,
  tipo: "EM",
  nome: `Escola ${codigo}`,
  endereco: "Rua A, 1",
  bairro: "Centro",
  cep: "12400-000",
  latitude: "-22.9",
  longitude: -45.4,
  telefone: null,
  setor: 10,
  secretaria_polo: "Castolira",
  terceirizada: null,
  ativa: true,
  observacao: null,
  ...extra,
});

const turma = (codigo: string, etapa: string, extra: Partial<LinhaTurma> = {}): LinhaTurma => ({
  codigo_inep: codigo,
  codigo_inep_local: codigo,
  etapa,
  nome_turma: "",
  ano_letivo: 2027,
  ...extra,
});

describe("montarEscolas", () => {
  const escolas = [
    escola("111", { tipo: "CMEI", nome: "CAIC", ativa: false, observacao: "Prédio desativado." }),
    escola("222", { telefone: "3648-0000", terceirizada: "OSC X" }),
  ];
  const turmas = [
    turma("111", "pre_1", { codigo_inep_local: "222" }),
    turma("111", "pre_1", { codigo_inep_local: "222" }),
    turma("111", "pre_2"),
    turma("111", "ano_1", { ano_letivo: 2026 }),
    turma("222", "ano_1"),
    turma("222", "multisseriada", { nome_turma: "Pré I/Pré II" }),
    turma("222", "multisseriada", { nome_turma: "2º/3º ano" }),
    turma("222", "ano_5", { ano_letivo: 2026 }),
  ];
  const [caic, outra] = montarEscolas(escolas, turmas);

  it("conta só o maior ano letivo, pela escola responsável", () => {
    expect(caic).toMatchObject({ pre1: 2, pre2: 1, ano1: 0 });
    expect(outra).toMatchObject({ ano1: 1, ano5: 0 });
  });

  it("lista os prédios onde as turmas funcionam, sem repetir", () => {
    expect(caic.hostedAt).toEqual(["222"]);
    expect(outra.hostedAt).toBeUndefined();
  });

  it("multisseriada soma em cada nível do nome", () => {
    expect(outra).toMatchObject({ pre1: 1, pre2: 1, ano2: 1, ano3: 1 });
  });

  it("converte os campos", () => {
    expect(caic).toMatchObject({
      id: "111",
      type: "CMEI",
      lat: -22.9,
      lng: -45.4,
      sector: "10",
      polo: "Castolira",
      phone: "",
      active: false,
    });
    expect(typeof caic.lat).toBe("number");
    expect(caic.extension).toBeUndefined();
    expect(caic.outsourced).toBeUndefined();
    expect(outra).toMatchObject({ phone: "3648-0000", outsourced: "OSC X", active: true });
  });

  it("ignora multisseriada com nome desconhecido, avisando", () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    const [e] = montarEscolas([escola("333")], [turma("333", "multisseriada", { nome_turma: "Mista" })]);
    expect(e.ano1).toBe(0);
    expect(aviso).toHaveBeenCalledOnce();
    aviso.mockRestore();
  });
});

describe("buscarDadosEscolas", () => {
  it("envia a chave e o schema nos dois pedidos", async () => {
    const fetchFn = vi.fn(async (endereco: string) =>
      new Response(JSON.stringify(endereco.includes("/escolas") ? [escola("1")] : [turma("1", "ano_1")])),
    );
    const dados = await buscarDadosEscolas("https://x.supabase.co", "chave", fetchFn as unknown as typeof fetch);
    expect(fetchFn).toHaveBeenCalledTimes(2);
    for (const [endereco, opcoes] of fetchFn.mock.calls as unknown as [string, RequestInit][]) {
      expect(endereco.startsWith("https://x.supabase.co/rest/v1/")).toBe(true);
      expect(opcoes.headers).toEqual({ apikey: "chave", "Accept-Profile": "dados_gerais" });
    }
    expect(dados.escolas).toHaveLength(1);
    expect(dados.turmas).toHaveLength(1);
  });

  it("erro HTTP vira mensagem legível", async () => {
    const fetchFn = vi.fn(async () => new Response("falha", { status: 500 }));
    await expect(
      buscarDadosEscolas("https://x.supabase.co", "chave", fetchFn as unknown as typeof fetch),
    ).rejects.toThrow(/Não foi possível carregar .* \(erro 500\)/);
  });
});
