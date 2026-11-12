import { test } from 'vitest';
import assert from 'node:assert/strict';
import { carregar, PASTA } from './carregar.js';
const { Nucleo: N, Apus } = carregar('assistente.js');

// Lista de escolas lida direto de server_processing.info.php, sem passar pela tabela da tela.

const linha = (cod, vagas, insc) => ({
  DT_RowData: { REF_ESCOLA: cod }, escola: '<td>Escola ' + cod + '</td>', vagas_real: '<td>' + vagas + '</td>', inscritos: '<td>' + insc + '</td>'
});

test('parametrosEscolas: pede todas as escolas, sem filtro, com os dados do professor', () => {
  const p = N.parametrosEscolas({ periodo: '2027', fase: 1, funcionario: '3536', idMenu: 'abc', usuario: 'raul' });
  assert.equal(p.length, -1);
  assert.equal(p.start, 0);
  assert.equal(p['search[value]'], '');
  assert.equal(p.ref_periodo, '2027');
  assert.equal(p.remocaoFase, '1');
  assert.equal(p.ref_funcionario, '3536');
  assert.equal(p.id_menu, 'abc');
  assert.equal(p.usuario_nome, 'raul');
  assert.equal(p['columns[1][data]'], 'vagas_real');
  assert.equal(p['columns[3][data]'], 'inscritos');
});

test('escolasDaResposta: lê as escolas do JSON do servidor', () => {
  const texto = JSON.stringify({ error: '', recordsTotal: 2, recordsFiltered: 2, data: [linha('40', 1, 3), linha('41', -2, 0)] });
  const escolas = N.escolasDaResposta(texto);
  assert.deepEqual(escolas.map(e => [e.codigo, e.vagas, e.inscritos]), [['40', 1, 3], ['41', -2, 0]]);
});

test('escolasDaResposta: página de login no lugar do JSON = sessão expirada', () => {
  assert.throws(() => N.escolasDaResposta('<html>Login</html>'), /sessao-expirada/);
});

test('escolasDaResposta: erro informado pela APUS', () => {
  assert.throws(() => N.escolasDaResposta(JSON.stringify({ error: 'Fase encerrada', data: [] })), /erro-apus/);
});

test('escolasDaResposta: menos escolas do que o total = lista incompleta', () => {
  const texto = JSON.stringify({ error: '', recordsTotal: 66, recordsFiltered: 66, data: [linha('40', 1, 3)] });
  assert.throws(() => N.escolasDaResposta(texto), /tabela-incompleta/);
});

test('escolasDaResposta: sem escolas = tabela vazia; formato estranho = inválida', () => {
  assert.throws(() => N.escolasDaResposta(JSON.stringify({ error: '', recordsTotal: 0, data: [] })), /tabela-vazia/);
  assert.throws(() => N.escolasDaResposta(JSON.stringify({ ok: true })), /resposta-invalida/);
});

test('escolasDaResposta: escola sem código é ilegível, não vira "undefined"', () => {
  const sem = linha('40', 1, 3); delete sem.DT_RowData;
  const texto = JSON.stringify({ error: '', recordsTotal: 1, data: [sem] });
  assert.equal(N.escolasDaResposta(texto)[0].codigo, null);
});

function docFalso(campos, ocultos, texto) {
  const elements = {};
  for (const [k, v] of Object.entries(campos)) elements[k] = { value: v };
  return {
    getElementById: id => (id === 'formEtapa3' ? { elements } : (id in ocultos ? { value: ocultos[id] } : null)),
    body: { innerText: texto },
    querySelectorAll: () => [{ innerText: 'Classificação: 760' }]
  };
}
const campos = { ddREF_FUNCIONARIO: '3536', ddVIRTUAL_REF_FUNCIONARIO: 'Raul', ddREF_PERIODO: '2027', ddREF_ESCOLA_OPCAO1: '' };
const ocultos = { remocaoFase: '2', pIdDireita: '2027', pCdUsuario: '3536', id_menu: 'abc', usuario_nome: 'raul' };

test('lerPagina: fase vem do campo da APUS, não do texto da tela', () => {
  const p = Apus.lerPagina(docFalso(campos, ocultos, 'Processo de Remoção'));
  assert.equal(p.fase, 2);
  assert.deepEqual(p.consulta, { periodo: '2027', fase: 2, funcionario: '3536', idMenu: 'abc', usuario: 'raul' });
});

test('lerPagina: sem o campo de fase, usa o texto; sem os dois, não há fase', () => {
  const sem = { ...ocultos }; delete sem.remocaoFase;
  assert.equal(Apus.lerPagina(docFalso(campos, sem, 'Processo de Remoção - 1º FASE')).fase, 1);
  assert.equal(Apus.lerPagina(docFalso(campos, sem, 'Processo de Remoção')).erro, 'sem-fase');
});

test('lerPagina: sem os campos da consulta de escolas = página incompleta', () => {
  const sem = { ...ocultos }; delete sem.id_menu;
  assert.equal(Apus.lerPagina(docFalso(campos, sem, '')).erro, 'pagina-incompleta');
});

test('escola sem código: não é consultada e conta como falha, nunca como oportunidade', () => {
  const P = { nome: 'RAUL', classificacao: 10, codigo: '1' };
  const esc = [{ codigo: null, nome: 'Sem Código', vagas: 3, inscritos: 0 }];
  assert.deepEqual(N.escolasParaConsultar([{ codigo: null, nome: 'Z', vagas: 1, inscritos: 2 }]), []);
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map(), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, ['Sem Código']);
});
