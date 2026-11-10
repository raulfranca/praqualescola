// Acesso ao Supabase "Dados" pelo servidor.
// Escolas: leitura pública de `dados_gerais` (chave publishable).
// Cota e cache: funções `public.pqe_*`, executáveis só com a chave secreta (service_role).

export interface EscolaServidor {
  inep: string;
  lat: number;
  lng: number;
}

export interface LinhaCache {
  celula: string;
  codigo_inep: string;
  metros: number;
  segundos: number;
  escola_lat: number;
  escola_lng: number;
}

export interface ResumoCota {
  mes: string;
  unidades: number;
  acertos_cache: number;
  calculos_google: number;
  calibrado_em: string | null;
  modo_forcado: boolean;
  celulas: number;
}

/** Escolas com coordenadas válidas, lidas com a chave pública. */
export async function lerEscolas(
  url: string,
  chavePublica: string,
  fetchFn: typeof fetch = fetch,
): Promise<EscolaServidor[]> {
  const resposta = await fetchFn(`${url}/rest/v1/escolas?select=codigo_inep,latitude,longitude`, {
    headers: { apikey: chavePublica, "Accept-Profile": "dados_gerais" },
  });
  if (!resposta.ok) throw new Error(`Escolas indisponíveis (erro ${resposta.status})`);
  const linhas = (await resposta.json()) as {
    codigo_inep: string;
    latitude: number | string | null;
    longitude: number | string | null;
  }[];
  return linhas
    .map((l) => ({ inep: l.codigo_inep, lat: Number(l.latitude), lng: Number(l.longitude) }))
    // Number(null) vira 0: escola sem coordenada fica de fora.
    .filter((e) => Number.isFinite(e.lat) && Number.isFinite(e.lng) && e.lat !== 0 && e.lng !== 0);
}

/** Chama uma função `pqe_*` com a chave secreta. */
export function criarRpc(url: string, chaveSecreta: string, fetchFn: typeof fetch = fetch) {
  return async function rpc<T>(nome: string, args: Record<string, unknown> = {}): Promise<T> {
    const resposta = await fetchFn(`${url}/rest/v1/rpc/${nome}`, {
      method: "POST",
      headers: { apikey: chaveSecreta, "Content-Type": "application/json" },
      body: JSON.stringify(args),
    });
    if (!resposta.ok) throw new Error(`${nome} falhou (erro ${resposta.status})`);
    const texto = await resposta.text();
    return (texto ? JSON.parse(texto) : null) as T;
  };
}

export type Rpc = ReturnType<typeof criarRpc>;
