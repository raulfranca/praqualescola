import { test } from 'vitest';
import assert from 'node:assert/strict';
import { carregar, PASTA } from './carregar.js';
const { Nucleo: N } = carregar('assistente.js');

// ---------- Task 1: leitura de textos e números ----------

test('textoDeHtml decodifica entidades e tira tags', () => {
  assert.equal(N.textoDeHtml('<table><td>&nbsp; 0</td></table>'), '0');
  assert.equal(N.textoDeHtml('1&#170; Fase   '), '1ª Fase');
  assert.equal(N.textoDeHtml('A &amp; B &lt;x&gt; &quot;q&quot; &#xE9;'), 'A & B <x> "q" é');
  assert.equal(N.textoDeHtml(null), '');
});

test('numero', () => {
  assert.equal(N.numero('<center>209</center>'), 209);
  assert.equal(N.numero('&nbsp; 0'), 0);
  assert.equal(N.numero('<img class="x">'), null);
});

test('normalizarNome', () => {
  assert.equal(N.normalizarNome('  Ana   Lima '), 'ANA LIMA');
});

test('lerFase', () => {
  assert.equal(N.lerFase('Processo de Remoção - 1º FASE'), 1);
  assert.equal(N.lerFase('Processo de Remoção - 2ª FASE'), 2);
  assert.equal(N.lerFase('Processo de Remoção'), null);
});

test('lerClassificacao', () => {
  assert.equal(N.lerClassificacao('Vínculo: X\nClassificação: 760'), 760);
  assert.equal(N.lerClassificacao('sem nada'), null);
});

test('escolasDaTabela', () => {
  const [e] = N.escolasDaTabela([{ DT_RowData: { REF_ESCOLA: '40' }, escola: '<td>Dulce EM</td>', vagas_real: '<td>1</td>', inscritos: '<td>&nbsp;</td>' }]);
  assert.deepEqual(e, { codigo: '40', nome: 'Dulce EM', vagas: 1, inscritos: null });
});

test('interessadosDaResposta', () => {
  assert.deepEqual(N.interessadosDaResposta({ erro: '', data: [{ PROFESSOR: ' Ana  Lima ', PONTOS: '<center>209</center>' }] }),
    [{ nome: 'ANA LIMA', classificacao: 209 }]);
  assert.throws(() => N.interessadosDaResposta({ erro: 'x', data: [] }), /erro-apus/);
  assert.throws(() => N.interessadosDaResposta('<html>'), /resposta-invalida/);
});

// ---------- Task 2: a conta, o estado do pedido e a comparação ----------

const P = { nome: 'RAUL TESTE', classificacao: 760 };
const EU = { nome: 'RAUL TESTE', classificacao: 760 };

// A: 2 vagas, 649 e (eu?) · B: 1 vaga, 736 · C: 1 vaga, 0 inscritos · D: 0 vagas, 500
function base(o) {
  o = o || {};
  const escolas = [
    { codigo: 'A', nome: 'Escola A', vagas: 2, inscritos: o.semEu ? 1 : 2 },
    { codigo: 'B', nome: 'Escola B', vagas: 1, inscritos: 1 },
    { codigo: 'C', nome: 'Escola C', vagas: 1, inscritos: 0 },
    { codigo: 'D', nome: 'Escola D', vagas: 0, inscritos: 1 }
  ];
  const interessados = new Map([
    ['A', o.semEu ? [{ nome: 'OUTRA', classificacao: 649 }] : [{ nome: 'OUTRA', classificacao: 649 }, EU]],
    ['B', [{ nome: 'FULANO', classificacao: 736 }]],
    ['D', [{ nome: 'BELTRANO', classificacao: 500 }]]
  ]);
  if (o.euTambemEm) interessados.get(o.euTambemEm).push(EU);
  if (o.falha) interessados.set(o.falha, 'falha');
  if (o.extraEm) for (const [cod, lista] of Object.entries(o.extraEm)) {
    escolas.push({ codigo: cod, nome: 'Escola ' + cod, vagas: 1, inscritos: lista.length });
    interessados.set(cod, lista);
  }
  return { professor: P, escolas, interessados, campoEscola: o.campo || '' };
}

test('pedido gravado dentro das vagas', () => {
  const r = N.analisar(base({ campo: 'A' }));
  assert.equal(r.erro, null);
  assert.equal(r.pedido.estado, 'gravado');
  assert.equal(r.pedido.escola.codigo, 'A');
  assert.equal(r.pedido.posicao, 2);
  assert.equal(r.pedido.vagas, 2);
  assert.equal(r.pedido.dentro, true);
});

test('pedido gravado com campo vazio (depois de recarregar) continua gravado', () => {
  assert.equal(N.analisar(base({ campo: '' })).pedido.estado, 'gravado');
});

test('pedido gravado fora das vagas', () => {
  const r = N.analisar(base({ campo: 'B', semEu: true, euTambemEm: 'B' }));
  assert.equal(r.pedido.estado, 'gravado');
  assert.equal(r.pedido.posicao, 2);
  assert.equal(r.pedido.dentro, false);
});

test('oportunidades excluem a escola do pedido e escolas cheias', () => {
  const r = N.analisar(base({ campo: 'A' }));
  assert.deepEqual(r.oportunidades.map(o => o.codigo), ['C']);
});

test('sem pedido, oportunidades ordenadas por folga', () => {
  const r = N.analisar(base({ campo: '', semEu: true }));
  // A: 2 vagas, 1 na frente → 2º (folga 0, justo) · C: 1º de 1 (folga 0)
  assert.deepEqual(r.oportunidades.map(o => [o.codigo, o.posicao, o.justo]), [['A', 2, true], ['C', 1, true]]);
});

test('folga maior vem primeiro', () => {
  const b = base({ campo: '', semEu: true });
  b.escolas.push({ codigo: 'E', nome: 'Escola E', vagas: 3, inscritos: 0 });
  const r = N.analisar(b);
  assert.equal(r.oportunidades[0].codigo, 'E');
  assert.equal(r.oportunidades[0].justo, false);
});

test('selecionado e não gravado', () => {
  const r = N.analisar(base({ campo: 'B', semEu: true }));
  assert.equal(r.pedido.estado, 'nao-gravado');
  assert.equal(r.pedido.escolaCampo.codigo, 'B');
  assert.equal(r.pedido.escolaCampo.nome, 'Escola B');
});

test('trocar: campo diferente do gravado', () => {
  const r = N.analisar(base({ campo: 'C' }));
  assert.equal(r.pedido.estado, 'trocar');
  assert.equal(r.pedido.escola.codigo, 'A');
  assert.equal(r.pedido.escolaCampo.codigo, 'C');
});

test('nenhum pedido', () => {
  const r = N.analisar(base({ campo: '', semEu: true }));
  assert.equal(r.pedido.estado, 'nenhum');
  assert.equal(r.pedido.escola, null);
});

test('inconsistente quando aparece em duas listas', () => {
  assert.equal(N.analisar(base({ campo: 'A', euTambemEm: 'B' })).pedido.estado, 'inconsistente');
});

test('homônimo com outra classificação conta como concorrente', () => {
  const r = N.analisar(base({ campo: '', semEu: true, extraEm: { C2: [{ nome: 'RAUL TESTE', classificacao: 100 }] } }));
  assert.equal(r.pedido.estado, 'nenhum');
  assert.ok(!r.oportunidades.some(o => o.codigo === 'C2'));
});

test('empate de classificação não conta como na frente', () => {
  const r = N.analisar(base({ campo: '', semEu: true, extraEm: { T: [{ nome: 'OUTRO', classificacao: 760 }] } }));
  assert.ok(r.oportunidades.some(o => o.codigo === 'T' && o.posicao === 1));
});

test('escola com falha nunca vira oportunidade', () => {
  const r = N.analisar(base({ campo: '', semEu: true, falha: 'A' }));
  assert.ok(!r.oportunidades.some(o => o.codigo === 'A'));
  assert.deepEqual(r.falhas, ['Escola A']);
});

test('inscritos ilegível: consulta, e sem resposta vira falha', () => {
  const esc = [{ codigo: 'X', nome: 'X', vagas: 1, inscritos: null }];
  assert.equal(N.escolasParaConsultar(esc).length, 1);
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map(), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, ['X']);
});

test('vagas ilegível: escola não vira oportunidade e conta como falha', () => {
  const esc = [{ codigo: 'Y', nome: 'Y', vagas: null, inscritos: 0 }];
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map(), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, ['Y']);
});

test('escolasParaConsultar ignora quem tem 0 inscritos', () => {
  assert.deepEqual(N.escolasParaConsultar(base().escolas).map(e => e.codigo), ['A', 'B', 'D']);
});

test('lidas conta as escolas consultadas com sucesso', () => {
  assert.equal(N.analisar(base({ campo: 'A' })).lidas, 3);
});

test('tabela vazia', () => {
  assert.equal(N.analisar({ professor: P, escolas: [], interessados: new Map(), campoEscola: '' }).erro, 'tabela-vazia');
});

test('compararComAnterior', () => {
  const r = N.analisar(base({ campo: 'A' }));
  const c = N.compararComAnterior(r, { hora: '14h32', pedido: { codigo: 'A', posicao: 1 }, oportunidades: [{ codigo: 'Z', nome: 'EM Santa Rita' }] });
  assert.equal(c.horaAnterior, '14h32');
  assert.equal(c.posicaoAntes, 1);
  assert.deepEqual([...c.novas], ['C']);
  assert.deepEqual(c.sairam, ['EM Santa Rita']);
});

test('compararComAnterior sem leitura anterior', () => {
  const c = N.compararComAnterior(N.analisar(base({ campo: 'A' })), null);
  assert.equal(c.horaAnterior, null);
  assert.equal(c.posicaoAntes, null);
  assert.equal(c.novas.size, 0);
  assert.deepEqual(c.sairam, []);
});

test('compararComAnterior: pedido anterior em outra escola não gera "antes era"', () => {
  const c = N.compararComAnterior(N.analisar(base({ campo: 'A' })), { hora: '1h', pedido: { codigo: 'B', posicao: 1 }, oportunidades: [] });
  assert.equal(c.posicaoAntes, null);
});

test('paraGuardar guarda só o necessário', () => {
  const g = N.paraGuardar(N.analisar(base({ campo: 'A' })), { hora: '15h10' });
  assert.deepEqual(g, { hora: '15h10', pedido: { codigo: 'A', posicao: 2 }, oportunidades: [{ codigo: 'C', nome: 'Escola C' }] });
});

// ---------- Correção: vagas negativas (achado no teste ao vivo de 2026-11-12) ----------

test('numero preserva o sinal negativo', () => {
  assert.equal(N.numero("<table class='grid-td'><tr><td class='grid-td-c1'></td><td class='grid-td-c2'>-2</td></tr></table>"), -2);
});

test('escola com vagas negativas nunca vira oportunidade', () => {
  const esc = [{ codigo: 'N', nome: 'Negativa', vagas: -2, inscritos: 0 }];
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map(), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, []);
});

// ---------- Correções da revisão final ----------

test('concorrente com classificação ilegível: escola vira falha, nunca Entra', () => {
  const esc = [{ codigo: 'K', nome: 'K', vagas: 1, inscritos: 1 }];
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map([['K', [{ nome: 'X', classificacao: null }]]]), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, ['K']);
});

test('tabela diz que há inscritos mas a lista veio vazia: falha', () => {
  const esc = [{ codigo: 'V', nome: 'V', vagas: 1, inscritos: 2 }];
  const r = N.analisar({ professor: P, escolas: esc, interessados: new Map([['V', []]]), campoEscola: '' });
  assert.deepEqual(r.oportunidades, []);
  assert.deepEqual(r.falhas, ['V']);
});

test('não achou o pedido e houve falhas: nao-confirmado, não "nenhum"', () => {
  const r = N.analisar(base({ campo: '', falha: 'A' })); // o professor estava na A, que falhou
  assert.equal(r.pedido.estado, 'nao-confirmado');
});

test('pedido gravado em escola de vagas ilegíveis: dentro desconhecido', () => {
  const b = base({ campo: 'A' });
  b.escolas[0].vagas = null;
  const r = N.analisar(b);
  assert.equal(r.pedido.estado, 'gravado');
  assert.equal(r.pedido.dentro, null);
});

test('número com separador de milhar é ilegível, não 1', () => {
  assert.equal(N.numero('<center>1.023</center>'), null);
  assert.equal(N.lerClassificacao('Classificação: 1.023'), null);
  assert.equal(N.numero('2 vagas. 3'), 2);
});

test('nome compara sem acento', () => {
  assert.equal(N.normalizarNome('Raul França'), N.normalizarNome('RAUL FRANCA'));
  assert.equal(N.textoDeHtml('Jo&atilde;o'), 'João');
});

test('lerPagina recusa página sem período ou sem nome (evita consultar com parâmetro vazio)', () => {
  const { Apus } = carregar('assistente.js');
  const OCULTOS = { pIdDireita: '2027', pCdUsuario: '3536', id_menu: 'abc', usuario_nome: 'raul' };
  function docFalso(campos) {
    const elements = {};
    for (const [k, v] of Object.entries(campos)) elements[k] = { value: v };
    return {
      getElementById: id => (id === 'formEtapa3' ? { elements } : (OCULTOS[id] !== undefined ? { value: OCULTOS[id] } : null)),
      body: { innerText: 'Processo de Remoção - 1º FASE' },
      querySelectorAll: () => [{ innerText: 'Classificação: 760' }]
    };
  }
  const completo = { ddREF_FUNCIONARIO: '3536', ddVIRTUAL_REF_FUNCIONARIO: 'Raul', ddREF_PERIODO: '2027', ddREF_ESCOLA_OPCAO1: '' };
  assert.equal(Apus.lerPagina(docFalso(completo)).fase, 1);
  assert.equal(Apus.lerPagina(docFalso({ ...completo, ddREF_PERIODO: '' })).erro, 'pagina-incompleta');
  assert.equal(Apus.lerPagina(docFalso({ ...completo, ddVIRTUAL_REF_FUNCIONARIO: '' })).erro, 'pagina-incompleta');
});
