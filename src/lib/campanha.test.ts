import { describe, expect, it } from "vitest";
import type { School } from "@/types/school";
import {
  aplicarVagas,
  dataHoraCurta,
  deCampoBrasilia,
  filtroVagasAtivo,
  fimCurto,
  fimPorExtenso,
  lerCampanha,
  paraCampoBrasilia,
  temVaga,
  type CampanhaNoAr,
} from "./campanha";

describe("datas do painel no horário de Brasília", () => {
  it("curta com hora", () => {
    expect(dataHoraCurta("2026-11-12T09:00:00Z")).toBe("12/11, 6h");
    expect(dataHoraCurta("2026-11-12T09:30:00Z")).toBe("12/11, 6h30");
  });
  it("ida e volta pelo campo de data e hora", () => {
    expect(paraCampoBrasilia("2026-11-12T09:00:00Z")).toBe("2026-11-12T06:00");
    expect(paraCampoBrasilia("2026-11-13T02:15:00Z")).toBe("2026-11-12T23:15");
    expect(deCampoBrasilia("2026-11-12T06:00")).toBe("2026-11-12T06:00:00-03:00");
    expect(Date.parse(deCampoBrasilia("2026-11-12T06:00")!)).toBe(Date.parse("2026-11-12T09:00:00Z"));
    expect(deCampoBrasilia("")).toBeNull();
    expect(deCampoBrasilia("2026-13-40T99:00")).toBeNull();
  });
});

describe("fim da campanha no horário de Brasília", () => {
  it("por extenso, com e sem minutos", () => {
    expect(fimPorExtenso("2026-11-13T10:00:00Z")).toBe("13 de novembro, às 7h");
    expect(fimPorExtenso("2026-11-13T10:30:00Z")).toBe("13 de novembro, às 7h30");
    expect(fimPorExtenso("2026-11-14T02:00:00Z")).toBe("13 de novembro, às 23h");
  });
  it("curto", () => {
    expect(fimCurto("2026-11-13T10:00:00Z")).toBe("13/11");
  });
});

const escola = (id: string, extra: Partial<School> = {}): School =>
  ({ id, name: `Escola ${id}`, type: "", address: "", cep: "", phone: "", neighborhood: "", lat: 0, lng: 0, sector: "", polo: "", ...extra }) as School;

const campanha: CampanhaNoAr = {
  id: "c1",
  nome: "Remoção 2027 · 1ª fase",
  descricao: "",
  inicio: "2026-11-12T09:00:00Z",
  fim: "2026-11-13T10:00:00Z",
  fonte: null,
  vagas: { "111": 2, "222": 1 },
  escolas_com_vaga: 2,
  total_vagas: 3,
};

describe("aplicarVagas", () => {
  it("preenche só as escolas cujo INEP está na campanha", () => {
    const r = aplicarVagas([escola("111"), escola("222"), escola("333")], campanha);
    expect(r.map((e) => e.vacancies)).toEqual([2, 1, undefined]);
    expect("vacancies" in r[2]).toBe(false);
  });

  it("sem campanha, nenhuma escola fica com vagas (nem as que tinham)", () => {
    const r = aplicarVagas([escola("111", { vacancies: 5 })], null);
    expect("vacancies" in r[0]).toBe(false);
  });
});

describe("temVaga", () => {
  it("só número positivo é vaga", () => {
    expect(temVaga({ vacancies: 1 })).toBe(true);
    expect(temVaga({ vacancies: 0 })).toBe(false);
    expect(temVaga({ vacancies: -1 })).toBe(false);
    expect(temVaga({})).toBe(false);
  });
});

describe("filtroVagasAtivo", () => {
  it("desligado sem campanha, mesmo que o professor o tenha ligado antes", () => {
    expect(filtroVagasAtivo(true, false)).toBe(false);
    expect(filtroVagasAtivo(true, true)).toBe(true);
    expect(filtroVagasAtivo(false, true)).toBe(false);
  });
});

describe("lerCampanha", () => {
  it("aceita a campanha e recusa o resto", () => {
    expect(lerCampanha({ campanha })).toEqual(campanha);
    expect(lerCampanha({ campanha: null })).toBeNull();
    expect(lerCampanha(null)).toBeNull();
    expect(lerCampanha("<html>")).toBeNull();
    expect(lerCampanha({ campanha: { id: "x", nome: "y" } })).toBeNull();
  });
});
