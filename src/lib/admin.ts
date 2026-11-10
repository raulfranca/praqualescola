// Sessão e chamadas do painel /admin. O token vem de /api/admin/login e vale algumas horas;
// fica só nesta aba (sessionStorage) e some ao fechá-la.
import type { EstadoCota } from "@/lib/cota";

const SESSAO_KEY = "pqe-admin";

interface Sessao {
  token: string;
  expiraEm: number;
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

export interface Painel {
  resumo: ResumoCota;
  estado: EstadoCota;
  escolas: number;
  cota: number;
  economiaAPartirDe: number;
  teto: number;
}

export interface ConferenciaGoogle {
  uso: { desde: string; ate: string; requisicoes: { routes: number; mapas: number; places: number } };
  unidadesRoutesEstimadas: number;
  calibrado: boolean;
  resumo: ResumoCota;
}

/** Erro de uma chamada ao painel, com o status HTTP (401 = sessão vencida ou senha errada). */
export class ErroAdmin extends Error {
  constructor(public status: number, mensagem: string) {
    super(mensagem);
  }
}

function lerSessao(agora = Date.now()): Sessao | null {
  try {
    const sessao = JSON.parse(sessionStorage.getItem(SESSAO_KEY) ?? "null") as Sessao | null;
    return sessao && typeof sessao.token === "string" && sessao.expiraEm > agora ? sessao : null;
  } catch {
    return null;
  }
}

/** Há sessão válida do painel nesta aba (isenta do limite de endereços por dia). */
export function temSessaoAdmin(agora = Date.now()): boolean {
  return lerSessao(agora) !== null;
}

export function encerrarSessaoAdmin(): void {
  sessionStorage.removeItem(SESSAO_KEY);
}

async function chamar<T>(caminho: string, init: RequestInit = {}, comToken = true): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (comToken) {
    const sessao = lerSessao();
    if (!sessao) throw new ErroAdmin(401, "Sessão encerrada");
    headers.set("Authorization", `Bearer ${sessao.token}`);
  }
  const resposta = await fetch(caminho, { ...init, headers });
  const corpo = (await resposta.json().catch(() => ({}))) as T & { erro?: string };
  if (!resposta.ok) {
    if (resposta.status === 401 && comToken) encerrarSessaoAdmin();
    throw new ErroAdmin(resposta.status, corpo.erro ?? "Falha no painel");
  }
  return corpo;
}

/** Confere a senha no servidor e guarda o token. Lança ErroAdmin (401 senha, 429 bloqueio). */
export async function entrarAdmin(senha: string): Promise<void> {
  const sessao = await chamar<Sessao>(
    "/api/admin/login",
    { method: "POST", body: JSON.stringify({ senha }) },
    false,
  );
  sessionStorage.setItem(SESSAO_KEY, JSON.stringify({ token: sessao.token, expiraEm: sessao.expiraEm }));
}

export const lerPainel = () => chamar<Painel>("/api/admin/painel");

export const definirModoForcado = (modoForcado: boolean) =>
  chamar<Painel>("/api/admin/painel", { method: "POST", body: JSON.stringify({ modoForcado }) });

export const conferirGoogle = () => chamar<ConferenciaGoogle>("/api/admin/google");

export const calibrarContador = () =>
  chamar<ConferenciaGoogle>("/api/admin/google", { method: "POST", body: JSON.stringify({ calibrar: true }) });
