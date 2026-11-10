import { beforeEach, describe, expect, it, vi } from "vitest";
import { enderecosRestantesHoje, registrarEnderecoNovo } from "./utils";

beforeEach(() => {
  const dados = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => dados.get(k) ?? null,
    setItem: (k: string, v: string) => dados.set(k, v),
  });
});

describe("contador de endereços do dia", () => {
  const manha = new Date(2026, 10, 10, 9, 0);
  const noite = new Date(2026, 10, 10, 23, 59);
  const amanha = new Date(2026, 10, 11, 0, 1);

  it("permite 3 endereços e bloqueia o 4º", () => {
    expect(enderecosRestantesHoje(manha)).toBe(3);
    registrarEnderecoNovo(manha);
    registrarEnderecoNovo(manha);
    expect(enderecosRestantesHoje(manha)).toBe(1);
    registrarEnderecoNovo(noite);
    expect(enderecosRestantesHoje(noite)).toBe(0);
  });

  it("zera no dia seguinte (meia-noite local)", () => {
    for (let i = 0; i < 3; i++) registrarEnderecoNovo(manha);
    expect(enderecosRestantesHoje(amanha)).toBe(3);
    registrarEnderecoNovo(amanha);
    expect(enderecosRestantesHoje(amanha)).toBe(2);
  });

  it("valor corrompido no aparelho não trava o usuário", () => {
    localStorage.setItem("enderecos-do-dia", "{quebrado");
    expect(enderecosRestantesHoje(manha)).toBe(3);
  });
});
