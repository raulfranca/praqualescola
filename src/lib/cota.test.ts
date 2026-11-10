import { describe, expect, it } from "vitest";
import {
  PASSO_LAT,
  celulaDe,
  celulasVizinhas,
  centroDaCelula,
  distanciaRetaKm,
  estadoDaCota,
  estimativaAproximada,
  mesDaCota,
} from "./cota";

// Centro de uma célula real de Pindamonhangaba, para fugir das bordas.
const pinda = celulaDe(-22.9246, -45.4613).centro;
const metrosEmLat = (m: number) => m / 111_320;

describe("celulaDe", () => {
  it("é determinística e devolve o centro da própria célula", () => {
    const a = celulaDe(pinda.lat, pinda.lng);
    expect(celulaDe(pinda.lat, pinda.lng)).toEqual(a);
    expect(celulaDe(a.centro.lat, a.centro.lng).id).toBe(a.id);
    expect(centroDaCelula(a.id)).toEqual(a.centro);
  });

  it("pontos a 50 m caem na mesma célula", () => {
    const outro = { lat: pinda.lat + metrosEmLat(25), lng: pinda.lng };
    const antes = { lat: pinda.lat - metrosEmLat(25), lng: pinda.lng };
    expect(distanciaRetaKm(antes, outro)).toBeCloseTo(0.05, 2);
    expect(celulaDe(antes.lat, antes.lng).id).toBe(celulaDe(outro.lat, outro.lng).id);
  });

  it("pontos a 400 m caem em células diferentes", () => {
    const longe = { lat: pinda.lat + metrosEmLat(400), lng: pinda.lng };
    expect(distanciaRetaKm(pinda, longe)).toBeCloseTo(0.4, 2);
    const a = celulaDe(pinda.lat, pinda.lng).id;
    const b = celulaDe(longe.lat, longe.lng).id;
    expect(b).not.toBe(a);
    expect(celulasVizinhas(a)).not.toContain(b);
  });

  it("um ponto uma célula adiante é vizinho", () => {
    const a = celulaDe(pinda.lat, pinda.lng).id;
    const norte = celulaDe(pinda.lat + PASSO_LAT, pinda.lng).id;
    const diagonal = celulaDe(pinda.lat - PASSO_LAT, pinda.lng + 0.00195).id;
    expect(norte).not.toBe(a);
    expect(celulasVizinhas(a)).toContain(norte);
    expect(celulasVizinhas(a)).toContain(diagonal);
  });
});

describe("celulasVizinhas", () => {
  it("devolve as 8 vizinhas, sem a própria", () => {
    const v = celulasVizinhas("-12737_-23314");
    expect(v).toHaveLength(8);
    expect(new Set(v).size).toBe(8);
    expect(v).not.toContain("-12737_-23314");
    expect(v).toContain("-12736_-23313");
  });

  it("recusa id inválido", () => {
    expect(() => celulasVizinhas("abc")).toThrow();
  });
});

describe("estadoDaCota", () => {
  const custoEndereco = 67;
  it("normal abaixo de 8.000", () => {
    expect(estadoDaCota({ unidades: 7999, custoEndereco })).toBe("normal");
  });
  it("economia a partir de 8.000", () => {
    expect(estadoDaCota({ unidades: 8000, custoEndereco })).toBe("economia");
  });
  it("9.433 + 67 = 9.500 ainda cabe; 9.434 já é aproximado", () => {
    expect(estadoDaCota({ unidades: 9433, custoEndereco })).toBe("economia");
    expect(estadoDaCota({ unidades: 9434, custoEndereco })).toBe("aproximado");
  });
  it("modo forçado vence tudo", () => {
    expect(estadoDaCota({ unidades: 0, custoEndereco, modoForcado: true })).toBe("aproximado");
  });
});

describe("estimativaAproximada", () => {
  it("linha reta × 1,3 e tempo a 30 km/h", () => {
    const destino = { lat: pinda.lat + metrosEmLat(10_000), lng: pinda.lng };
    const r = estimativaAproximada(pinda, destino);
    expect(r.aproximado).toBe(true);
    expect(r.distanceInKm).toBeCloseTo(13, 1);
    expect(r.durationInMinutes).toBe(Math.ceil((r.distanceInKm / 30) * 60));
  });
});

describe("mesDaCota", () => {
  it("usa o fuso do Pacífico", () => {
    expect(mesDaCota("2026-12-01T05:00:00Z")).toBe("2026-11");
    expect(mesDaCota("2026-12-01T09:00:00Z")).toBe("2026-12");
  });
});
