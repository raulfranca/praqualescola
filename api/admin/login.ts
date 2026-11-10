import {
  JANELA_LOGIN_MS,
  MAX_TENTATIVAS_LOGIN,
  emitirToken,
  json,
  rpcDoServidor,
  textosIguais,
} from "../_lib/admin";
import { hashDoIp, ipDaRequisicao } from "../_lib/ip";

export const config = {
  runtime: "edge",
};

/** POST { senha } → { token, expiraEm }. Até 5 tentativas por IP a cada 15 min. */
export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ erro: "Use POST" }, 405);

  const senhaCerta = process.env.PQE_ADMIN_PASSWORD;
  const segredoToken = process.env.PQE_ADMIN_TOKEN_SECRET;
  const segredoHash = process.env.PQE_HASH_SECRET;
  const rpc = rpcDoServidor();
  if (!senhaCerta || !segredoToken || !segredoHash || !rpc) return json({ erro: "Painel não configurado" }, 503);

  let senha: unknown;
  try {
    senha = ((await req.json()) as { senha?: unknown })?.senha;
  } catch {
    return json({ erro: "Corpo inválido" }, 400);
  }

  // Toda tentativa conta, certa ou errada: o limite vale antes de conferir a senha.
  const agora = Date.now();
  let dentroDoLimite: boolean;
  try {
    dentroDoLimite = await rpc<boolean>("pqe_limite", {
      p_hash: await hashDoIp(ipDaRequisicao(req), segredoHash),
      p_janela: `login:${Math.floor(agora / JANELA_LOGIN_MS)}`,
      p_maximo: MAX_TENTATIVAS_LOGIN,
    });
  } catch (erro) {
    console.error("Limite de login indisponível:", erro);
    return json({ erro: "Painel indisponível" }, 503);
  }
  if (!dentroDoLimite) return json({ erro: "Muitas tentativas. Espere 15 minutos." }, 429);

  if (typeof senha !== "string" || !(await textosIguais(senha, senhaCerta))) {
    return json({ erro: "Senha incorreta" }, 401);
  }
  const token = await emitirToken(segredoToken, agora);
  return json({ token, expiraEm: Number(token.split(".")[0]) });
}
