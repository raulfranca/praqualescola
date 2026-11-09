import { describe, expect, it } from "vitest";
import { calculateHaversineDistance, sortSchoolsByDistance } from "./distanceCalculator";

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
      { id: 1, distanceInKm: 5 },
      { id: 2 },
      { id: 3, distanceInKm: 1.2 },
    ];
    expect(sortSchoolsByDistance(escolas).map((e) => e.id)).toEqual([3, 1, 2]);
  });

  it("não altera a lista original", () => {
    const escolas = [{ id: 1, distanceInKm: 2 }, { id: 2, distanceInKm: 1 }];
    sortSchoolsByDistance(escolas);
    expect(escolas.map((e) => e.id)).toEqual([1, 2]);
  });
});
