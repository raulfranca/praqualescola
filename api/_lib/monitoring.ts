// Leitura do uso real no Google (Cloud Monitoring) para o painel /admin.
// Conta de serviço com papel "Monitoring Viewer"; JWT assinado com WebCrypto (sem dependências).
// O Monitoring tem até ~30 min de atraso e só dá CONTAGEM DE REQUISIÇÕES, não unidades cobradas.

import { mesDaCota } from "../../src/lib/cota";

export const SERVICOS = {
  routes: ["routes.googleapis.com"],
  mapas: ["maps-backend.googleapis.com"],
  places: ["places-backend.googleapis.com", "places.googleapis.com"],
} as const;

export type Produto = keyof typeof SERVICOS;

export interface UsoGoogle {
  /** Início do mês da cota (meia-noite do dia 1 no Pacífico), ISO. */
  desde: string;
  ate: string;
  /** Requisições por produto. */
  requisicoes: Record<Produto, number>;
}

export interface CredencialServico {
  client_email: string;
  private_key: string;
}

const codificador = new TextEncoder();

const base64url = (bytes: Uint8Array) => {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const base64urlTexto = (texto: string) => base64url(codificador.encode(texto));

/** Meia-noite do dia 1 do mês da cota, no fuso America/Los_Angeles (UTC−7 ou UTC−8). */
export function inicioDoMesDaCota(agora: Date): Date {
  const mes = mesDaCota(agora);
  const [ano, m] = mes.split("-").map(Number);
  for (const hora of [7, 8]) {
    const candidato = new Date(Date.UTC(ano, m - 1, 1, hora));
    if (mesDaCota(candidato) === mes && mesDaCota(new Date(candidato.getTime() - 1)) !== mes) return candidato;
  }
  throw new Error(`Início do mês ${mes} não encontrado`);
}

async function chavePrivada(pem: string): Promise<CryptoKey> {
  const corpo = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(corpo), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("pkcs8", der, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
}

/** Troca a conta de serviço por um token de acesso de leitura do Monitoring. */
export async function tokenDeAcesso(
  credencial: CredencialServico,
  fetchFn: typeof fetch = fetch,
  agora = new Date(),
): Promise<string> {
  const iat = Math.floor(agora.getTime() / 1000);
  const cabecalho = base64urlTexto(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const corpo = base64urlTexto(
    JSON.stringify({
      iss: credencial.client_email,
      scope: "https://www.googleapis.com/auth/monitoring.read",
      aud: "https://oauth2.googleapis.com/token",
      iat,
      exp: iat + 3600,
    }),
  );
  const chave = await chavePrivada(credencial.private_key);
  const assinatura = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", chave, codificador.encode(`${cabecalho}.${corpo}`)),
  );
  const resposta = await fetchFn("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${cabecalho}.${corpo}.${base64url(assinatura)}`,
    }),
  });
  if (!resposta.ok) throw new Error(`Google recusou a conta de serviço (erro ${resposta.status})`);
  return ((await resposta.json()) as { access_token: string }).access_token;
}

interface SerieTemporal {
  resource?: { labels?: { service?: string } };
  points?: { value?: { int64Value?: string | number } }[];
}

/** Requisições do mês da cota até agora, por produto. */
export async function lerUsoGoogle(params: {
  credencial: CredencialServico;
  projeto: string;
  fetchFn?: typeof fetch;
  agora?: Date;
}): Promise<UsoGoogle> {
  const { credencial, projeto, fetchFn = fetch, agora = new Date() } = params;
  const desde = inicioDoMesDaCota(agora);
  const segundos = Math.max(60, Math.ceil((agora.getTime() - desde.getTime()) / 1000));
  const servicos = Object.values(SERVICOS).flat();

  const consulta = new URLSearchParams({
    filter:
      'metric.type="serviceruntime.googleapis.com/api/request_count" AND resource.type="consumed_api" AND ' +
      `resource.labels.service=one_of(${servicos.map((s) => `"${s}"`).join(",")})`,
    "interval.startTime": desde.toISOString(),
    "interval.endTime": agora.toISOString(),
    "aggregation.alignmentPeriod": `${segundos}s`,
    "aggregation.perSeriesAligner": "ALIGN_SUM",
    "aggregation.crossSeriesReducer": "REDUCE_SUM",
    "aggregation.groupByFields": "resource.labels.service",
  });

  const token = await tokenDeAcesso(credencial, fetchFn, agora);
  const resposta = await fetchFn(
    `https://monitoring.googleapis.com/v3/projects/${encodeURIComponent(projeto)}/timeSeries?${consulta}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!resposta.ok) throw new Error(`Cloud Monitoring recusou (erro ${resposta.status})`);
  const { timeSeries = [] } = (await resposta.json()) as { timeSeries?: SerieTemporal[] };

  const requisicoes: Record<Produto, number> = { routes: 0, mapas: 0, places: 0 };
  for (const serie of timeSeries) {
    const servico = serie.resource?.labels?.service ?? "";
    const produto = (Object.keys(SERVICOS) as Produto[]).find((p) =>
      (SERVICOS[p] as readonly string[]).includes(servico),
    );
    if (!produto) continue;
    for (const ponto of serie.points ?? []) requisicoes[produto] += Number(ponto.value?.int64Value ?? 0) || 0;
  }
  return { desde: desde.toISOString(), ate: agora.toISOString(), requisicoes };
}

/**
 * Unidades cobradas da Routes a partir da contagem de requisições. O Monitoring não dá elementos;
 * cada requisição da função leva no máximo uma linha da matriz (1 origem × todas as escolas),
 * então requisições × escolas é o teto — arredonda para cima, como manda o desenho.
 */
export function unidadesEstimadasRoutes(requisicoes: number, escolas: number): number {
  return Math.ceil(requisicoes) * Math.max(escolas, 0);
}
