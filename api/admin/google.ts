import { autorizado, json, naoAutorizado, rpcDoServidor } from "../_lib/admin";
import { lerUsoGoogle, unidadesEstimadasRoutes, type CredencialServico } from "../_lib/monitoring";
import { lerEscolas, type ResumoCota } from "../_lib/supabase";

export const config = {
  runtime: "edge",
};

/**
 * GET → uso do mês lido no Google (requisições de Routes, mapa e Places) e a estimativa em unidades da Routes.
 * POST { calibrar: true } → idem, e calibra o nosso contador com a estimativa (nunca diminui).
 */
export default async function handler(req: Request) {
  if (!(await autorizado(req, process.env.PQE_ADMIN_TOKEN_SECRET))) return naoAutorizado();
  if (req.method !== "GET" && req.method !== "POST") return json({ erro: "Use GET ou POST" }, 405);

  let calibrar = false;
  if (req.method === "POST") {
    try {
      calibrar = ((await req.json()) as { calibrar?: unknown })?.calibrar === true;
    } catch {
      return json({ erro: "Corpo inválido" }, 400);
    }
    if (!calibrar) return json({ erro: "Envie { calibrar: true }" }, 400);
  }

  const rpc = rpcDoServidor();
  const credenciais = process.env.GOOGLE_MONITORING_CREDENTIALS;
  const projeto = process.env.GOOGLE_CLOUD_PROJECT;
  if (!rpc || !credenciais || !projeto) return json({ erro: "Leitura do Google não configurada" }, 503);

  try {
    const [uso, escolas] = await Promise.all([
      lerUsoGoogle({ credencial: JSON.parse(credenciais) as CredencialServico, projeto }),
      lerEscolas(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? ""),
    ]);
    const unidadesRoutes = unidadesEstimadasRoutes(uso.requisicoes.routes, escolas.length);
    if (calibrar) await rpc("pqe_calibrar", { p_unidades: unidadesRoutes });
    const resumo = await rpc<ResumoCota>("pqe_resumo");
    return json({ uso, unidadesRoutesEstimadas: unidadesRoutes, calibrado: calibrar, resumo });
  } catch (erro) {
    console.error("Leitura do Google falhou:", erro);
    return json({ erro: "Não foi possível ler o uso no Google" }, 502);
  }
}
