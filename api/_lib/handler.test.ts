import { afterEach, describe, expect, it, vi } from "vitest";
import handler from "../distancias";

const ESCOLAS = [{ codigo_inep: "A", latitude: -22.92, longitude: -45.46 }];

const post = (corpo: unknown) =>
  new Request("http://localhost/api/distancias", { method: "POST", body: JSON.stringify(corpo) });

describe("POST /api/distancias", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sem chaves de ambiente: 200 com estimativas", async () => {
    vi.stubEnv("VITE_SUPABASE_URL", "https://exemplo.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "pub");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("GOOGLE_ROUTES_API_KEY", "");
    vi.stubEnv("PQE_HASH_SECRET", "");
    const fetchFalso = vi.fn(async () => new Response(JSON.stringify(ESCOLAS)));
    vi.stubGlobal("fetch", fetchFalso);

    const r = await handler(post({ lat: -22.925, lng: -45.465 }));
    expect(r.status).toBe(200);
    const corpo = await r.json();
    expect(corpo.estado).toBe("aproximado");
    expect(corpo.distancias.A.aproximado).toBe(true);
    expect(fetchFalso).toHaveBeenCalledTimes(1);
  });

  it("recusa coordenada fora de Pindamonhangaba e método errado", async () => {
    expect((await handler(post({ lat: -23.55, lng: -46.63 }))).status).toBe(400);
    expect((await handler(new Request("http://localhost/api/distancias"))).status).toBe(405);
  });
});
