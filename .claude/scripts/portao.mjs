#!/usr/bin/env node
// Portão de verificação do loop: roda os comandos de `.claude/loop.json` e devolve uma linha por
// verificação, mostrando o fim da saída só do que falhou. É a única forma de verificar neste
// repositório, para que as skills não precisem saber qual é a stack do projeto.
//
//   node .claude/scripts/portao.mjs              lint + tipos + testes
//   node .claude/scripts/portao.mjs --build      + build
//   node .claude/scripts/portao.mjs --e2e <tag>  + e2e só dos cenários @<tag>
//   node .claude/scripts/portao.mjs --final      + build + e2e completo
//
// Comando vazio em loop.json significa "não se aplica a este projeto" e aparece como pulado.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const LINHAS_DE_FALHA = 25;

function argumentos(argv) {
  const opcoes = { build: false, e2e: false, tag: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--final") opcoes.build = opcoes.e2e = true;
    else if (argv[i] === "--build") opcoes.build = true;
    else if (argv[i] === "--e2e") {
      opcoes.e2e = true;
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) opcoes.tag = argv[++i];
    } else {
      console.error(`Opção desconhecida: ${argv[i]}`);
      process.exit(2);
    }
  }
  return opcoes;
}

function etapas(comandos, opcoes) {
  const lista = [
    ["lint", comandos.lint],
    ["tipos", comandos.tipos],
    ["testes", comandos.testes],
  ];
  if (opcoes.build) lista.push(["build", comandos.build]);
  if (opcoes.e2e) {
    const comTag = comandos.e2e_tag?.replaceAll("{tag}", opcoes.tag ?? "");
    lista.push(["e2e", opcoes.tag ? comTag : comandos.e2e]);
  }
  return lista;
}

const opcoes = argumentos(process.argv.slice(2));
// O `Out-File -Encoding utf8` do PowerShell 5.1 grava BOM, que o JSON.parse recusa.
const { comandos = {} } = JSON.parse(readFileSync(".claude/loop.json", "utf8").replace(/^\uFEFF/, ""));

let falhou = false;
for (const [nome, comando] of etapas(comandos, opcoes)) {
  if (!comando) {
    console.log(`-  ${nome}: pulado (sem comando em loop.json)`);
    continue;
  }
  const inicio = Date.now();
  const r = spawnSync(comando, { shell: true, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  if (r.status === 0) {
    console.log(`OK ${nome} (${segundos}s)`);
    continue;
  }
  falhou = true;
  console.log(`XX ${nome} FALHOU (saída ${r.status ?? r.signal}, ${segundos}s): ${comando}`);
  const saida = `${r.stdout ?? ""}${r.stderr ?? ""}`.trimEnd().split(/\r?\n/);
  console.log(saida.slice(-LINHAS_DE_FALHA).join("\n"));
}

console.log(falhou ? "PORTÃO: FALHOU" : "PORTÃO: VERDE");
process.exit(falhou ? 1 : 0);
