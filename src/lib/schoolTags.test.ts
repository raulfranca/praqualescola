import { describe, expect, it } from "vitest";
import { getSchoolLevelTags } from "./schoolTags";
import type { School } from "@/types/school";

const escola = (niveis: Partial<School>): School =>
  ({ id: 1, type: "EM", name: "Teste", ...niveis }) as School;

const rotulos = (niveis: Partial<School>) => getSchoolLevelTags(escola(niveis)).map((t) => t.label);

describe("getSchoolLevelTags", () => {
  it("junta infantil e pré quando a escola tem os dois níveis", () => {
    expect(rotulos({ infantil1: 2, infantil2: 1, pre1: 1, pre2: 3 })).toEqual(["Inf. 1 e 2", "Pré 1 e 2"]);
  });

  it("agrupa anos contínuos do fundamental em faixas", () => {
    expect(rotulos({ ano1: 1, ano2: 1, ano3: 1, ano5: 2 })).toEqual(["1º ao 3º ano", "5º"]);
  });

  it("ignora níveis com zero turmas", () => {
    expect(rotulos({ bercario: 0, pre1: 0, ano4: 0 })).toEqual([]);
  });
});
