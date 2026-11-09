#!/usr/bin/env node
/**
 * PreToolUse guard para Edit/Write em CHANGELOG.md.
 *
 * Regra (AGENTS.md §Changelog): versões numeradas `[0.x.y]` são imutáveis — toda
 * entrada nova vai no bloco `[Unreleased]`, no topo. A regra é texto, e texto pode
 * ser ignorado: em 04/08/2026 uma entrada nova foi registrada renomeando o cabeçalho
 * `## [0.11.6]` de volta para `## [Unreleased]`, apagando do arquivo uma versão que
 * já estava na main e em produção.
 *
 * O guard congela o arquivo do primeiro cabeçalho `## [x.y.z]` para baixo. Em vez de
 * adivinhar a intenção da edição, ele simula o resultado e verifica se o trecho
 * congelado sobreviveu intacto. Isso libera sozinho tudo que é legítimo — escrever no
 * `[Unreleased]`, criar o `[Unreleased]` acima da última versão, fechar uma release
 * renomeando `[Unreleased]` → `[0.x.y]` — e barra qualquer coisa que reescreva o
 * passado.
 *
 * Não há destravamento: corrigir uma versão já lançada é decisão do usuário, feita à
 * mão. Escopo deliberado: só Edit/Write. Escrita por shell não passa por aqui.
 *
 * Saída JSON conforme contrato PreToolUse: deny bloqueia, exit 0 sem saída libera.
 */

const fs = require("fs");
const path = require("path");

function liberar() {
  process.exit(0);
}

function bloquear(motivo) {
  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: motivo,
      },
    }) + "\n",
  );
  process.exit(0);
}

// Qualquer imprevisto (payload estranho, arquivo ilegível) libera: um guard que
// derruba o fluxo por bug próprio custa mais do que o erro que ele previne.
let payload;
try {
  payload = JSON.parse(fs.readFileSync(0, "utf8"));
} catch {
  liberar();
}

const ferramenta = payload.tool_name;
const entrada = payload.tool_input || {};
const arquivo = entrada.file_path;

if (!arquivo || path.basename(arquivo).toLowerCase() !== "changelog.md") liberar();

let bruto;
try {
  bruto = fs.readFileSync(arquivo, "utf8");
} catch {
  liberar(); // arquivo ainda não existe: não há passado a proteger
}

// O CHANGELOG.md está em CRLF e a ferramenta Edit casa `old_string` em LF. Sem
// normalizar os dois lados, a simulação nunca encontra o trecho e o guard passa a
// liberar tudo em silêncio — que é a pior falha possível para um guard.
const paraLf = (s) => String(s).replace(/\r\n/g, "\n");

const conteudo = paraLf(bruto);
const inicio = conteudo.search(/^## \[\d+\.\d+\.\d+\]/m);
if (inicio < 0) liberar(); // nenhuma versão lançada ainda

const congelado = conteudo.slice(inicio);

let resultado;
if (ferramenta === "Write") {
  resultado = paraLf(entrada.content ?? "");
} else if (ferramenta === "Edit") {
  const velho = paraLf(entrada.old_string ?? "");
  const novo = paraLf(entrada.new_string ?? "");
  if (!velho || !conteudo.includes(velho)) liberar(); // a própria Edit vai falhar
  // Função no lugar de string evita que `$&` e afins em `novo` virem substituição.
  resultado = entrada.replace_all
    ? conteudo.split(velho).join(novo)
    : conteudo.replace(velho, () => novo);
} else {
  liberar();
}

if (resultado.endsWith(congelado)) liberar();

bloquear(
  "Edicao bloqueada: versoes ja lancadas do CHANGELOG.md sao imutaveis (AGENTS.md). " +
    "Do primeiro cabecalho '## [x.y.z]' para baixo o arquivo e congelado, e esta alteracao " +
    "mudaria esse trecho. Para registrar algo novo, escreva dentro do bloco '## [Unreleased]' " +
    "no topo; se ele nao existir, crie-o ACIMA do primeiro cabecalho de versao, reproduzindo " +
    "esse cabecalho intacto no new_string. Para fechar uma versao, ancore a edicao apenas na " +
    "linha '## [Unreleased]'. Corrigir o conteudo de uma versao ja publicada nao passa por " +
    "aqui: avise o usuario para editar a mao.",
);
