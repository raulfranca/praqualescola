import type { School } from "@/types/school";

/**
 * Leitura das escolas e turmas do Supabase "Dados" da SME (schema `dados_gerais`).
 * Só leitura, pela API REST com a chave pública (publishable).
 */

export interface LinhaEscola {
  codigo_inep: string;
  tipo: string;
  nome: string;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  telefone: string | null;
  setor: number | null;
  secretaria_polo: string | null;
  terceirizada: string | null;
  ativa: boolean;
  observacao: string | null;
}

export interface LinhaTurma {
  codigo_inep: string;
  codigo_inep_local: string;
  etapa: string;
  nome_turma: string;
  ano_letivo: number;
}


type Nivel = "bercario" | "infantil1" | "infantil2" | "pre1" | "pre2" | "ano1" | "ano2" | "ano3" | "ano4" | "ano5";

const NIVEL_POR_ETAPA: Record<string, Nivel> = {
  bercario: "bercario",
  infantil_1: "infantil1",
  infantil_2: "infantil2",
  pre_1: "pre1",
  pre_2: "pre2",
  ano_1: "ano1",
  ano_2: "ano2",
  ano_3: "ano3",
  ano_4: "ano4",
  ano_5: "ano5",
};

/** Um pedaço do nome de turma multisseriada ("Pré I", "Pré II", "2º", "3º ano") → nível. */
function nivelDoNome(parte: string): Nivel | undefined {
  const p = parte.trim().toLowerCase();
  const pre = p.match(/^pré\s+(i{1,2})\b/);
  if (pre) return pre[1] === "i" ? "pre1" : "pre2";
  const ano = p.match(/^([1-5])º/);
  if (ano) return `ano${ano[1]}` as Nivel;
  return undefined;
}

function niveisDaTurma(turma: LinhaTurma): Nivel[] {
  if (turma.etapa !== "multisseriada") {
    const nivel = NIVEL_POR_ETAPA[turma.etapa];
    return nivel ? [nivel] : [];
  }
  const partes = turma.nome_turma.split("/");
  const niveis = partes.map(nivelDoNome);
  if (niveis.some((n) => !n)) {
    console.warn(`Turma multisseriada não reconhecida: "${turma.nome_turma}" (${turma.codigo_inep})`);
    return [];
  }
  return niveis as Nivel[];
}

export function montarEscolas(escolas: LinhaEscola[], turmas: LinhaTurma[]): School[] {
  const anoAtual = Math.max(...turmas.map((t) => t.ano_letivo));
  const doAno = turmas.filter((t) => t.ano_letivo === anoAtual);

  return escolas.map((e) => {
    const escola: School = {
      id: e.codigo_inep,
      type: e.tipo,
      name: e.nome,
      address: e.endereco ?? "",
      cep: e.cep ?? "",
      phone: e.telefone ?? "",
      extension: undefined,
      neighborhood: e.bairro ?? "",
      lat: Number(e.latitude),
      lng: Number(e.longitude),
      sector: e.setor == null ? "" : String(e.setor),
      polo: e.secretaria_polo ?? "",
      outsourced: e.terceirizada ?? undefined,
      bercario: 0,
      infantil1: 0,
      infantil2: 0,
      pre1: 0,
      pre2: 0,
      ano1: 0,
      ano2: 0,
      ano3: 0,
      ano4: 0,
      ano5: 0,
      active: e.ativa,
    };

    const hostedAt: string[] = [];
    for (const t of doAno) {
      if (t.codigo_inep !== e.codigo_inep) continue;
      for (const nivel of niveisDaTurma(t)) escola[nivel] = (escola[nivel] ?? 0) + 1;
      if (t.codigo_inep_local !== e.codigo_inep && !hostedAt.includes(t.codigo_inep_local)) {
        hostedAt.push(t.codigo_inep_local);
      }
    }
    if (hostedAt.length) escola.hostedAt = hostedAt.sort();
    return escola;
  });
}

export async function buscarDadosEscolas(
  url: string,
  chave: string,
  fetchFn: typeof fetch = fetch,
): Promise<{ escolas: LinhaEscola[]; turmas: LinhaTurma[] }> {
  const headers = { apikey: chave, "Accept-Profile": "dados_gerais" };
  const buscar = async <T>(caminho: string, nome: string): Promise<T> => {
    const resposta = await fetchFn(`${url}/rest/v1/${caminho}`, { headers });
    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar ${nome} (erro ${resposta.status}).`);
    }
    return resposta.json() as Promise<T>;
  };
  const [escolas, turmas] = await Promise.all([
    buscar<LinhaEscola[]>("escolas?select=*&order=nome", "as escolas"),
    buscar<LinhaTurma[]>(
      "turmas?select=codigo_inep,codigo_inep_local,etapa,nome_turma,ano_letivo",
      "as turmas",
    ),
  ]);
  return { escolas, turmas };
}
