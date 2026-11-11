import { autorizado, json, naoAutorizado, rpcDoServidor } from "../_lib/admin";
import { estadoDaCampanha, validarEdicao, type CampanhaAdmin, type CampanhaDoBanco } from "../_lib/campanhas";
import { ErroRpc, type Rpc } from "../_lib/supabase";

export const config = {
  runtime: "edge",
};

async function listar(rpc: Rpc) {
  const agora = new Date();
  const campanhas = (await rpc<CampanhaDoBanco[] | null>("pqe_campanhas_admin")) ?? [];
  return {
    campanhas: campanhas.map((c): CampanhaAdmin => ({ ...c, estado: estadoDaCampanha(c, agora) })),
    agora: agora.toISOString(),
  };
}

/** GET → lista. POST `{ acao: "editar", id, nome, descricao, inicio, fim, ligada }`
 *  ou `{ acao: "arquivar", id, arquivada }` → aplica e devolve a lista atualizada. */
export default async function handler(req: Request) {
  if (!(await autorizado(req, process.env.PQE_ADMIN_TOKEN_SECRET))) return naoAutorizado();
  const rpc = rpcDoServidor();
  if (!rpc) return json({ erro: "Painel não configurado" }, 503);

  try {
    if (req.method === "POST") {
      let corpo: Record<string, unknown>;
      try {
        corpo = ((await req.json()) ?? {}) as Record<string, unknown>;
      } catch {
        return json({ erro: "Corpo inválido" }, 400);
      }
      if (corpo.acao === "editar") {
        const v = validarEdicao(corpo);
        if ("erro" in v) return json({ erro: v.erro }, 400);
        const d = v.dados;
        await rpc("pqe_campanha_atualizar", {
          p_id: d.id,
          p_nome: d.nome,
          p_descricao: d.descricao,
          p_inicio: d.inicio,
          p_fim: d.fim,
          p_ligada: d.ligada,
        });
      } else if (corpo.acao === "arquivar") {
        if (typeof corpo.id !== "string" || !corpo.id) return json({ erro: "Campanha não informada." }, 400);
        if (typeof corpo.arquivada !== "boolean") return json({ erro: "arquivada deve ser verdadeiro ou falso" }, 400);
        await rpc("pqe_campanha_arquivar", { p_id: corpo.id, p_arquivada: corpo.arquivada });
      } else {
        return json({ erro: "Ação desconhecida" }, 400);
      }
    } else if (req.method !== "GET") {
      return json({ erro: "Use GET ou POST" }, 405);
    }
    return json(await listar(rpc));
  } catch (erro) {
    if (erro instanceof ErroRpc && erro.mensagemBanco) return json({ erro: erro.mensagemBanco }, 400);
    console.error("Campanhas indisponíveis:", erro);
    return json({ erro: "Campanhas indisponíveis" }, 503);
  }
}
