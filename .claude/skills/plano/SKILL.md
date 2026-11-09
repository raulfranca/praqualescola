---
name: plano
description: Planeja e executa demandas grandes em etapas, com pausa e retomada em qualquer ponto. Use quando o usuário pedir um plano (/plano <demanda>); pedir para executar, continuar ou retomar o plano; disser só "continuar" havendo plano em_andamento em ref/planos/; pedir para pausar o plano; ou quando chegar mensagem do mod plano-revezamento. Mantém um arquivo por plano em ref/planos/ com um Ponto de retomada sempre atualizado. O Opus orquestra e executa o que tem incerteza; delega ao Sonnet implementação volumosa de escopo fechado e ao Haiku leitura em volume; verifica em camadas pelo portão do projeto (`.claude/scripts/portao.mjs`). Funciona na máquina local e em sessão de nuvem.
---

# Plano — orquestração com pausa em qualquer ponto

| Pedido | Modo |
|---|---|
| `/plano <demanda>` | **Planejar** |
| `/plano`, "continuar", "retomar", "próxima etapa", mensagem do mod `plano-revezamento` | **Executar** |
| Mensagem do mod "investigação de causa raiz", ou `revezamento: investigar` | **Investigar** |
| "pausa", "pausar", "para o plano" — inclusive no meio de um turno | **Pausar** |
| `/plano status` | Ler Ponto de retomada + Progresso e resumir, com % concluído. Nada mais. |

## Regra pétrea: todo plano em execução roda sob o mod `plano-revezamento`

Sem exceção e sem condição. O mod encadeia as etapas, mostra o progresso sobre a caixa de prompt,
recomeça limpo quando o contexto cresce e pausa/retoma na janela de 5h — a skill nunca faz isso
"na mão" nem pergunta se deve seguir.

- **Como saber que ele está aqui:** quando a skill carrega, o mod acrescenta ao fim dela a linha
  `[plano-revezamento ativo nesta sessão]`. Ao entrar no Modo Executar, confira essa linha.
- **Sem a linha, o mod não está carregado** (sessão aberta antes da instalação, plugin desligado,
  VS Code sem recarregar). Diga isso logo no início, em destaque: *"O mod plano-revezamento não está
  carregado nesta sessão — as etapas não vão encadear. Recarregue o VS Code (Developer: Reload
  Window) e diga 'continuar'."* Depois execute a etapa corrente normalmente.
- **"Sem parar", "one shot", "seguir direto", "até o fim"** e equivalentes são o fluxo normal deste
  modo, não um pedido estranho: execute a etapa corrente e encerre o turno — o mod emenda a próxima.
  Nunca questione o pedido nem diga que a skill não prevê isso.
- O mod arma sozinho a partir de qualquer edição do plano `em_andamento` feita na execução — não
  depende da frase do usuário.

**Exceção: sessão de nuvem.** Plugin não carrega na nuvem, então lá o mod não existe e isso é normal —
não avise que ele falta. Quem encadeia é o hook `Stop` do repositório (`.claude/hooks/revezamento-nuvem.cjs`):
veja a seção *Na nuvem*.

## Princípios

1. **O estado mora no disco, não na conversa.** A conversa pode acabar a qualquer momento: limite de uso, compactação, recomeço pelo mod, VSCode fechado. Tudo que uma sessão nova precisaria saber vai para o arquivo do plano **antes** de seguir adiante.
2. **O Opus orquestra e executa.** Delegar é exceção que precisa compensar (ver Delegação).
3. **Uma etapa por turno.** Quem encadeia as etapas é o mod `plano-revezamento`; sem ele, o usuário diz "continuar". O fim de turno é barato: dentro do tempo de cache, a mensagem seguinte custa o mesmo que uma volta de ferramenta.
4. **Verificação em camadas.** O portão completo roda uma vez por etapa, não a cada edição.

---

## Modo Planejar

1. **Investigar antes de planejar.** `ref/PRD.md` e `ref/DOC.md` nas seções relevantes, o grafo (`graphify query`), os arquivos centrais, as migrations se houver banco. Varreduras amplas e independentes vão em paralelo para subagentes Haiku (ver Delegação). Plano escrito sem investigação gera especificação vaga — e uma sessão nova só tem o arquivo.

2. **Decompor em etapas.** Cada etapa:
   - termina em **estado consistente** (portão verde) — é o ponto seguro onde o plano pode parar por dias;
   - cabe numa sessão de trabalho focada; se não cabe, divida;
   - tem **Especificação autossuficiente**: uma sessão nova, sem esta conversa, executa a partir dela;
   - tem **critérios de aceite como asserções executáveis** — dizem qual evidência será produzida e observada ("`f(x)` retorna `y`", "a query confirma a coluna e o grant"), nunca "o arquivo X existe";
   - declara **executor** (`opus` ou `sonnet`), **dependências** e, quando independente de outra, **paralelo com**;
   - se muda tela, lista **Cenários de interface** em português, com uma tag `@<slug>`: quem (usuário de teste do projeto), faz o quê, vê o quê. Viram testes e2e na execução (módulo `web`);
   - marca **portão** quando precisa do usuário: decisão em aberto, julgamento visual que depende de gosto, dado de produção.

3. **Escrever** `ref/planos/AAAA-MM-DD-<slug>.md` pelo `template.md` desta skill, com `status: em_andamento` e `revezamento: aguardando_usuario` — o plano nasce esperando a aprovação; a primeira etapa executada passa a `continuar` ao fechar.

4. **Apresentar e parar.** Etapas (título, executor, portões), a lista de cenários de interface para o usuário revisar, e o caminho do arquivo. Não execute a etapa 1.

> Já existe plano `em_andamento`? Pergunte se o anterior vira `pausado` antes de criar outro — dois em andamento tornam "continuar" ambíguo.

---

## Delegação

| Executor | Quando | Como |
|---|---|---|
| **Opus** (inline) | Padrão. Tudo que tem incerteza ou decisão: regra de negócio interdependente, mudança de schema, segurança, depuração, revisão, mudança pequena ou média. | Direto nesta conversa. |
| **Sonnet** | Especificação fechada **e** volume grande: o padrão já existe no código e é só replicar, nenhuma decisão em aberto, critério executável. Ex.: o mesmo ajuste em 10+ arquivos; bateria de testes a partir de casos listados; testes e2e a partir de cenários escritos. | `Agent`, `subagent_type: general-purpose`, `model: sonnet`, `effort: high` |
| **Haiku** | Só leitura, nunca escreve código: varrer muitos arquivos, ler documento longo, resumir saída extensa (log, teste com falha) e devolver só o que interessa, com `caminho:linha`. | `Agent`, `subagent_type: Explore`, `model: haiku`, `effort: high` |

- **Na dúvida entre Opus e Sonnet, Opus.** Delegar tem custo fixo — prompt autossuficiente, subagente relendo tudo a frio, orquestrador lendo o diff inteiro para revisar — e só compensa com volume. Mudança de poucos arquivos: inline.
- **O prompt do subagente é montado na hora de delegar**, a partir da Especificação + lições do Diário (desvios, caminhos que mudaram). Contém: contexto em 2–3 frases, arquivos, convenções do repo que se aplicam (as do `AGENTS.md`, os comandos de `.claude/loop.json`, as skills obrigatórias), o que **não** fazer, a verificação direcionada a rodar, e o formato do relatório (arquivos tocados, desvios, dúvidas). Sempre inclua: *"Obstáculo não previsto na especificação: pare e reporte — não improvise."*
- **Subagente roda só a verificação direcionada**; o portão completo é do orquestrador (evita rodar duas vezes).
- **Correção:** pequena, inline; substancial, `SendMessage` ao mesmo subagente (mantém o contexto).
- **Proteção de contexto:** saída grande que só interessa resumida (log, relatório de teste, capturas de falha) vai para um subagente que devolve diagnóstico curto.
- O usuário autorizou a delegação ao adotar este fluxo — não pergunte antes de delegar.

**Paralelismo:**
- Leituras independentes: sempre em paralelo (várias chamadas na mesma mensagem).
- Escritas em paralelo: só etapas marcadas *paralelo com* no plano — arquivos disjuntos, sem migration, sem regenerar arquivo gerado compartilhado, sem mexer nos mesmos dados de teste. Mesma árvore de trabalho.
- Paralelo economiza relógio, não tokens — e gasta a janela de 5h mais rápido.

---

## Modo Executar

1. **Localizar** o plano `status: em_andamento` em `ref/planos/`. Nenhum, mas há `pausado`: pergunte qual retomar e mude para `em_andamento`. Nenhum dos dois: diga isso e pare.

2. **Ler leve — nunca o plano inteiro** (planos passam de mil linhas). Frontmatter, a seção *Ponto de retomada*, a seção da etapa corrente e as duas ou três últimas entradas do *Diário*. Localize as seções com `Grep` e leia com `offset`/`limit`. Plano no formato antigo (sem *Ponto de retomada* nem `revezamento`): crie os dois a partir do *Progresso* e do *Diário* antes de seguir.

3. **Conferir com a realidade** (toda retomada): `git status --short` e `git diff --stat` contra *Tocados e não verificados*. Uma sub-tarefa `[~]` pode ter ficado pela metade — inspecione o diff dela antes de seguir. Divergência: registre no Ponto de retomada e decida entre completar e refazer.

4. **Abrir a etapa** (se ainda não aberta): quebre em sub-tarefas e grave-as no Ponto de retomada **antes** de começar. Etapa de UI, se o projeto tem o módulo `design`: invoque `frontend-design` ancorada em `design-system/README.md`. Etapa de schema, se tem o módulo `supabase`: invoque `migrations-supabase`.

5. **Trabalhar sub-tarefa a sub-tarefa**, atualizando o Ponto de retomada a cada passo:
   - ao começar uma sub-tarefa: `[~]`, *Próxima ação*;
   - ao terminar: `[x]`, *Tocados e não verificados*, nova *Próxima ação*;
   - ao delegar: *Em execução* (quem, fazendo o quê).
   Uma edição pequena por passo — barato perto de refazer trabalho perdido.

6. **Verificar** (camadas abaixo) e fazer o QA dos critérios de aceite.

7. **Fechar a etapa:** marcar o *Progresso*; entrada no *Diário* (no máximo 10 linhas); reescrever o Ponto de retomada para *Etapa N+1 — não iniciada*; definir `revezamento` no frontmatter:
   - `continuar` — a próxima etapa pode seguir sem o usuário;
   - `investigar` — uma falha persistiu (ver Modo Investigar); a etapa não fecha, o turno acaba e o próximo investiga em `xhigh`;
   - `aguardando_usuario` — só para o que é decisão do usuário: portão, ou desfecho (b) de uma investigação. **Falha técnica nunca é motivo para chamar o usuário sem antes investigar.**

8. **Encerrar o turno** com: o que a etapa entregou; `% concluído` (etapas marcadas ÷ etapas não canceladas) e as que faltam, pelo nome; e, se `aguardando_usuario`, exatamente o que precisa do usuário. **Não emende a etapa seguinte** — o mod encadeia.

---

## Verificação em camadas

| Quando | O quê | Quem |
|---|---|---|
| Durante a etapa | Direcionada: `comandos.teste_direcionado` de `.claude/loop.json`, só nos arquivos afetados | Quem implementa |
| Fim de etapa (**portão**) | `node .claude/scripts/portao.mjs` — uma vez (lint, tipos, testes) | Orquestrador |
| Etapa que muda tela | `node .claude/scripts/portao.mjs --e2e <slug>` | Orquestrador |
| Mexeu em import, configuração ou empacotamento | `node .claude/scripts/portao.mjs --build` | Orquestrador |
| Fim do plano | `node .claude/scripts/portao.mjs --final` (portão + build + e2e completo) | Orquestrador |

O portão já devolve saída curta: uma linha por verificação e, só nas que falharam, o fim da saída. Os comandos vêm de `.claude/loop.json`, então o mesmo texto vale para qualquer stack. Verificação de tipos, onde o projeto tem, nunca é opcional: é a que pega identificador não importado.

**QA — a mudança faz o que foi previsto.** Verde no portão não prova comportamento: pode só significar que nenhum teste cobre a mudança. Para cada critério de aceite, produza evidência e observe:
- **Lógica:** asserção ad hoc com entradas conhecidas (teste temporário ou one-liner). Se merece cobertura permanente, promova para `src/test/` e registre no Diário.
- **Banco:** consulte o banco local, nunca o de produção — coluna e tipo, permissões por papel, migration registrada, tipos regenerados. As regras de cada ambiente estão no `AGENTS.md`.
- **Interface:** (1) os cenários `@<slug>` da etapa passam no e2e; (2) captura das telas novas ou alteradas, conferida contra o design system do projeto — se o veredito depende de gosto, é portão do usuário.
- **Falha no e2e:** leia o resumo do relatório; abra só a captura do teste que falhou. Muitas falhas ou saída grande: delegue a triagem e receba diagnóstico curto.

Não marque a etapa como concluída enquanto a evidência não passar. Não passou depois da primeira correção: Modo Investigar.

---

## Modo Investigar

**Quando:** uma falha persiste depois da primeira correção — o mesmo erro voltou, a segunda tentativa também falhou, ou o teste quebra por um motivo que você não entende. Não tente uma terceira variação às cegas. Grave no Ponto de retomada o bloco **Investigação** (sintoma exato, o que já foi tentado e por que falhou, a evidência), marque `revezamento: investigar` e encerre o turno: o mod abre o próximo em `xhigh`. Também entra aqui quando o mod avisa que o plano não está avançando.

**Postura:** engenheiro sênior diante de um problema que resistiu. O objetivo é a **causa raiz**, não fazer o sintoma sumir.

1. **Ler** o bloco Investigação e o Diário — nunca repetir uma tentativa já registrada.
2. **Reproduzir** de forma mínima e **observar a evidência real**: a mensagem de erro inteira, o log, o teste isolado (`comandos.teste_direcionado`), o estado do banco local, o `git diff` do que foi tocado.
3. **Hipóteses → experimentos.** Liste as causas possíveis; para cada uma, um experimento que a confirma ou descarta. Registre cada resultado no bloco Investigação à medida que sai (o estado mora no disco).
4. **Seguir o fio até a origem:** ler o código de onde o erro nasce, não só onde aparece; `git log -p`/`git blame` do trecho; a migration ou a configuração envolvida; o PRD/DOC quando o comportamento esperado está em dúvida. Leitura em volume pode ir para Haiku; a conclusão é sua.

**Desfecho obrigatório — um destes, nunca "não consegui":**
- **(a) Causa encontrada e corrigível no escopo do plano:** corrija, rode o portão, registre no Diário causa e correção, `revezamento: continuar`.
- **(b) Causa encontrada, mas exige decisão do usuário** — contradição com o PRD, mudança de escopo, problema de arquitetura mais fundo que o plano, dado de produção: escreva no Ponto de retomada **Decisão necessária** com o diagnóstico, a evidência, as opções (consequência prática e como seria feita cada uma) e a sua recomendação; `revezamento: aguardando_usuario`.
- **(c) Causa ainda não encontrada:** o que foi descartado, o que se sabe agora e o próximo experimento ficam registrados; `revezamento: investigar` — o próximo turno continua a investigação de onde parou. Cada turno precisa estreitar o problema; um turno que não registra nada faz o mod parar.

---

## Modo Pausar

**Gatilhos:**
- (a) o usuário pede pausa — a mensagem pode chegar no meio do turno;
- (b) aviso do mod: janela de 5h em 90%;
- (c) parada brusca (limite estourado, sessão fechada) — nada a fazer: a gravação contínua cobre, e o passo 3 do Executar acha o que ficou pela metade.

**Procedimento (a) e (b):**
1. Termine só a ação atômica em curso — nunca deixe arquivo pela metade. Não lance subagentes novos.
2. Subagente em execução: não interrompa; deixe registrado em *Em execução*. Se a notificação dele reabrir a conversa, incorpore o resultado ao Ponto de retomada e volte a parar.
3. Ponto de retomada: *Atualizado* com o motivo, *Próxima ação* literal.
4. Frontmatter: em (a), `status: pausado`; em (b), mantenha `em_andamento` — o mod retoma sozinho quando a janela zerar.
5. Encerre o turno com uma linha: onde parou e qual é a próxima ação.

---

## Contrato com o mod `plano-revezamento`

O mod vive na máquina, instalado do marketplace `settler` (`claude plugin install plano-revezamento@settler`). O recomeço limpo é um `/compact` marcado que o próprio mod responde, sem o resumo pago. Esta skill e ele combinam só por estes pontos:

- **Arma** em qualquer turno da conversa principal que edite o plano `em_andamento` — seja qual for a frase do usuário —, e também com `/plano` sem demanda ou mensagem começando com "continuar", "retomar", "executar", "próxima etapa", "seguir", "segue", "one shot", "sem parar" havendo plano `em_andamento`. Só não arma no turno de `/plano <demanda>` (planejamento: não encadeia nem troca o esforço) nem depois de "pausa". Tarefa que não toca o plano nunca é afetada.
- **Marca na skill:** ao carregar esta skill, o mod acrescenta `[plano-revezamento ativo nesta sessão]` ao fim dela (ver Regra pétrea).
- **Lê** o frontmatter do plano `em_andamento` (`status`, `revezamento`) e o texto do *Ponto de retomada*.
- **Fim de turno com `revezamento: continuar`:** se o contexto passou de 100 mil tokens, recomeça limpo (troca a conversa por uma mensagem apontando para o plano — a sessão e o Remote Control continuam) e manda "continuar". **Se o *Ponto de retomada* não mudou no turno, insiste uma vez; no segundo, manda investigação de causa raiz; só para se nem a investigação registrar nada** — por isso ele é atualizado a cada avanço.
- **Subagente da conversa principal ainda rodando** (`$.agent.list()`: `pending`/`running`/`waiting`, sem `parentId`): não manda nada — a notificação do subagente reabre a conversa e o fim desse turno decide. Não é preciso mudar `revezamento` para segurar o mod enquanto um subagente trabalha.
- **`revezamento: investigar`:** manda a mensagem "investigação de causa raiz" (Modo Investigar) e força `xhigh` só nesse turno; o seguinte volta a `medium`.
- **Erro da API no turno:** tenta de novo a cada 3 minutos, até 3 vezes, antes de parar e avisar.
- **Janela de 5h ≥ 90%:** injeta o pedido de pausa (gatilho b). Depois que o turno acaba, espera a janela zerar, confere a janela semanal, recomeça limpo e manda "continuar".
- **`status: pausado`, `revezamento: aguardando_usuario`, ou "pausa" do usuário:** não continua.
- **Mensagem do mod ao recomeçar:** entre no Modo Executar pelo passo 2 (ler leve). Não há conversa anterior — o plano é a única memória.
- **Progresso na tela:** linha de status fixa (`$.ui.status`), visível desde a abertura da sessão sempre que há plano `em_andamento` e reescrita a cada avanço — `📋 <título> · etapa 3/12 · 25% · sub-tarefa 3.2/5`, com `· ▶ automático` quando o encadeamento está armado —, lida do título (`# Plano — …`), do *Progresso* (`[x]` ÷ etapas não canceladas) e das sub-tarefas do *Ponto de retomada*. Por isso os formatos dessas seções no `template.md` são contrato: não os mude sem ajustar o mod. Paradas (limite, `aguardando_usuario`, plano concluído) também viram notificação do sistema (`$.ui.notify`).
- **Esforço:** na execução ("continuar", recomeços do mod), o mod força `medium` nas chamadas da conversa principal (evento `turn.step`) — `xhigh` no turno de investigação. `/plano <demanda>` usa o esforço da sessão (o usuário planeja em `xhigh`). Subagentes seguem o `effort` desta skill.

---

## Na nuvem

Sessão de nuvem é a que tem `CLAUDE_CODE_REMOTE=true`. Tudo acima vale, com estas diferenças:

- **Quem encadeia** é o hook `Stop` (`.claude/hooks/revezamento-nuvem.cjs`). Ao fim de um turno com
  `revezamento: continuar` ou `investigar` ele manda seguir. O contrato é o mesmo do mod: *Ponto de
  retomada* que não mudou faz insistir uma vez, depois investigar, e na terceira ele para. Subagente em
  andamento segura o encadeamento.
- **Não há pausa automática na janela de 5h nem recomeço limpo.** A nuvem compacta sozinha; se o limite
  estourar, a sessão para e o usuário diz "continuar" quando puder.
- **O estado só está salvo depois do push.** A VM ociosa pode ser recolhida e o que não foi enviado se
  perde. Ao **fechar cada etapa**, faça `git add`, `git commit` e `git push` da branch da sessão, com
  o plano junto. Isso não é publicar: nunca empurre para `main` nem para `dev` sem o usuário pedir.

## Encerramento do plano (após a última etapa)

- Portão de fim de plano verde (tabela de Verificação).
- `CHANGELOG.md`: entrada única da feature em `[Unreleased]`, para leitor não técnico.
- `ref/DOC.md` / `ref/PRD.md`, se mudou schema, estrutura, fluxo ou funcionalidade.
- `.github/maintenance.yml`, se ficou algo com prazo previsível.
- Módulo `supabase`: migration criada no plano e ainda não aplicada em produção vira aviso em destaque, com a lista e os comandos da skill `migrations-supabase` — a produção é do usuário.
- Frontmatter `status: concluido` e `git mv` do arquivo para `ref/planos/concluidos/`, mesmo nome.

## Regras gerais

- **Nunca pule dependências.** A próxima etapa depende de uma desmarcada: explique e pare (`aguardando_usuario`).
- **Plano não é dogma.** Etapa obsoleta ou que precisa mudar: edite o plano antes de executar (`~~cancelada~~` com justificativa no Diário, ou Especificação reescrita) e diga isso ao usuário.
- **Diário é histórico; Ponto de retomada é estado.** O Diário só cresce; o Ponto de retomada é sobrescrito.
- O `CHANGELOG.md` é atualizado uma vez por feature, no encerramento — não a cada etapa.
