/**
 * Recomeço do aparelho na troca para o cadastro da SME (Supabase): os ids das escolas mudaram,
 * então favoritos, endereço de casa e distâncias guardados viram lixo e são apagados uma vez.
 */

const MARCA = "school-data-version";
const VALOR_MARCA = "supabase";
const CHAVES = ["school-favorites", "home-location", "school-distances", "addressSetDate"];
const PREFIXO_CACHE = "cachedDistances_";

/** Apaga os dados antigos uma única vez. Devolve `true` só se havia algo para apagar. */
export function recomecarAparelho(storage: Storage): boolean {
  if (storage.getItem(MARCA) === VALOR_MARCA) return false;

  const apagar = CHAVES.filter((c) => storage.getItem(c) !== null);
  for (let i = 0; i < storage.length; i++) {
    const chave = storage.key(i);
    if (chave?.startsWith(PREFIXO_CACHE)) apagar.push(chave);
  }
  for (const chave of apagar) storage.removeItem(chave);

  storage.setItem(MARCA, VALOR_MARCA);
  return apagar.length > 0;
}
