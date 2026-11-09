#!/usr/bin/env node
/**
 * Hook Stop: encadeia as etapas do /plano em sessão de nuvem.
 *
 * Na máquina local quem encadeia é o mod plano-revezamento. Na nuvem plugin não carrega, mas
 * os hooks do `.claude/settings.json` do repositório rodam: este hook faz ali o papel do mod,
 * lendo o mesmo contrato (frontmatter do plano e seção "Ponto de retomada").
 *
 * Como o mod, só age em sessão que está executando o plano. Uma sessão aberta para outra coisa
 * não é sequestrada: o `bootstrap-nuvem.cjs` grava o Ponto de retomada na abertura e este hook só
 * arma quando ele muda, isto é, quando alguém editou o plano nesta sessão.
 *
 * Armado, ao fim de um turno com `revezamento: continuar` ou `investigar` devolve
 * `additionalContext`, que mantém a conversa andando. Se o Ponto de retomada não mudou no turno,
 * insiste uma vez, manda investigar na segunda e para na terceira: nunca fica em laço sem
 * registrar avanço.
 *
 * Fora da nuvem sai em silêncio. Qualquer imprevisto também: um hook que trava o fim do turno
 * por bug próprio custa mais do que uma etapa que não encadeou.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ESTADO = path.join(".claude", ".revezamento-nuvem.json");
const MAX_SEM_AVANCO = 3;

function campo(frontmatter, nome) {
  const m = frontmatter.match(new RegExp(`^${nome}:\\s*(\\S+)`, "m"));
  return m ? m[1] : "";
}

function pontoDeRetomada(texto) {
  const inicio = texto.search(/^## .*Ponto de retomada/m);
  if (inicio < 0) return "";
  const resto = texto.slice(inicio);
  const fim = resto.slice(1).search(/^## /m);
  return fim < 0 ? resto : resto.slice(0, fim + 1);
}

function planoEmAndamento() {
  const dir = path.join("ref", "planos");
  if (!fs.existsSync(dir)) return null;
  for (const nome of fs.readdirSync(dir)) {
    if (!nome.endsWith(".md")) continue;
    const arquivo = path.join(dir, nome);
    const texto = fs.readFileSync(arquivo, "utf8");
    const frontmatter = (texto.match(/^---\r?\n([\s\S]*?)\r?\n---/) || [])[1] || "";
    if (campo(frontmatter, "status") === "em_andamento") {
      const hash = crypto.createHash("sha256").update(pontoDeRetomada(texto)).digest("hex");
      return { arquivo, revezamento: campo(frontmatter, "revezamento"), hash };
    }
  }
  return null;
}

function lerEstado() {
  try {
    return JSON.parse(fs.readFileSync(ESTADO, "utf8"));
  } catch {
    return {};
  }
}

function gravarEstado(estado) {
  fs.writeFileSync(ESTADO, JSON.stringify(estado));
}

/** Chamado na abertura da sessão: registra de onde o plano parte, sem armar nada. */
function marcarLinhaDeBase(sessao) {
  if (lerEstado().sessao === sessao) return; // retomada da mesma sessão mantém o que já valia
  gravarEstado({ sessao, retomada: planoEmAndamento()?.hash ?? "", armado: false, semAvanco: 0 });
}

function seguir(texto) {
  process.stdout.write(
    JSON.stringify({ hookSpecificOutput: { hookEventName: "Stop", additionalContext: texto } }) + "\n",
  );
}

function aoParar(entrada) {
  // Subagente ou comando em segundo plano ainda vai reabrir a conversa: não apressa.
  if ((entrada.background_tasks || []).length > 0) return;

  const plano = planoEmAndamento();
  if (!plano) return;

  const estado = lerEstado();
  if (estado.sessao !== entrada.session_id) {
    gravarEstado({ sessao: entrada.session_id, retomada: plano.hash, armado: false, semAvanco: 0 });
    return;
  }

  const mudou = plano.hash !== estado.retomada;
  if (!estado.armado && !mudou) return; // este turno não tocou no plano

  const semAvanco = mudou ? 0 : estado.semAvanco + 1;
  gravarEstado({ ...estado, retomada: plano.hash, armado: true, semAvanco });

  if (!["continuar", "investigar"].includes(plano.revezamento)) return;
  if (semAvanco >= MAX_SEM_AVANCO) return;

  const caminho = plano.arquivo.replace(/\\/g, "/");
  if (semAvanco === 2 || plano.revezamento === "investigar") {
    seguir(
      `continuar (investigação de causa raiz) — plano ${caminho}. O trabalho não está avançando. Siga o ` +
        "Modo Investigar da skill plano: ache a causa raiz sem repetir o que já falhou, e termine com a " +
        "correção verificada ou com a decisão de que precisa do usuário, fundamentada.",
    );
  } else if (semAvanco === 1) {
    seguir(
      `continuar — o turno anterior terminou sem atualizar o Ponto de retomada de ${caminho}. Retome pelo ` +
        "passo 2 do Modo Executar da skill plano e registre cada avanço no Ponto de retomada.",
    );
  } else {
    seguir(`continuar — plano ${caminho}. Use a skill plano: Modo Executar, a partir do passo 2 (ler leve).`);
  }
}

if (require.main === module) {
  try {
    if (process.env.CLAUDE_CODE_REMOTE === "true") aoParar(JSON.parse(fs.readFileSync(0, "utf8")));
  } catch {
    // sai em silêncio
  }
  process.exit(0);
}

module.exports = { marcarLinhaDeBase };
