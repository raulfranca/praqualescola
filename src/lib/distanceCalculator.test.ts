import { describe, expect, it } from "vitest";
import { calculateHaversineDistance, escolasSemDistancia, sortSchoolsByDistance } from "./distanceCalculator";

describe("escolasSemDistancia", () => {
  const escolas = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const d = { distanceInKm: 1 };

  it("é vazia quando o cache cobre todas", () => {
    expect(escolasSemDistancia(escolas, { 1: d, 2: d, 3: d })).toEqual([]);
  });

  it("devolve só as que faltam", () => {
    expect(escolasSemDistancia(escolas, { 1: d, 3: d })).toEqual([{ id: 2 }]);
  });

  it("devolve todas com cache vazio", () => {
    expect(escolasSemDistancia(escolas, {})).toEqual(escolas);
  });

  it("aceita id texto", () => {
    expect(escolasSemDistancia([{ id: "35234990" }, { id: "35073179" }], { "35234990": d })).toEqual([
      { id: "35073179" },
    ]);
  });
});

describe("calculateHaversineDistance", () => {
  it("é zero para o mesmo ponto", () => {
    expect(calculateHaversineDistance(-22.92, -45.46, -22.92, -45.46)).toBe(0);
  });

  it("mede um grau de latitude como ~111 km, com duas casas", () => {
    expect(calculateHaversineDistance(0, 0, 1, 0)).toBe(111.19);
  });

  it("é simétrica", () => {
    const ida = calculateHaversineDistance(-22.92, -45.46, -23.0, -45.55);
    const volta = calculateHaversineDistance(-23.0, -45.55, -22.92, -45.46);
    expect(ida).toBe(volta);
  });
});

describe("sortSchoolsByDistance", () => {
  it("ordena da mais perto para a mais longe e manda as sem distância para o fim", () => {
    const escolas = [
      { id: "1", distanceInKm: 5 },
      { id: "2" },
      { id: "3", distanceInKm: 1.2 },
    ];
    expect(sortSchoolsByDistance(escolas).map((e) => e.id)).toEqual(["3", "1", "2"]);
  });

  it("não altera a lista original", () => {
    const escolas = [{ id: "1", distanceInKm: 2 }, { id: "2", distanceInKm: 1 }];
    sortSchoolsByDistance(escolas);
    expect(escolas.map((e) => e.id)).toEqual(["1", "2"]);
  });
});
