// Lógica pura da cota do Google, compartilhada pelo app e pelas funções em api/.
// Sem DOM e sem imports com "@/": precisa ser importável pelo servidor.

/** Passo da grade em graus: ~200 m em latitude; longitude corrigida por cos(-22,9°) da região. */
export const PASSO_LAT = 0.0018;
export const PASSO_LNG = 0.00195;

export const COTA_MENSAL = 10000;
const FRACAO_ECONOMIA = 0.8; // 8.000 de 10.000
const FRACAO_TETO = 0.95; // 9.500 de 10.000
/** Teto de reserva do contador: nenhuma reserva passa disso. */
export const TETO_MENSAL = COTA_MENSAL * FRACAO_TETO;
/** A partir daqui, modo Economia. */
export const LIMIAR_ECONOMIA = COTA_MENSAL * FRACAO_ECONOMIA;

export const FATOR_TORTUOSIDADE = 1.3;
export const VELOCIDADE_MEDIA_KMH = 30;

export type EstadoCota = "normal" | "economia" | "aproximado";

export interface Ponto {
  lat: number;
  lng: number;
}

export interface Celula {
  id: string;
  centro: Ponto;
}

function centroDe(i: number, j: number): Ponto {
  return { lat: (i + 0.5) * PASSO_LAT, lng: (j + 0.5) * PASSO_LNG };
}

/** Célula da grade (~200 m) que contém o ponto. Id no formato "<i>_<j>". */
export function celulaDe(lat: number, lng: number): Celula {
  const i = Math.floor(lat / PASSO_LAT);
  const j = Math.floor(lng / PASSO_LNG);
  return { id: `${i}_${j}`, centro: centroDe(i, j) };
}

function indicesDe(id: string): [number, number] {
  const m = /^(-?\d+)_(-?\d+)$/.exec(id);
  if (!m) throw new Error(`Id de célula inválido: ${id}`);
  return [Number(m[1]), Number(m[2])];
}

/** As 8 células ao redor (usadas no modo Economia). */
export function celulasVizinhas(id: string): string[] {
  const [i, j] = indicesDe(id);
  const vizinhas: string[] = [];
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      if (di !== 0 || dj !== 0) vizinhas.push(`${i + di}_${j + dj}`);
    }
  }
  return vizinhas;
}

/** Centro de uma célula a partir do id. */
export function centroDaCelula(id: string): Ponto {
  const [i, j] = indicesDe(id);
  return centroDe(i, j);
}

export function estadoDaCota(params: {
  unidades: number;
  cota?: number;
  custoEndereco: number;
  modoForcado?: boolean;
}): EstadoCota {
  const { unidades, custoEndereco, modoForcado = false } = params;
  const cota = params.cota ?? COTA_MENSAL;
  if (modoForcado || unidades + custoEndereco > cota * FRACAO_TETO) return "aproximado";
  if (unidades >= cota * FRACAO_ECONOMIA) return "economia";
  return "normal";
}

/** Distância em linha reta (km), fórmula de Haversine. */
export function distanciaRetaKm(a: Ponto, b: Ponto): number {
  const R = 6371;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/** Estimativa sem o Google: linha reta × 1,3; tempo a 30 km/h. */
export function estimativaAproximada(
  origem: Ponto,
  escola: Ponto,
): { distanceInKm: number; durationInMinutes: number; aproximado: true } {
  const km = Number((distanciaRetaKm(origem, escola) * FATOR_TORTUOSIDADE).toFixed(2));
  return {
    distanceInKm: km,
    durationInMinutes: Math.ceil((km / VELOCIDADE_MEDIA_KMH) * 60),
    aproximado: true,
  };
}

/** Mês da cota do Google ("AAAA-MM"), que vira no fuso do Pacífico. */
export function mesDaCota(data: Date | string = new Date()): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(data));
  const ano = partes.find((p) => p.type === "year")?.value;
  const mes = partes.find((p) => p.type === "month")?.value;
  return `${ano}-${mes}`;
}
