import { describe, expect, it } from "vitest";
import { montarIconeEscola, tamanhoMarcador } from "./marcadorEscola";
import { mapColors } from "./mapColors";

const so = (n: Partial<{ creche: boolean; pre: boolean; fundamental: boolean }>) => ({
  creche: false,
  pre: false,
  fundamental: false,
  ...n,
});

describe("montarIconeEscola", () => {
  it("mostra o número de vagas quando há vaga", () => {
    const { svg } = montarIconeEscola({ niveis: so({ creche: true }), favorito: false, zoom: 13, vagas: 3 });
    expect(svg).toContain('data-vagas="3"');
    expect(svg).toContain(">3</text>");
    expect(svg).toContain(mapColors["sucesso-fg"]);
  });

  it.each([0, -1, undefined])("sem selo quando vagas = %s", (vagas) => {
    const { svg } = montarIconeEscola({ niveis: so({ pre: true }), favorito: false, zoom: 13, vagas });
    expect(svg).not.toContain("data-vagas");
    expect(svg).not.toContain("<text");
  });

  it("o selo cabe no ícone e o centro continua no meio", () => {
    for (const favorito of [false, true]) {
      for (const zoom of [11, 13, 15, 18]) {
        const { svg, tamanho, centro } = montarIconeEscola({
          niveis: so({ fundamental: true }),
          favorito,
          zoom,
          vagas: 12,
        });
        expect(centro).toBe(tamanho / 2);
        const rect = svg.match(/<rect x="([\d.-]+)" y="([\d.-]+)" width="([\d.]+)" height="([\d.]+)" rx/)!;
        const [x, y, w, h] = rect.slice(1).map(Number);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(x + w).toBeLessThanOrEqual(tamanho);
        expect(y + h).toBeLessThanOrEqual(tamanho);
      }
    }
  });

  it("sem selo, o ícone tem o tamanho de sempre", () => {
    const s = tamanhoMarcador(13);
    expect(montarIconeEscola({ niveis: so({ creche: true }), favorito: false, zoom: 13 }).tamanho).toBe(s + 16);
    expect(montarIconeEscola({ niveis: so({ creche: true }), favorito: true, zoom: 13 }).tamanho).toBe(s * 1.8 + 24);
  });

  it("divide o círculo por nível de ensino", () => {
    const { svg } = montarIconeEscola({
      niveis: so({ creche: true, pre: true, fundamental: true }),
      favorito: false,
      zoom: 13,
    });
    expect(svg).toContain(mapColors["nivel-creche"]);
    expect(svg).toContain(mapColors["nivel-pre"]);
    expect(svg).toContain(mapColors["nivel-fundamental"]);
    expect(svg.match(/clipPath id="fatia/g)).toHaveLength(3);
  });
});
