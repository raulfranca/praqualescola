import { COTA_MENSAL, LIMIAR_ECONOMIA, TETO_MENSAL, estadoDaCota } from "../../src/lib/cota";
import { autorizado, json, naoAutorizado, rpcDoServidor } from "../_lib/admin";
import { lerEscolas, type ResumoCota } from "../_lib/supabase";

export const config = {
  runtime: "edge",
};

/** Resumo da cota e estado atual, com os limiares usados. */
async function montarPainel(rpc: NonNullable<ReturnType<typeof rpcDoServidor>>) {
  const url = process.env.VITE_SUPABASE_URL!;
  const [resumo, escolas] = await Promise.all([
    rpc<ResumoCota>("pqe_resumo"),
    lerEscolas(url, process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ""),
  ]);
  return {
    resumo,
    estado: estadoDaCota({
      unidades: resumo.unidades,
      custoEndereco: escolas.length,
      modoForcado: resumo.modo_forcado === true,
    }),
    escolas: escolas.length,
    cota: COTA_MENSAL,
    economiaAPartirDe: LIMIAR_ECONOMIA,
    teto: TETO_MENSAL,
  };
}

/** GET → painel. POST { modoForcado: boolean } → liga/desliga o modo aproximado forçado. */
export default async function handler(req: Request) {
  if (!(await autorizado(req, process.env.PQE_ADMIN_TOKEN_SECRET))) return naoAutorizado();
  const rpc = rpcDoServidor();
  if (!rpc) return json({ erro: "Painel não configurado" }, 503);

  try {
    if (req.method === "POST") {
      let modoForcado: unknown;
      try {
        modoForcado = ((await req.json()) as { modoForcado?: unknown })?.modoForcado;
      } catch {
        return json({ erro: "Corpo inválido" }, 400);
      }
      if (typeof modoForcado !== "boolean") return json({ erro: "modoForcado deve ser verdadeiro ou falso" }, 400);
      await rpc("pqe_config_definir", { p_chave: "modo_forcado", p_valor: modoForcado });
    } else if (req.method !== "GET") {
      return json({ erro: "Use GET ou POST" }, 405);
    }
    return json(await montarPainel(rpc));
  } catch (erro) {
    console.error("Painel indisponível:", erro);
    return json({ erro: "Painel indisponível" }, 503);
  }
}
