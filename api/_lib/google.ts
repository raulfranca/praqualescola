// Routes API — Compute Route Matrix (substitui a Distance Matrix legada).
// Uma origem e até 625 destinos por requisição (sem trânsito). Cobrança por elemento.

import type { Ponto } from "../../src/lib/cota";

export const URL_ROUTES = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix";

export interface RotaCalculada {
  metros: number;
  segundos: number;
}

interface ElementoMatriz {
  originIndex?: number;
  destinationIndex?: number;
  distanceMeters?: number;
  duration?: string; // "123s"
  condition?: string;
  status?: { code?: number };
}

const waypoint = (p: Ponto) => ({ waypoint: { location: { latLng: { latitude: p.lat, longitude: p.lng } } } });

/**
 * Distâncias de carro da origem até cada destino. Posição no array = índice do destino;
 * `null` quando o Google não achou rota. Lança erro se a requisição falhar.
 */
export async function calcularRotas(
  chave: string,
  origem: Ponto,
  destinos: Ponto[],
  fetchFn: typeof fetch = fetch,
): Promise<(RotaCalculada | null)[]> {
  const resposta = await fetchFn(URL_ROUTES, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": chave,
      "X-Goog-FieldMask": "originIndex,destinationIndex,distanceMeters,duration,condition,status",
    },
    body: JSON.stringify({
      origins: [waypoint(origem)],
      destinations: destinos.map(waypoint),
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_UNAWARE",
    }),
  });
  if (!resposta.ok) throw new Error(`Routes API recusou (erro ${resposta.status})`);

  const elementos = (await resposta.json()) as ElementoMatriz[];
  const rotas: (RotaCalculada | null)[] = destinos.map(() => null);
  for (const el of elementos) {
    const i = el.destinationIndex ?? 0;
    const temErro = el.status?.code !== undefined && el.status.code !== 0;
    if (temErro || el.condition !== "ROUTE_EXISTS" || i < 0 || i >= destinos.length) continue;
    rotas[i] = {
      metros: el.distanceMeters ?? 0,
      segundos: Number.parseInt(el.duration ?? "0", 10) || 0,
    };
  }
  return rotas;
}
