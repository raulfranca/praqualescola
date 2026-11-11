// Ícone do marcador de escola no mapa, como SVG puro (o Google Maps recebe em data-URI).
// Sem dependência do Google: `MapView` converte `tamanho`/`centro` em Size/Point.
import { mapColors } from "@/lib/mapColors";

export interface NiveisEscola {
  creche: boolean;
  pre: boolean;
  fundamental: boolean;
}

export interface IconeEscola {
  svg: string;
  /** Lado do quadrado do ícone, em px. */
  tamanho: number;
  /** Centro do círculo/estrela dentro do ícone (âncora e área de clique), em px. */
  centro: number;
}

/** Diâmetro do círculo conforme o zoom: menor na cidade, maior na rua. */
export const tamanhoMarcador = (zoom: number): number =>
  zoom < 16 ? Math.max(18, 10 + zoom * 0.8) : Math.max(24, 14 + zoom * 1.5);

const STAR_PATH = "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z";

/** Cores do preenchimento, da esquerda para a direita (creche → pré → fundamental). */
function coresDosNiveis(n: NiveisEscola): string[] {
  const cores = [
    n.creche && mapColors["nivel-creche"],
    n.pre && mapColors["nivel-pre"],
    n.fundamental && mapColors["nivel-fundamental"],
  ].filter((c): c is string => !!c);
  return cores.length ? cores : [mapColors.primary];
}

const ALTURA_SELO = 18;
const larguraSelo = (texto: string) => Math.max(ALTURA_SELO, 7 * texto.length + 10);

/** Selo numérico de vagas: pílula verde (`--sucesso-fg`) com contorno branco, centrada em (x, y). */
function seloVagas(vagas: number, x: number, y: number): string {
  const texto = String(vagas);
  const altura = ALTURA_SELO;
  const largura = larguraSelo(texto);
  return `
    <g data-vagas="${texto}">
      <rect x="${x - largura / 2}" y="${y - altura / 2}" width="${largura}" height="${altura}" rx="${altura / 2}"
            fill="${mapColors["sucesso-fg"]}" stroke="${mapColors["marcador-contorno"]}" stroke-width="2"/>
      <text x="${x}" y="${y}" dy="0.35em" text-anchor="middle" fill="${mapColors["marcador-contorno"]}"
            font-family="Inter, system-ui, sans-serif" font-size="11" font-weight="700">${texto}</text>
    </g>`;
}

/**
 * Monta o ícone de uma escola. `vagas` > 0 acrescenta o selo no canto superior direito; o ícone cresce por igual
 * em todos os lados quando o selo não cabe, para o centro (âncora, clique e rótulo) continuar no meio.
 */
export function montarIconeEscola(opcoes: {
  niveis: NiveisEscola;
  favorito: boolean;
  zoom: number;
  vagas?: number;
}): IconeEscola {
  const { niveis, favorito, zoom } = opcoes;
  const vagas = opcoes.vagas ?? 0;
  const size = tamanhoMarcador(zoom);
  const cores = coresDosNiveis(niveis);
  const outline = mapColors["marcador-contorno"];

  // Tamanho base (sem selo): espaço extra em volta para a sombra não ser cortada.
  const forma = favorito ? size * 1.8 : size;
  const base = favorito ? forma + 24 : forma + 16;
  const meio = base / 2;

  // Selo: centro deslocado para cima e à direita, sobre a borda da forma.
  const raio = forma / 2;
  const desloc = raio * (favorito ? 0.6 : 0.75);
  // +1: metade do contorno branco de 2px
  const alcance = vagas > 0 ? desloc + Math.max(larguraSelo(String(vagas)), ALTURA_SELO) / 2 + 1 : 0;
  const pad = Math.max(0, Math.ceil(alcance - meio));
  const tamanho = base + 2 * pad;
  const centro = meio + pad;

  const sombra = `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
      <feDropShadow dx="0" dy="2" stdDeviation="2.5" flood-color="${mapColors["on-surface"]}" flood-opacity="0.35"/>
    </filter>`;

  let defs = sombra;
  let corpo: string;

  if (favorito) {
    // Estrela no quadro 24×24, escalada; fatias verticais por nível; anel âmbar por fora do contorno branco.
    const escala = forma / 24;
    const faixa = 24 / cores.length;
    cores.forEach((_, i) => {
      defs += `<clipPath id="fatia${i}"><rect x="${i * faixa}" y="0" width="${faixa}" height="24"/></clipPath>`;
    });
    const fatias = cores
      .map((cor, i) => `<path d="${STAR_PATH}" fill="${cor}"${cores.length > 1 ? ` clip-path="url(#fatia${i})"` : ""}/>`)
      .join("");
    corpo = `
      <g transform="translate(${centro - forma / 2}, ${centro - forma / 2}) scale(${escala})" filter="url(#shadow)">
        ${fatias}
        <path d="${STAR_PATH}" fill="none" stroke="${mapColors["marcador-favorito"]}" stroke-width="5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
        <path d="${STAR_PATH}" fill="none" stroke="${outline}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
      </g>`;
  } else {
    // Círculo com contorno branco de 2px; fatias verticais por nível.
    const r = raio - 2;
    const faixa = forma / cores.length;
    const inicio = centro - raio;
    cores.forEach((_, i) => {
      defs += `<clipPath id="fatia${i}"><rect x="${inicio + i * faixa}" y="${inicio}" width="${faixa}" height="${forma}"/></clipPath>`;
    });
    const fatias = cores
      .map(
        (cor, i) =>
          `<circle cx="${centro}" cy="${centro}" r="${r}" fill="${cor}"${cores.length > 1 ? ` clip-path="url(#fatia${i})"` : ""}/>`,
      )
      .join("");
    corpo = `
      <g filter="url(#shadow)">
        ${fatias}
        <circle cx="${centro}" cy="${centro}" r="${r}" fill="none" stroke="${outline}" stroke-width="2"/>
      </g>`;
  }

  const selo = vagas > 0 ? seloVagas(vagas, centro + desloc, centro - desloc) : "";

  const svg = `<svg width="${tamanho}" height="${tamanho}" xmlns="http://www.w3.org/2000/svg">
    <defs>${defs}</defs>${corpo}${selo}
  </svg>`;

  return { svg, tamanho, centro };
}
