# Instruções para Agentes de IA

Este documento é a **fonte canônica de regras** para qualquer agente de IA que atue neste repositório. Agentes Claude Code: este arquivo é importado via `@AGENTS.md` no `CLAUDE.md`.

## Documentos de referência

| Documento | Conteúdo |
|---|---|
| `ref/PRD.md` | **Fonte da verdade funcional** — o que o sistema deve fazer |
| `ref/DOC.md` | **Documentação técnica** — stack, dados, infra, convenções, estado de implementação |
| `.claude/loop.json` | **Comandos do projeto** — instalar, lint, tipos, testes, build, e2e |

Consulte o PRD e o DOC antes de qualquer alteração de funcionalidade ou schema.

**Regra: nunca recuperar de memória ou supor regras, funções, nomes de campos ou trechos de código.** A cada nova sessão, leia diretamente do código-fonte ou da documentação antes de afirmar como algo funciona. Se a informação já foi lida e confirmada **na conversa atual**, pode reutilizá-la sem reler.

### Planos ativos vs. planos concluídos

**Planos ativos (`ref/planos/*.md`, `status: em_andamento`) são para seguir.** Descrevem o trabalho em curso. Ao executar uma etapa, o plano é a instrução.

**Planos concluídos (`ref/planos/concluidos/`) NÃO são fonte de verdade.** Descrevem o que se pretendia *naquele momento*. O que o sistema **é** está no código; o que ele **deve ser** está no PRD/DOC. Nunca cite um plano concluído como autoridade: ao achar divergência, o plano é que está desatualizado. Eles servem para entender intenção e histórico.

---

## Visão geral do projeto

PWA para professores da rede municipal de Pindamonhangaba verem as escolas no mapa, compararem distância e tempo de deslocamento a partir de casa e organizarem suas prioridades em remoção, formação de sede e atribuição.

---

## Estilo de resposta

- Seja conciso. Sem explicações desnecessárias.
- Tarefas simples: execute diretamente, sem comentar o que fez.
- Tarefas complexas: pense antes de agir, explique apenas o essencial.
- Sem frases de enchimento ("Claro!", "Ótimo!", "Vou fazer isso agora...").

---

## Ambiente: máquina local e nuvem

Este repositório roda nos dois lugares, com as mesmas regras e skills. Uma sessão de nuvem tem `CLAUDE_CODE_REMOTE=true`, e o hook de abertura avisa.

| | Máquina local | Nuvem (Claude Code remoto) |
|---|---|---|
| Sistema e shell | Windows, ferramenta `PowerShell` | Linux, ferramenta `Bash` |
| O que está disponível | Tudo | Só o que está **commitado** neste repositório |
| Encadeamento do `/plano` | Mod `plano-revezamento` | Hook `Stop` (`.claude/hooks/revezamento-nuvem.cjs`) |
| Salvar o trabalho | Fica no disco; commit e push são do usuário | **Commit e push da branch da sessão ao fechar cada etapa**: a VM pode ser recolhida |
| Publicar | `git-deploy` | Workflow `publicar.yml` (ver *Fluxo de git*) |

**Na máquina local (Windows):** sintaxe PowerShell; sem `&&`, use `; if ($?) { ... }`; strings multilinha via `@'...'@`; variáveis com `$env:VAR`.

**Na nuvem:** não há `~/.claude` nem nada instalado à mão. O que precisa existir lá precisa estar commitado aqui. Comandos do GitHub: `gh api` e subcomandos REST funcionam; `gh pr` e `gh issue` não, porque usam GraphQL, que o proxy recusa.

**Comandos do projeto** estão em `.claude/loop.json`. Verificar é sempre:

```
node .claude/scripts/portao.mjs              # lint + tipos + testes
node .claude/scripts/portao.mjs --e2e <tag>  # + cenários de interface @<tag>
node .claude/scripts/portao.mjs --final      # + build + e2e completo
```

---

## Fluxo de git

Branches permanentes: `dev` (integração) e `main` (produção). Trabalho novo nasce em branch própria.

| Passo | Máquina local | Nuvem |
|---|---|---|
| Abrir branch | `branch-open <nome>` | A sessão costuma nascer numa branch própria; se começar na `main` ou na `dev`, crie `claude/<assunto>` antes de commitar |
| Salvar | `git-com "msg"` | Commit e push da branch da sessão |
| Integrar na `dev` | `git-merge "msg"` | Só quando o usuário pedir: merge na `dev` e push |
| Publicar na `main` | `git-deploy "msg"` | Só quando o usuário pedir: `gh api -X POST repos/{owner}/{repo}/actions/workflows/publicar.yml/dispatches -f ref=dev` |

**Publicar é sempre decisão do usuário.** Nunca faça push na `main` nem dispare `publicar.yml` por conta própria. Na máquina local, commit e push também são do usuário.

---

## Changelog

`CHANGELOG.md` segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e [Semantic Versioning](https://semver.org/lang/pt-BR/).

**Regra: sempre atualizar `CHANGELOG.md` ao concluir uma tarefa.** Escreva em linguagem natural para leitores não-técnicos. Entram as mudanças visíveis **e** as estruturais do aplicativo (desempenho, banco, segurança, infraestrutura), descritas pelo efeito. Ficam de fora só as ferramentas do agente: `AGENTS.md`/`CLAUDE.md`, skills, hooks, configuração do editor.

**Versões numeradas (`[0.x.y]`) são imutáveis — nunca as edite.** Toda entrada nova vai no bloco `[Unreleased]`, no topo. Um hook bloqueia edição do que já foi lançado. Use as seções `Adicionado`, `Corrigido`, `Alterado`, `Removido`. Ajustes feitos durante a construção de uma feature atualizam o bullet existente.

**Concluir uma tarefa inclui rodar o portão.** Toda mudança que afeta o que aparece ou acontece na tela termina com o fluxo exercitado num navegador real, por um teste e2e que fica no repositório. Relate no fim o que foi exercitado e o que não foi.

---

## Agenda de manutenção

`.github/maintenance.yml` é a agenda de itens com **data previsível de revisão**. Um workflow mensal abre uma Issue quando um prazo se aproxima.

**Regra: ao concluir uma tarefa que introduz algo com prazo ou revisão futura conhecida, adicione um item.** Casos típicos: dependência com fim de suporte, decisão provisória, flag temporária ou workaround. Cada item: `id`, `titulo`, `due` (YYYY-MM-DD), `alert_days`, e quando útil `link` e `acao`. Ao resolver, remova.

---

## Documentação técnica (`ref/DOC.md`)

**Regra: ao concluir uma tarefa que altere schema, estrutura de diretórios, fluxo de dados, infraestrutura ou convenções, atualize `ref/DOC.md` na mesma tarefa.** Mantenha-o enxuto: descreva padrões uma vez, não enumere cada arquivo.

<!-- settler:modulo:web -->

---

## Teste de interface

Toda mudança que afeta o que aparece ou acontece na tela termina com o fluxo exercitado num navegador real, depois do portão.

- **Playwright (`e2e/`):** o cenário vira um teste em arquivo, que fica no repositório como proteção contra regressão. Roda sem janela, com servidor próprio em porta separada, sem encostar no servidor de desenvolvimento do usuário.
- **Tags:** cada cenário leva `@<funcionalidade>`. Rode só os afetados: `node .claude/scripts/portao.mjs --e2e <tag>`. Leia o resultado e abra só a captura do teste que falhou (`test-results/`).
- **Navegador:** na máquina, o Chrome instalado; na nuvem, o Chrome da VM, por `CHROME_PATH`. O `playwright.config.ts` já trata os dois.
- **Ambiente:** sempre local. Nunca homologação nem produção.
- **O teste:** reproduza o fluxo real (clicar, preencher, salvar) e confira o resultado na tela. Em correção de bug, veja o teste falhar antes da correção e passar depois.

<!-- settler:modulo:design -->

---

## Design system e trabalho de UI

**Para qualquer tarefa que crie ou modifique interface**, invoque a skill `frontend-design` **antes** de escrever markup ou estilos, com `args` apontando para `design-system/README.md`. Onde a skill e o design system discordarem, vale o design system.

**Fonte de verdade: o repositório.** O que a tela é está no código; as regras estão em `design-system/`.

**Canvas ou código?** Abra um canvas, pela skill `mock-canvas`, quando há decisão visual a tomar antes de construir: comparar variações, tela nova sem padrão no app, ou quando o usuário pedir. Vá direto ao código quando a mudança segue um padrão que o app já tem.

**Mock implementado não fica no repositório.** O rascunho vive no canvas; depois de construído, a referência é a própria tela.

<!-- settler:modulos -->

---

## Regras obrigatórias

### 1. Consultar o PRD antes de alterar funcionalidades

Leia `ref/PRD.md` antes de implementar, modificar ou remover qualquer feature. Não implemente nada que contradiga o PRD sem antes sinalizar ao usuário.

### 2. Sinalizar contradições antes de agir

Se a instrução contradiz algo no PRD:

> ⚠️ **Contradição identificada:** A instrução solicita X, mas o PRD (seção Y) define Z. Qual deve prevalecer?

### 3. Nunca ignorar regras de negócio implícitas

O PRD contém regras interdependentes. Avalie impactos laterais antes de implementar.

### 4. Segredos

Nenhum segredo vai para o repositório: nem token, nem senha, nem URL com credencial. Vivem em GitHub Secrets, nas variáveis e segredos de rede do ambiente de nuvem, ou em arquivos `.env*` ignorados pelo git.

### 5. Pensar antes de codar

**Não suponha. Não esconda dúvida. Exponha tradeoffs.** As regras 5 a 8 privilegiam cautela sobre velocidade; em tarefas triviais, use bom senso.

- Declare as premissas explicitamente. Se houver incerteza, pergunte.
- Se a instrução admite mais de uma leitura, apresente as opções.
- Se existe caminho mais simples, diga. Discorde quando for o caso.

**Ao relatar um problema ou pedir uma decisão, acrescente a explicação em linguagem simples.** O usuário não é programador, mas quer acompanhar o lado técnico: mantenha os nomes reais e, **junto** deles, explique o que aquilo significa na prática. Ao oferecer alternativas, dê a consequência prática de cada uma, como seria feita e qual você recomenda. Expanda sigla na primeira aparição.

### 6. Simplicidade primeiro

**O mínimo de código que resolve o problema.** Nenhuma funcionalidade além da pedida, nenhuma abstração para uso único, nenhuma configurabilidade não solicitada, nenhum tratamento de erro para cenário impossível.

### 7. Mudanças cirúrgicas

**Toque só no que for necessário.** Não "melhore" código vizinho, siga o estilo existente, remova só o que as suas mudanças deixaram órfão. Código morto não relacionado: mencione, não apague.

### 8. Execução orientada a objetivo

**Defina o critério de sucesso. Repita até verificar.** Converta a tarefa em objetivo verificável: "corrigir o bug" vira "escrever um teste que reproduz o bug e fazê-lo passar". Em tarefas de várias etapas, enuncie um plano curto com a verificação de cada etapa.
