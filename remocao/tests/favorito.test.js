import { test } from 'vitest';
import assert from 'node:assert/strict';
import { carregar, PASTA } from './carregar.js';
const { favorito } = carregar('favorito.js');

// Ambiente falso: o mínimo de location/document que o favorito usa.
function fake(hostname, pathname) {
  const scripts = [];
  const avisos = [];
  const el = tag => ({
    tagName: tag, style: {}, dataset: {}, textContent: '',
    setAttribute() {}, remove() {}, appendChild() {}
  });
  const doc = {
    documentElement: { dataset: {} },
    getElementById: () => null,
    createElement: el,
    body: {
      appendChild(n) {
        if (n.tagName === 'script') scripts.push(n); else avisos.push(n);
      }
    }
  };
  return { loc: { hostname, pathname, href: `https://${hostname}${pathname}` }, doc, agora: 123, esperar: fn => fn(), base: 'https://exemplo.test/remocao/', janela: {}, scripts, avisos };
}

test('fora da APUS vai para o login', () => {
  const a = fake('www.google.com', '/');
  assert.equal(favorito(a), 'login');
  assert.equal(a.loc.href, 'https://educ.apus.info/professor/pinda');
  assert.match(a.avisos[0].textContent, /login da APUS/);
});

test('na APUS fora da remoção vai para a remoção', () => {
  const a = fake('educ.apus.info', '/profWeb/menu/');
  assert.equal(favorito(a), 'remocao');
  assert.equal(a.loc.href, 'https://educ.apus.info/profWeb/atribRemocao/');
  assert.match(a.avisos[0].textContent, /clique de novo em Assistente de Remoção/);
});

test('na remoção injeta o script uma vez', () => {
  const a = fake('educ.apus.info', '/profWeb/atribRemocao/');
  a.esperar = () => {}; // o carregamento ainda não terminou nem estourou o tempo
  assert.equal(favorito(a), 'carregar');
  assert.equal(favorito(a), 'carregar');
  assert.equal(a.scripts.length, 1);
  assert.equal(a.scripts[0].src, 'https://exemplo.test/remocao/assistente.js?v=123');
});

test('com assistente presente, reabre', () => {
  const a = fake('educ.apus.info', '/profWeb/atribRemocao/index.php');
  let abriu = 0;
  a.janela.AssistenteRemocao = { abrir: () => { abriu++; } };
  assert.equal(favorito(a), 'reabrir');
  assert.equal(abriu, 1);
  assert.equal(a.scripts.length, 0);
});

test('a função não depende de nada de fora (vai virar texto no link)', () => {
  const texto = favorito.toString();
  assert.match(texto, /^function favorito\(/);
  assert.match(texto, /__BASE__/);
});

test('se o script não carregar, avisa e libera nova tentativa', () => {
  const a = fake('educ.apus.info', '/profWeb/atribRemocao/');
  let estourar;
  a.esperar = (fn, ms) => { if (ms === 8000) estourar = fn; };
  favorito(a);
  estourar();
  assert.match(a.avisos[a.avisos.length - 1].textContent, /Não consegui carregar o assistente/);
  assert.equal(a.doc.documentElement.dataset.assistenteRemocao, undefined);
  favorito(a);
  assert.equal(a.scripts.length, 2);
});

test('o link montado pela página avalia para undefined (senão o navegador troca a página pelo texto)', async () => {
  const { readFileSync } = await import('node:fs');
  const html = readFileSync(new URL('index.html', PASTA), 'utf8');
  const m = html.match(/var codigo = (.+);\r?\n/);
  assert.ok(m, 'linha "var codigo = ..." não encontrada em index.html');
  const montar = new Function('favorito', 'base', 'return ' + m[1] + ';');
  const codigo = montar(function favorito() { return 'carregar'; }, 'https://x/');
  assert.equal(eval(codigo), undefined);
  // controle: sem o void, o mesmo código devolveria o texto (o defeito que este teste pega)
  assert.equal(eval(codigo.replace(/^void /, '')), 'carregar');
});
