#!/usr/bin/env node
// Confere se este repositório está pronto para o loop, na máquina e na nuvem.
//   OK  certo     !!  falta algo, mas não impede     XX  problema: sai com erro
//
// O ponto central é a nuvem: uma sessão remota parte de um clone limpo, então o que não estiver
// commitado, para ela, não existe.

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

let problemas = 0;
const ok = (m) => console.log(`OK ${m}`);
const aviso = (m) => console.log(`!! ${m}`);
const erro = (m) => {
  problemas++;
  console.log(`XX ${m}`);
};

// O `Out-File -Encoding utf8` do PowerShell 5.1 grava BOM, que o JSON.parse recusa.
const lerJson = (f) => JSON.parse(readFileSync(f, "utf8").replace(/^\uFEFF/, ""));
const git = (...a) => spawnSync("git", a, { encoding: "utf8" });
const nuvem = process.env.CLAUDE_CODE_REMOTE === "true";

// ---- configuração do loop
let loop = null;
try {
  loop = lerJson(".claude/loop.json");
  ok("loop.json válido");
} catch {
  erro(".claude/loop.json ausente ou inválido");
}
const comandos = loop?.comandos ?? {};
const modulos = loop?.modulos ?? [];
for (const c of ["lint", "testes"]) {
  if (!comandos[c]) aviso(`loop.json sem comando "${c}": o portão não vai verificar isso`);
}
if (!comandos.instalar) aviso('loop.json sem comando "instalar": a nuvem vai abrir sem dependências');
if (modulos.includes("web") && !comandos.e2e) erro('módulo web sem comando "e2e" em loop.json');

// ---- nada por preencher
for (const f of ["AGENTS.md", "ref/PRD.md", "ref/DOC.md", ".claude/loop.json", ".mcp.json", "playwright.config.ts"]) {
  if (existsSync(f) && /\{\{[A-Z_]+\}\}/.test(readFileSync(f, "utf8"))) erro(`${f} ainda tem {{marcador}} por preencher`);
}

// ---- hooks apontam para arquivos que existem
const settings = existsSync(".claude/settings.json") ? lerJson(".claude/settings.json") : {};
const usados = Object.values(settings.hooks ?? {}).flat().flatMap((g) => g.hooks ?? []);
for (const { command } of usados) {
  const arquivo = command?.match(/\.claude\/hooks\/[\w.-]+/)?.[0];
  if (arquivo && !existsSync(arquivo)) erro(`hook aponta para arquivo que não existe: ${arquivo}`);
}
if (usados.some((h) => h.command?.includes("revezamento-nuvem"))) ok("hook de encadeamento da nuvem configurado");
else erro("settings.json sem o hook Stop revezamento-nuvem: o /plano não encadeia na nuvem");

// ---- segredos
if (existsSync(".mcp.json")) {
  const texto = readFileSync(".mcp.json", "utf8");
  if (/sbp_[a-z0-9]{10}|Bearer\s+(?!\$\{)[\w.-]{10}/i.test(texto)) erro(".mcp.json tem token escrito: nunca faça commit disto");
  else ok(".mcp.json sem token escrito");
}

// ---- o que a nuvem precisa ver
const essenciais = [
  "AGENTS.md",
  "CLAUDE.md",
  ".claude/settings.json",
  ".claude/loop.json",
  ".claude/skills/plano/SKILL.md",
  ".claude/hooks/bootstrap-nuvem.cjs",
  ".claude/hooks/revezamento-nuvem.cjs",
  ".claude/scripts/portao.mjs",
];
if (modulos.includes("supabase")) essenciais.push(".mcp.json", ".claude/skills/migrations-supabase/SKILL.md");

if (git("rev-parse", "--is-inside-work-tree").status !== 0) {
  erro("não é um repositório git");
} else {
  for (const f of essenciais) {
    if (git("check-ignore", "-q", f).status === 0) erro(`${f} está no .gitignore: a nuvem não vai enxergar`);
    else if (git("ls-files", "--error-unmatch", f).status !== 0) aviso(`${f} ainda não foi commitado`);
  }
  const branches = git("branch", "--list", "--all", "--format=%(refname:short)").stdout;
  for (const b of ["main", "dev"]) {
    if (!new RegExp(`(^|/)${b}$`, "m").test(branches)) aviso(`branch ${b} não existe`);
  }
  if (!git("remote").stdout.trim()) aviso("sem remoto: publique no GitHub para a nuvem alcançar o repositório");
}

// ---- skills de terceiros que os módulos esperam
const terceiros = { design: "frontend-design", supabase: "supabase-postgres-best-practices" };
for (const [modulo, skill] of Object.entries(terceiros)) {
  if (modulos.includes(modulo) && !existsSync(`.claude/skills/${skill}/SKILL.md`)) {
    erro(`módulo ${modulo} sem a skill ${skill} em .claude/skills/: ela não chega à nuvem`);
  }
}

// ---- só na máquina
if (!nuvem) {
  if (!existsSync("graphify-out/graph.json")) aviso("grafo ausente: rode `graphify update .`");
  const instalados = join(homedir(), ".claude", "plugins", "installed_plugins.json");
  if (!existsSync(instalados) || !readFileSync(instalados, "utf8").includes("plano-revezamento@")) {
    aviso("mod plano-revezamento não instalado nesta máquina: o /plano não encadeia aqui");
  }
}

console.log(problemas ? `CONFERÊNCIA: ${problemas} problema(s)` : "CONFERÊNCIA: PRONTO");
process.exit(problemas ? 1 : 0);
