#!/usr/bin/env node
/**
 * PreToolUse (Bash, PowerShell, Read, Glob): lembra de consultar o grafo do Graphify antes de
 * varrer o código. Só fala quando `graphify-out/graph.json` existe. É um lembrete, nunca um
 * bloqueio: qualquer imprevisto sai em silêncio.
 */

const fs = require("fs");

const LEMBRETE =
  "graphify-out/graph.json exists. For architecture / module-relationship / data-flow / dependency / " +
  'change-impact questions, prefer graphify first: `graphify query "<question>"`, `graphify explain ' +
  '"<symbol()>"`, `graphify affected "<symbol()>"`, or `graphify path "<A>" "<B>"`. Read raw files once ' +
  "oriented, or to edit/debug specific lines. Applies to subagents too.";

const CODIGO = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|rb|c|cpp|cs|php|sh|md)$/i;
const BUSCA = /\b(grep|rg|ripgrep|find|fd|ack|ag|select-string)\b/i;

function vale(ferramenta, entrada) {
  if (ferramenta === "Bash" || ferramenta === "PowerShell") return BUSCA.test(entrada.command || "");
  const alvo = entrada.file_path || entrada.pattern || "";
  return CODIGO.test(alvo) && !alvo.replace(/\\/g, "/").includes("graphify-out/");
}

try {
  if (!fs.existsSync("graphify-out/graph.json")) process.exit(0);
  const { tool_name: ferramenta, tool_input: entrada = {} } = JSON.parse(fs.readFileSync(0, "utf8"));
  if (vale(ferramenta, entrada)) {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: "PreToolUse", additionalContext: LEMBRETE } }) + "\n",
    );
  }
} catch {
  // lembrete não derruba o fluxo
}
process.exit(0);
