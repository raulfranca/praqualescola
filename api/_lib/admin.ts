// Autenticação do painel /admin: senha conferida no servidor e token HMAC-SHA256 com validade.
// Formato do token: `<expiração em ms>.<assinatura base64url>`. Sem dependências.

import { criarRpc, type Rpc } from "./supabase";

export const VALIDADE_TOKEN_MS = 8 * 60 * 60 * 1000;
export const MAX_TENTATIVAS_LOGIN = 5;
export const JANELA_LOGIN_MS = 15 * 60 * 1000;

const codificador = new TextEncoder();

function base64url(bytes: Uint8Array): string {
  let binario = "";
  for (const b of bytes) binario += String.fromCharCode(b);
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(segredo: string, texto: string): Promise<Uint8Array> {
  const chave = await crypto.subtle.importKey(
    "raw",
    codificador.encode(segredo),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", chave, codificador.encode(texto)));
}

function bytesIguais(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diferenca = 0;
  for (let i = 0; i < a.length; i++) diferenca |= a[i] ^ b[i];
  return diferenca === 0;
}

/** Compara dois textos em tempo constante (os dois viram SHA-256 antes: mesmo tamanho). */
export async function textosIguais(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest("SHA-256", codificador.encode(a)),
    crypto.subtle.digest("SHA-256", codificador.encode(b)),
  ]);
  return bytesIguais(new Uint8Array(ha), new Uint8Array(hb));
}

export async function emitirToken(segredo: string, agora = Date.now()): Promise<string> {
  const expira = String(agora + VALIDADE_TOKEN_MS);
  return `${expira}.${base64url(await hmac(segredo, expira))}`;
}

export async function tokenValido(token: string, segredo: string, agora = Date.now()): Promise<boolean> {
  const [expira, assinatura, ...resto] = token.split(".");
  if (!expira || !assinatura || resto.length > 0 || !/^\d+$/.test(expira)) return false;
  const esperada = base64url(await hmac(segredo, expira));
  const assinaturaOk = bytesIguais(codificador.encode(assinatura), codificador.encode(esperada));
  return assinaturaOk && Number(expira) > agora;
}

/** Confere o header `Authorization: Bearer <token>`. Sem segredo configurado, ninguém entra. */
export async function autorizado(req: Request, segredo: string | undefined, agora = Date.now()) {
  const token = req.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
  if (!segredo || !token) return false;
  return tokenValido(token, segredo, agora);
}

export const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export const naoAutorizado = () => json({ erro: "Não autorizado" }, 401);

/** Funções `pqe_*` com a chave secreta; `null` se o servidor não estiver configurado. */
export function rpcDoServidor(): Rpc | null {
  const url = process.env.VITE_SUPABASE_URL;
  const chave = process.env.SUPABASE_SECRET_KEY;
  return url && chave ? criarRpc(url, chave) : null;
}
