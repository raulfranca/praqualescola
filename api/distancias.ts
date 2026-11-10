import { calcularDistancias, dentroDePinda } from "./_lib/distancias";
import { ipDaRequisicao } from "./_lib/ip";

export const config = {
  runtime: "edge",
};

const json = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ erro: "Use POST" }, 405);

  let corpo: { lat?: unknown; lng?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return json({ erro: "Corpo inválido" }, 400);
  }
  const { lat, lng } = corpo ?? {};
  if (!dentroDePinda(lat, lng)) return json({ erro: "Coordenadas fora de Pindamonhangaba" }, 400);

  try {
    const resposta = await calcularDistancias({
      lat: lat as number,
      lng: lng as number,
      ip: ipDaRequisicao(req),
      env: {
        supabaseUrl: process.env.VITE_SUPABASE_URL,
        chavePublica: process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        chaveSecreta: process.env.SUPABASE_SECRET_KEY,
        chaveGoogle: process.env.GOOGLE_ROUTES_API_KEY,
        segredoHash: process.env.PQE_HASH_SECRET,
      },
    });
    return json(resposta);
  } catch (erro) {
    // Só chega aqui sem a lista de escolas; o app cai na estimativa local.
    console.error("Distâncias indisponíveis:", erro);
    return json({ erro: "Escolas indisponíveis" }, 503);
  }
}
