// Carrega um script de public/remocao/ como o navegador carregaria (script comum, não módulo)
// e devolve o que ele expõe em module.exports quando roda fora do navegador.
import { readFileSync } from 'node:fs';

export const PASTA = new URL('../../public/remocao/', import.meta.url);

export function carregar(nome) {
  const codigo = readFileSync(new URL(nome, PASTA), 'utf8');
  const module = { exports: {} };
  new Function('module', codigo)(module);
  return module.exports;
}
