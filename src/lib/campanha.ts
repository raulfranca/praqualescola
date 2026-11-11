// Campanha no ar (remoção, atribuição), lida de `/api/campanha`. Lógica pura, sem rede nem React.
import type { School } from "@/types/school";

/** O que `/api/campanha` devolve (espelha `CampanhaNoAr` de `api/_lib/campanhas.ts`).
 *  `vagas` traz só as escolas com vaga (> 0), pelo código INEP. */
export interface CampanhaNoAr {
  id: string;
  nome: string;
  descricao: string;
  inicio: string;
  fim: string;
  fonte: string | null;
  vagas: Record<string, number>;
  escolas_com_vaga: number;
  total_vagas: number;
}

/** Aceita só uma campanha bem formada; qualquer outra coisa vira "sem campanha". */
export function lerCampanha(corpo: unknown): CampanhaNoAr | null {
  const c = (corpo as { campanha?: unknown } | null)?.campanha as Partial<CampanhaNoAr> | null | undefined;
  if (!c || typeof c.id !== "string" || typeof c.nome !== "string") return null;
  if (!c.vagas || typeof c.vagas !== "object") return null;
  return c as CampanhaNoAr;
}

/** Preenche `vacancies` só nas escolas cujo INEP está na campanha; sem campanha, nenhuma escola tem `vacancies`. */
export function aplicarVagas(escolas: School[], campanha: CampanhaNoAr | null): School[] {
  return escolas.map((e) => {
    const { vacancies: _antigo, ...resto } = e;
    const vagas = campanha?.vagas[e.id];
    return vagas === undefined ? resto : { ...resto, vacancies: vagas };
  });
}

/** Tem vaga = número positivo. */
export const temVaga = (e: Pick<School, "vacancies">): boolean => (e.vacancies ?? 0) > 0;

const partesBrasilia = (iso: string) => {
  const p = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return { dia: v("day"), mes: v("month"), hora: Number(v("hour")), minuto: v("minute") };
};

/** Fim da campanha no horário de Brasília, por extenso: "13 de novembro, às 7h" (ou "às 7h30"). */
export function fimPorExtenso(iso: string): string {
  const { dia, mes, hora, minuto } = partesBrasilia(iso);
  return `${dia} de ${mes}, às ${hora}h${minuto === "00" ? "" : minuto}`;
}

/** Fim da campanha no horário de Brasília, curto: "13/11". */
export function fimCurto(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit" }).format(
    new Date(iso),
  );
}

/** Data e hora em Brasília, curta: "12/11, 6h" (ou "6h30"). Usada no painel. */
export function dataHoraCurta(iso: string): string {
  const { hora, minuto } = partesBrasilia(iso);
  return `${fimCurto(iso)}, ${hora}h${minuto === "00" ? "" : minuto}`;
}

/** Valor para `<input type="datetime-local">` no horário de Brasília: "2026-11-12T06:00". */
export function paraCampoBrasilia(iso: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const v = (t: string) => p.find((x) => x.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}

/** Valor de `<input type="datetime-local">` digitado em Brasília → ISO com fuso (-03:00; sem horário de verão
 *  desde 2019). Campo vazio ou malformado → null. */
export function deCampoBrasilia(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(valor)) return null;
  const iso = `${valor}:00-03:00`;
  return Number.isNaN(Date.parse(iso)) ? null : iso;
}

/** O filtro "Só com vagas" só vale com campanha no ar: ligado numa sessão anterior, não esconde escolas sem campanha. */
export const filtroVagasAtivo = (somenteComVagas: boolean, haCampanha: boolean): boolean =>
  somenteComVagas && haCampanha;
