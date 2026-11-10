// IP de quem chamou, guardado só como hash (SHA-256 com segredo): nunca em claro.

export function ipDaRequisicao(req: Request): string {
  const encaminhado = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return encaminhado || req.headers.get("x-real-ip") || "desconhecido";
}

export async function hashDoIp(ip: string, segredo: string): Promise<string> {
  const dados = new TextEncoder().encode(`${segredo}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", dados);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}
