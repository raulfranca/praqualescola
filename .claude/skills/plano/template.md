---
status: em_andamento
revezamento: aguardando_usuario
criado: AAAA-MM-DD
demanda: <resumo de uma linha da demanda original>
---

# Plano — <título curto>

> **Demanda original:** <texto do usuário, condensado mas fiel>
>
> **Contexto investigado:** <achados-chave: arquivos centrais, decisões já tomadas com o usuário,
> restrições do PRD/DOC que governam a solução. Uma sessão futura entende o plano por aqui, sem
> reinvestigar.>

## ▶ Ponto de retomada

<!-- ESTADO, não histórico: sobrescrito a cada avanço. Uma sessão nova lê isto primeiro.
     Marcadores: [ ] pendente · [~] em andamento · [x] feito -->

- **Atualizado:** AAAA-MM-DD HH:MM — <avanço | pausa do usuário | limite de 5h | recomeço>
- **Etapa 1 — <título>** (`opus`) — não iniciada
  - [ ] 1.1 <sub-tarefa> *(gravadas ao abrir a etapa; o mod conta [x] para "sub-tarefa 1.2/5")*
- **Próxima ação:** <uma linha, imperativa e literal: o comando ou edição exata a fazer>
- **Tocados e não verificados:** nenhum
- **Em execução:** nenhum subagente
- **Esperando o usuário:** nada

## Progresso

- [ ] 1. <título> — `opus`
- [ ] 2. <título> — `sonnet` *(depende de 1)*
- [ ] 3. <título> — `opus` *(paralelo com 2)* · ⛔ portão: <o que precisa do usuário>

## Etapas

### Etapa 1 — <título>

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** — · **Portão:** —

**Objetivo:** <uma frase: o que existe ao final desta etapa que não existia antes>

**Especificação** *(autossuficiente: uma sessão nova, sem a conversa que criou o plano, executa a partir daqui)*:

- **Contexto:** <o que é a feature, em 2–3 frases>
- **Ler:** <caminhos exatos>
- **Alterar:** <caminhos exatos>
- **Fazer:** <passos>
- **Não fazer:** <escopo de outras etapas, áreas a não tocar>
- **Convenções que se aplicam:** <skills obrigatórias e regras do AGENTS.md — só as pertinentes>

**Cenários de interface** *(só se a etapa muda tela)* — tag `@<slug>`:

1. `<usuário de teste>` <faz o quê> → <vê o quê>
2. …

**Critérios de aceite** *(asserções executáveis — a evidência que o orquestrador vai produzir e observar)*:

- [ ] **Comportamento:** <ex.: "`f('2026-06-11', 3)` retorna `'2026-06-16'` (pula fim de semana)"; "no
  banco local, a coluna `nova_col` existe e é TEXT">
- [ ] **Portão:** `node .claude/scripts/portao.mjs` (`--e2e <slug>` se muda tela)
- [ ] **Escopo:** o diff não toca arquivos fora desta etapa

---

### Etapa 2 — <título>

…

## Encerramento do plano

- [ ] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [ ] `CHANGELOG.md` — entrada única da feature em `[Unreleased]`, para leitor não técnico
- [ ] `ref/DOC.md` / `ref/PRD.md` — se mudou schema, estrutura, fluxo ou funcionalidade
- [ ] `.github/maintenance.yml` — se ficou algo com prazo previsível de revisão
- [ ] Migrations pendentes de produção (módulo `supabase`) — aviso ao usuário com a lista e os comandos
- [ ] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->

### AAAA-MM-DD — Etapa 1 (`opus` | delegada a `sonnet`)

- **Feito:** <resumo>
- **Arquivos:** <lista>
- **Desvios:** <diferenças em relação ao planejado e decisões tomadas, ou "nenhum">
- **Pendências:** <o que ficou para etapas seguintes ou para o usuário, ou "nenhuma">
