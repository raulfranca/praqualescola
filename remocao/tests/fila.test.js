import { test } from 'vitest';
import assert from 'node:assert/strict';
import { carregar, PASTA } from './carregar.js';
const { Nucleo: N } = carregar('assistente.js');

const semEspera = { esperar: async () => {} };

test('emFila é sequencial e reporta progresso', async () => {
  let ativos = 0, pico = 0; const prog = [];
  await N.emFila([1, 2, 3], async () => { pico = Math.max(pico, ++ativos); await null; ativos--; return 'ok'; },
    { esperar: async () => {}, aoProgresso: (f, t) => prog.push(`${f}/${t}`) });
  assert.equal(pico, 1);
  assert.deepEqual(prog, ['1/3', '2/3', '3/3']);
});

test('emFila pausa entre itens, não depois do último', async () => {
  const pausas = [];
  await N.emFila([1, 2, 3], async () => 'ok', { pausaMs: 150, esperar: async ms => { pausas.push(ms); } });
  assert.deepEqual(pausas, [150, 150]);
});

test('emFila isola falhas comuns', async () => {
  const r = await N.emFila([1, 2], async i => { if (i === 1) throw new Error('x'); return i; }, semEspera);
  assert.equal(r.get(1).ok, false);
  assert.equal(r.get(1).erro.message, 'x');
  assert.equal(r.get(2).ok, true);
  assert.equal(r.get(2).valor, 2);
});

test('emFila interrompe em sessão expirada', async () => {
  let chamadas = 0;
  await assert.rejects(N.emFila([1, 2], async () => { chamadas++; throw new Error('sessao-expirada'); }, semEspera), /sessao-expirada/);
  assert.equal(chamadas, 1);
});

test('respostaDoServidor: texto que não é JSON vira sessão expirada', () => {
  assert.throws(() => N.respostaDoServidor('<html><body>Login</body></html>'), /sessao-expirada/);
  assert.deepEqual(N.respostaDoServidor('{"erro":"","data":[{"PROFESSOR":"A","PONTOS":"<center>5</center>"}]}'), [{ nome: 'A', classificacao: 5 }]);
});
