import type { Page } from "@playwright/test";
import type { LinhaEscola, LinhaTurma } from "../../src/lib/escolasSupabase";

// Recorte real do Supabase "Dados" da SME (schema dados_gerais), copiado em 2026-11-10.
// O e2e nunca chama o Supabase real: `interceptarSupabase` responde com estes dados.
// CAIC (inativo, turmas sediadas em outros prédios), Abdias, CMEI Lucineia e CMEI Jonas Abib.

export const ESCOLAS: LinhaEscola[] = [
  {
    "codigo_inep": "35073179",
    "tipo": "EM",
    "nome": "Abdias Júnior Santiago e Silva",
    "endereco": "Rua João Maria Pires, 30",
    "bairro": "Santa Cecília",
    "cep": "12411-680",
    "latitude": -22.93172,
    "longitude": -45.43367,
    "telefone": "3648-3922",
    "setor": 10,
    "secretaria_polo": "Castolira",
    "terceirizada": null,
    "ativa": true,
    "observacao": null
  },
  {
    "codigo_inep": "35234990",
    "tipo": "CMEI",
    "nome": "CAIC",
    "endereco": "Rua Cássio Pires Salgado, 150",
    "bairro": "Araretama",
    "cep": "12426-270",
    "latitude": -22.950117,
    "longitude": -45.4975,
    "telefone": "3645-5111",
    "setor": 3,
    "secretaria_polo": "Nova Esperança",
    "terceirizada": null,
    "ativa": false,
    "observacao": "Prédio desativado. O atendimento está sendo feito no CMEI Lucineia, no CMEI Jonas Abib e na EM Aníbal Ferreira."
  },
  {
    "codigo_inep": "35010839",
    "tipo": "CMEI",
    "nome": "Jonas Abib, Mons.",
    "endereco": "Rua Adilson Augusto Bassanello Pereira, 141",
    "bairro": "Arco-Íris",
    "cep": "12426-020",
    "latitude": -22.954,
    "longitude": -45.50048,
    "telefone": "3550-0352",
    "setor": 3,
    "secretaria_polo": "Nova Esperança",
    "terceirizada": "Letras Iguais",
    "ativa": true,
    "observacao": "Código não consta no Catálogo INEP (35 + CIE)."
  },
  {
    "codigo_inep": "35010633",
    "tipo": "CMEI",
    "nome": "Lucineia Cristiani Marcelo do Amaral Carvalho",
    "endereco": "Rua João do Amaral, 68",
    "bairro": "Araretama",
    "cep": "12423-580",
    "latitude": -22.947624,
    "longitude": -45.500731,
    "telefone": "3550-0292",
    "setor": 3,
    "secretaria_polo": "Nova Esperança",
    "terceirizada": "Casa Girassol",
    "ativa": true,
    "observacao": null
  }
];

export const TURMAS: LinhaTurma[] = [
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"bercario","nome_turma":"Berçário A","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"bercario","nome_turma":"Berçário B","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"bercario","nome_turma":"Berçário C","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_1","nome_turma":"Infantil I A","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_1","nome_turma":"Infantil I B","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_1","nome_turma":"Infantil I C","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_2","nome_turma":"Infantil II A","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_2","nome_turma":"Infantil II B","ano_letivo":2027},
  {"codigo_inep":"35010633","codigo_inep_local":"35010633","etapa":"infantil_2","nome_turma":"Infantil II C","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"bercario","nome_turma":"Berçário A","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"bercario","nome_turma":"Berçário B","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"bercario","nome_turma":"Berçário C","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_1","nome_turma":"Infantil I A","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_1","nome_turma":"Infantil I B","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_2","nome_turma":"Infantil II A","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_2","nome_turma":"Infantil II B","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_2","nome_turma":"Infantil II C","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"infantil_2","nome_turma":"Infantil II D","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"pre_1","nome_turma":"Pré I A","ano_letivo":2027},
  {"codigo_inep":"35010839","codigo_inep_local":"35010839","etapa":"pre_2","nome_turma":"Pré II A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_1","nome_turma":"1º ano A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_1","nome_turma":"1º ano B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_1","nome_turma":"1º ano C","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_2","nome_turma":"2º ano A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_2","nome_turma":"2º ano B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_2","nome_turma":"2º ano C","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_3","nome_turma":"3º ano A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_3","nome_turma":"3º ano B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_3","nome_turma":"3º ano C","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_4","nome_turma":"4º ano A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_4","nome_turma":"4º ano B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_5","nome_turma":"5º ano A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"ano_5","nome_turma":"5º ano B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"pre_2","nome_turma":"Pré II A","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"pre_2","nome_turma":"Pré II B","ano_letivo":2027},
  {"codigo_inep":"35073179","codigo_inep_local":"35073179","etapa":"pre_2","nome_turma":"Pré II C","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35010633","etapa":"bercario","nome_turma":"Berçário A","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35010633","etapa":"infantil_1","nome_turma":"Infantil I A","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35010633","etapa":"infantil_2","nome_turma":"Infantil II A","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35010839","etapa":"pre_1","nome_turma":"Pré I A","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_1","nome_turma":"Pré I B","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_1","nome_turma":"Pré I C","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_1","nome_turma":"Pré I D","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35010839","etapa":"pre_2","nome_turma":"Pré II A","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_2","nome_turma":"Pré II B","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_2","nome_turma":"Pré II C","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_2","nome_turma":"Pré II D","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_2","nome_turma":"Pré II E","ano_letivo":2027},
  {"codigo_inep":"35234990","codigo_inep_local":"35191644","etapa":"pre_2","nome_turma":"Pré II F","ano_letivo":2027},
];

/** Responde aos pedidos à API REST do Supabase com a fixture (ou com um status de erro). */
export async function interceptarSupabase(page: Page, status = 200) {
  await page.route("**/rest/v1/**", (rota) => {
    if (status !== 200) return rota.fulfill({ status, body: "erro simulado" });
    const url = rota.request().url();
    const corpo = url.includes("/rest/v1/escolas") ? ESCOLAS : url.includes("/rest/v1/turmas") ? TURMAS : [];
    return rota.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(corpo) });
  });
}

/** Marca o aparelho como já migrado, para o recomeço não apagar o que o teste prepara. */
export async function marcarMigrado(page: Page) {
  await page.addInitScript(() => localStorage.setItem("school-data-version", "supabase"));
}
