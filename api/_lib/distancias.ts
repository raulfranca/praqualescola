// Núcleo da função /api/distancias: cache compartilhado, cota e Google.
// Recebe ambiente e fetch por parâmetro para ser testável sem rede.

import {
  TETO_MENSAL,
  celulaDe,
  celulasVizinhas,
  centroDaCelula,
  distanciaRetaKm,
  estadoDaCota,
  estimativaAproximada,
  type EstadoCota,
  type Ponto,
} from "../../src/lib/cota";
import { calcularRotas } from "./google";
import { hashDoIp } from "./ip";
import { criarRpc, lerEscolas, type EscolaServidor, type LinhaCache, type ResumoCota } from "./supabase";

/** Cálculos que vão ao Google por IP e por dia (uma rede de escola pode ter vários professores). */
export const MAX_GOOGLE_POR_IP_DIA = 30;

/** Caixa generosa em volta de Pindamonhangaba. */
const CAIXA = { latMin: -23.2, latMax: -22.6, lngMin: -45.8, lngMax: -45.1 };

export interface Ambiente {
  supabaseUrl?: string;
  chavePublica?: string;
  chaveSecreta?: string;
  chaveGoogle?: string;
  segredoHash?: string;
}

export interface Distancia {
  distanceInKm: number;
  durationInMinutes: number;
  aproximado: boolean;
}

export interface RespostaDistancias {
  estado: EstadoCota;
  distancias: Record<string, Distancia>;
}

export function dentroDePinda(lat: unknown, lng: unknown): boolean {
  return (
    typeof lat === "number" &&
    typeof lng === "number" &&
    lat >= CAIXA.latMin &&
    lat <= CAIXA.latMax &&
    lng >= CAIXA.lngMin &&
    lng <= CAIXA.lngMax
  );
}

const mesmoPonto = (a: number, b: number) => Math.abs(a - b) < 1e-7;

/** Linhas do cache por célula, só as que ainda batem com a coordenada atual da escola. */
function cacheValidoPorCelula(linhas: LinhaCache[], escolas: Map<string, EscolaServidor>) {
  const porCelula = new Map<string, Map<string, LinhaCache>>();
  for (const l of linhas) {
    const e = escolas.get(l.codigo_inep);
    if (!e || !mesmoPonto(e.lat, l.escola_lat) || !mesmoPonto(e.lng, l.escola_lng)) continue;
    if (!porCelula.has(l.celula)) porCelula.set(l.celula, new Map());
    porCelula.get(l.celula)!.set(l.codigo_inep, l);
  }
  return porCelula;
}

const real = (metros: number, segundos: number): Distancia => ({
  distanceInKm: Number((metros / 1000).toFixed(2)),
  durationInMinutes: Math.ceil(segundos / 60),
  aproximado: false,
});

function diaUtc(agora: Date): string {
  return agora.toISOString().slice(0, 10);
}

export async function calcularDistancias(params: {
  lat: number;
  lng: number;
  ip: string;
  env: Ambiente;
  fetchFn?: typeof fetch;
  agora?: Date;
}): Promise<RespostaDistancias> {
  const { lat, lng, ip, env, fetchFn = fetch, agora = new Date() } = params;
  const ponto: Ponto = { lat, lng };

  if (!env.supabaseUrl || !env.chavePublica) throw new Error("Supabase não configurado");
  const lista = await lerEscolas(env.supabaseUrl, env.chavePublica, fetchFn);
  const escolas = new Map(lista.map((e) => [e.inep, e]));

  const distancias: Record<string, Distancia> = {};
  const completarComEstimativas = () => {
    for (const e of lista) distancias[e.inep] ??= estimativaAproximada(ponto, e);
  };

  if (!env.chaveSecreta) {
    completarComEstimativas();
    return { estado: "aproximado", distancias };
  }

  const rpc = criarRpc(env.supabaseUrl, env.chaveSecreta, fetchFn);
  let estado: EstadoCota = "aproximado";

  try {
    const resumo = await rpc<ResumoCota>("pqe_resumo");
    estado = estadoDaCota({
      unidades: resumo.unidades,
      custoEndereco: lista.length,
      modoForcado: resumo.modo_forcado === true,
    });

    // A casa vira célula; o servidor nunca guarda a coordenada recebida.
    const celula = celulaDe(lat, lng);
    const candidatas = estado === "economia" ? [celula.id, ...celulasVizinhas(celula.id)] : [celula.id];
    const linhas = await rpc<LinhaCache[]>("pqe_buscar", { p_celulas: candidatas });
    const cache = cacheValidoPorCelula(linhas ?? [], escolas);

    // Própria célula; no modo Economia, a vizinha mais próxima que cubra todas as escolas.
    let escolhida = cache.get(celula.id) ?? new Map<string, LinhaCache>();
    if (estado === "economia" && escolhida.size < lista.length) {
      const vizinha = candidatas
        .slice(1)
        .filter((id) => cache.get(id)?.size === lista.length)
        .sort((a, b) => distanciaRetaKm(ponto, centroDaCelula(a)) - distanciaRetaKm(ponto, centroDaCelula(b)))[0];
      if (vizinha) escolhida = cache.get(vizinha)!;
    }

    for (const [inep, l] of escolhida) distancias[inep] = real(l.metros, l.segundos);
    const faltantes = lista.filter((e) => !distancias[e.inep]);

    if (faltantes.length === 0) {
      // Só estatística: falhar aqui não pode trocar distâncias reais por estimativas.
      await rpc("pqe_contar_acerto").catch((erro) => console.error("Acerto não contado:", erro));
      return { estado, distancias };
    }

    if (estado !== "aproximado" && env.chaveGoogle && env.segredoHash) {
      const hash = await hashDoIp(ip, env.segredoHash);
      const dentroDoLimite = await rpc<boolean>("pqe_limite", {
        p_hash: hash,
        p_janela: `google:${diaUtc(agora)}`,
        p_maximo: MAX_GOOGLE_POR_IP_DIA,
      });
      const reservado =
        dentroDoLimite &&
        (await rpc<boolean>("pqe_reservar", { p_unidades: faltantes.length, p_limite: TETO_MENSAL }));

      if (reservado) {
        let rotas: Awaited<ReturnType<typeof calcularRotas>> | null = null;
        try {
          rotas = await calcularRotas(env.chaveGoogle, celula.centro, faltantes, fetchFn);
        } catch (erro) {
          console.error("Google falhou; devolvendo a reserva:", erro);
          await rpc("pqe_devolver", { p_unidades: faltantes.length });
        }

        if (rotas) {
          const gravar = faltantes.flatMap((e, i) => {
            const r = rotas[i];
            if (!r) return [];
            distancias[e.inep] = real(r.metros, r.segundos);
            return [{ codigo_inep: e.inep, metros: r.metros, segundos: r.segundos, escola_lat: e.lat, escola_lng: e.lng }];
          });
          if (gravar.length) {
            try {
              await rpc("pqe_gravar", {
                p_celula: celula.id,
                p_centro_lat: celula.centro.lat,
                p_centro_lng: celula.centro.lng,
                p_linhas: gravar,
              });
            } catch (erro) {
              console.error("Não foi possível gravar no cache:", erro);
            }
          }
        }
      }
    }
  } catch (erro) {
    console.error("Cota/cache indisponível; respondendo com estimativas:", erro);
    estado = "aproximado";
  }

  // Estimativas completam o que faltou e nunca vão para o cache.
  completarComEstimativas();
  return { estado, distancias };
}
