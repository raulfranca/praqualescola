import { json, rpcDoServidor } from "./_lib/admin";
import type { CampanhaNoAr } from "./_lib/campanhas";

export const config = {
  runtime: "edge",
};

const CACHE = "public, s-maxage=60, stale-while-revalidate=300";

const resposta = (campanha: CampanhaNoAr | null) => {
  const r = json({ campanha });
  r.headers.set("Cache-Control", CACHE);
  return r;
};

/** GET → `{ campanha }`: a campanha no ar ou `null`. Qualquer falha também vira `null`: o app abre sem campanha. */
export default async function handler(req: Request) {
  if (req.method !== "GET") return json({ erro: "Use GET" }, 405);
  const rpc = rpcDoServidor();
  if (!rpc) return resposta(null);
  try {
    return resposta(await rpc<CampanhaNoAr | null>("pqe_campanha_no_ar"));
  } catch (erro) {
    console.error("Campanha indisponível:", erro);
    return resposta(null);
  }
}
