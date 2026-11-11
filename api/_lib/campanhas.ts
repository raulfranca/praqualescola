// Campanhas (remoção, atribuição) gravadas em `praqualescola.campanhas`. Lógica pura, sem rede:
// estado de cada campanha para o painel e validação do que o painel pode editar.

/** A campanha no ar, como `pqe_campanha_no_ar()` devolve. `vagas` traz só as escolas com vaga (> 0). */
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

/** Uma campanha como `pqe_campanhas_admin()` devolve. */
export interface CampanhaDoBanco {
  id: string;
  nome: string;
  descricao: string;
  inicio: string;
  fim: string;
  ligada: boolean;
  arquivada: boolean;
  fonte: string | null;
  atualizada_em: string;
  escolas_na_lista: number;
  escolas_com_vaga: number;
  total_vagas: number;
  maiores: { nome_na_fonte: string; codigo_inep: string; vagas: number }[];
}

export type EstadoCampanha = "no_ar" | "agendada" | "desligada" | "encerrada";

export interface CampanhaAdmin extends CampanhaDoBanco {
  estado: EstadoCampanha;
}

/** Encerrada depois do fim; antes disso, desligada se o interruptor está desligado; senão agendada ou no ar.
 *  Mesmo critério do banco: o instante do fim ainda conta como no ar. */
export function estadoDaCampanha(
  c: Pick<CampanhaDoBanco, "inicio" | "fim" | "ligada">,
  agora: Date,
): EstadoCampanha {
  const t = agora.getTime();
  if (t > Date.parse(c.fim)) return "encerrada";
  if (!c.ligada) return "desligada";
  if (t < Date.parse(c.inicio)) return "agendada";
  return "no_ar";
}

export interface EdicaoCampanha {
  id: string;
  nome: string;
  descricao: string;
  inicio: string;
  fim: string;
  ligada: boolean;
}

const dataValida = (v: unknown): v is string => typeof v === "string" && !Number.isNaN(Date.parse(v));

/** Confere o corpo de uma edição do painel. Erros em português: o painel mostra como vêm. */
export function validarEdicao(corpo: unknown): { dados: EdicaoCampanha } | { erro: string } {
  const c = (corpo ?? {}) as Record<string, unknown>;
  if (typeof c.id !== "string" || !c.id) return { erro: "Campanha não informada." };
  if (typeof c.nome !== "string" || !c.nome.trim()) return { erro: "O nome não pode ficar vazio." };
  if (c.descricao !== undefined && typeof c.descricao !== "string") return { erro: "Descrição inválida." };
  if (!dataValida(c.inicio)) return { erro: "Data de início inválida." };
  if (!dataValida(c.fim)) return { erro: "Data de fim inválida." };
  if (Date.parse(c.fim) <= Date.parse(c.inicio)) return { erro: "O fim precisa ser depois do início." };
  if (typeof c.ligada !== "boolean") return { erro: "Informe se a campanha está ligada." };
  return {
    dados: {
      id: c.id,
      nome: c.nome.trim(),
      descricao: (c.descricao as string | undefined)?.trim() ?? "",
      inicio: c.inicio,
      fim: c.fim,
      ligada: c.ligada,
    },
  };
}
