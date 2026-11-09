#!/usr/bin/env node
/**
 * Hook SessionStart: prepara a VM de uma sessão de nuvem. Na máquina local sai na hora.
 *
 * Uma sessão de nuvem nasce de um clone limpo: sem dependências instaladas, sem Graphify e sem
 * nada do que mora em ~/.claude. Este hook deixa a VM pronta e conta ao modelo em que ambiente
 * ele está. Etapa que falha vira aviso no contexto, nunca impede a sessão de abrir.
 *
 * Roda: `comandos.instalar` de `.claude/loop.json`, o Graphify, e cada `.claude/scripts/nuvem.d/*.sh`
 * dos módulos (o do Supabase sobe o banco local em segundo plano). O detalhe fica em
 * `.claude/.nuvem.log`.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { marcarLinhaDeBase } = require("./revezamento-nuvem.cjs");

const LOG =path.join(".claude", ".nuvem.log");
const DIR_MODULOS = path.join(".claude", "scripts", "nuvem.d");

function rodar(rotulo, comando) {
  fs.appendFileSync(LOG, `\n=== ${rotulo}: ${comando}\n`);
  const r = spawnSync("bash", ["-c", comando], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  fs.appendFileSync(LOG, `${r.stdout || ""}${r.stderr || ""}\n[saída ${r.status}]\n`);
  return r.status === 0;
}

if (process.env.CLAUDE_CODE_REMOTE !== "true") process.exit(0);

try {
  marcarLinhaDeBase(JSON.parse(fs.readFileSync(0, "utf8")).session_id);
} catch {
  // sem linha de base o encadeamento só arma na segunda edição do plano
}

const avisos = [];
let loop = {};
try {
  loop = JSON.parse(fs.readFileSync(path.join(".claude", "loop.json"), "utf8").replace(/^\uFEFF/, ""));
} catch {
  avisos.push("`.claude/loop.json` ausente ou inválido: dependências não foram instaladas.");
}

const comandos = loop.comandos || {};
// A nuvem tem proxy, e o Bun tem problema conhecido com ele: `instalar_nuvem` é o plano B.
if (comandos.instalar && !rodar("dependências", comandos.instalar)) {
  const ok = comandos.instalar_nuvem && rodar("dependências (plano B)", comandos.instalar_nuvem);
  if (!ok) avisos.push(`Falhou instalar as dependências (\`${comandos.instalar}\`). Veja ${LOG}.`);
}

const local = path.join(process.env.HOME || "", ".local", "bin");
process.env.PATH = `${local}${path.delimiter}${process.env.PATH}`;
if (process.env.CLAUDE_ENV_FILE) fs.appendFileSync(process.env.CLAUDE_ENV_FILE, `export PATH="${local}:$PATH"\n`);
const graphify =
  rodar("graphify", "command -v graphify || uv tool install graphifyy || pip install --quiet graphifyy") &&
  rodar("grafo", "graphify update .");
if (!graphify) avisos.push(`Graphify indisponível nesta sessão: use busca comum. Veja ${LOG}.`);

if (fs.existsSync(DIR_MODULOS)) {
  for (const nome of fs.readdirSync(DIR_MODULOS).filter((n) => n.endsWith(".sh")).sort()) {
    if (!rodar(`módulo ${nome}`, `bash ${path.posix.join(".claude/scripts/nuvem.d", nome)}`)) {
      avisos.push(`O preparo \`${nome}\` falhou. Veja ${LOG}.`);
    }
  }
}

const texto = [
  "Ambiente: sessão de NUVEM (Linux, shell Bash). Vale a coluna \"nuvem\" do AGENTS.md.",
  "O trabalho só está salvo depois do push: envie a branch da sessão ao fechar cada etapa.",
  "O /plano encadeia pelo hook Stop; o mod plano-revezamento não existe aqui, e isso é normal.",
  ...avisos.map((a) => `AVISO: ${a}`),
].join("\n");

process.stdout.write(
  JSON.stringify({ hookSpecificOutput: { hookEventName: "SessionStart", additionalContext: texto } }) + "\n",
);
process.exit(0);
