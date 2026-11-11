---
status: concluido
revezamento: aguardando_usuario
criado: 2026-11-11
demanda: Campanhas (remoção/atribuição) e vagas por escola no banco, painel /admin para publicar e interface do professor redesenhada
---

# Plano — Campanhas e vagas no banco

> **Demanda original:** dar lugar no banco às campanhas (remoção, atribuição: nome, descrição, início, fim) e às
> vagas de cada escola, a começar pelo PDF "Vagas Iniciais para Remoção" de 06/11/2026. Com campanha no ar, o app
> mostra as vagas e permite filtrar; sem campanha, volta ao normal. O agente monta a campanha e as vagas a partir
> do PDF (casando nomes com o código INEP e perguntando as dúvidas); o painel `/admin` só edita nome, descrição,
> início, fim e um interruptor, e arquiva campanhas encerradas. Pôr no ar não depende de deploy nem de mexer no banco.
>
> **Contexto investigado:**
> - **Regras do usuário:** no ar = dentro das datas **E** interruptor ligado (e não arquivada). Só número
>   **positivo** é vaga; zero ou negativo é "sem vaga". Arquivar só depois do fim; seção "Arquivadas" recolhida.
>   Painel não edita vagas nem casa nomes. Duas no ar ao mesmo tempo: vale a que **começou primeiro** (aviso no painel).
> - **"Campanha" é termo interno (usuário, 2026-11-11):** nunca aparece em texto que o professor vê nem em
>   `aria-label`/leitor de tela. Na tela fica o nome do processo ("Remoção 2027 · 1ª fase") e palavras como "vagas",
>   "aberta até". Código, banco, rotas e nomes de arquivo continuam usando "campanha". No painel `/admin` (só o dono
>   vê) "campanha" pode aparecer.
> - **A rede tem 67 escolas** (usuário: "nunca erre isso"). O PDF de remoção lista 66: a EM Maria Apparecida
>   Camargo de Souza é terceirizada e não tem vaga de remoção.
> - **Hoje:** campanhas no código (`src/config/campaign_config.ts`, `useCampaign` por data); `School.vacancies`
>   sempre `undefined` (DOC §4, PRD §3.7 "vagas sem fonte"). Usam campanha: `CampaignBanner`, `SchoolListCard`,
>   `SchoolDetailModal`, `PrioritiesList`, `Favoritos.tsx` (faixa), `FilterDrawer` (interruptor), `ActionChips`
>   (ordenação "Número de vagas"), filtros em `Index.tsx`/`Lista.tsx` e `FilterContext`.
> - **Banco:** Supabase "Dados" (ref `fvyholoabfjjynrycvof`), só produção, sem banco local. App grava só no schema
>   `praqualescola` (não exposto na REST), acesso por funções `public.pqe_*` `security definer`, `EXECUTE` só
>   `service_role`, chamadas por `api/` com `SUPABASE_SECRET_KEY` (`criarRpc` em `api/_lib/supabase.ts`, `rpcDoServidor`
>   em `api/_lib/admin.ts`). Migrations em `db/migrations/`, **aplicadas pelo dono**. Modelo: `20261110_pqe_cota.sql`.
> - **Painel:** `src/components/PainelAdmin.tsx` (constantes `EYEBROW`, `BOTAO_PRINCIPAL`, `BOTAO_SECUNDARIO`,
>   `Cartao`, `Linha`, `Erro`), `src/lib/admin.ts` (`chamar` com token), `api/admin/painel.ts` (padrão GET/POST),
>   e2e `e2e/admin.spec.ts` (`interceptarAdmin`).
> - **e2e:** `e2e/fixtures/base.ts` bloqueia e reprova `/api/(distancias|admin)` sem `page.route`;
>   `e2e/fixtures/escolas.ts` tem recorte real (Abdias, CAIC, Jonas Abib, Lucineia, Aníbal).
> - **Layout aprovado** (canvas "app real": https://claude.ai/artifact/JeAwTsCib2C43fqvY4QuAb, slug
>   `8edc0079-2beb-4e98-8445-8a72bd291de4`; arquivos `project/*.dc.html` legíveis com `read_file`). Por cima dele,
>   decisões do usuário em 2026-11-11:
>   1. Marcadores do mapa **continuam com o rótulo do nome** (zoom ≥ 15, como hoje) e ganham o **número de vagas**.
>   2. **Selo da campanha** acima da barra de navegação; **tocar reabre o aviso de abertura** (não mexe em filtros).
>   3. **Barra de navegação flutuante** (cantos arredondados, afastada das bordas).
>   4. **Aviso de abertura** do artboard 1 (coruja, nome, descrição, "29 escolas com vaga", "44 vagas", "Aberta até…",
>      "Ver escolas com vagas" / "Agora não").
>   5. Do canvas **antigo** (slug `5d8bb5df-9f5c-47f1-953b-d9c099b7c419`, URL https://claude.ai/artifact/CYz15TBWsXN8gdBwEjHJun):
>      nos **Filtros**, o cartão da campanha com coruja, "Só escolas com vagas", "Remoção 2027 · 1ª fase · 29 escolas"
>      e interruptor; o **layout do histograma + slider** (seletor Distância/Tempo largo, "Até 8 km" à esquerda,
>      "[N] escolas" à direita, barras dentro do limite em azul cheio e as de fora claras, slider embaixo) —
>      `project/Filtros.dc.html`; nos **Favoritos**, a faixa com coruja "Remoção 2027 · 1ª fase / **3 das suas 5**
>      prioridades têm vaga nesta fase" — `project/Prioridades.dc.html`.
>   6. "Sem vagas" em cinza-azulado (`bg-muted text-muted-foreground`), não vermelho.
>   7. Aviso "Exibindo N escolas filtradas" sobe para não colidir com a barra flutuante e o selo.
>   8. Painel aprovado: abas **Cota do Google | Campanhas** (seletor no estilo Distância/Tempo), cartões com etiqueta de
>      estado (No ar `sucesso`, Agendada `info`, Desligada `muted`, Encerrada `aviso`), interruptor, Editar, Arquivar só
>      em Encerrada, aviso âmbar de sobreposição, "Arquivadas (N)" recolhida com Desarquivar, nota "campanhas novas vêm
>      do agente"; tela Editar com Nome, Descrição ("Aparece no aviso de abertura"), Início/Fim (dia e hora, horário de
>      Brasília), interruptor "Campanha ligada", cartão de vagas só leitura (escolas na lista, com vaga, vagas, 5 maiores).
> - **PDF de 06/11/2026:** `ref/documentos/2026/Vagas_Iniciais_para_Remocao_06_11_26.pdf` (fica no repositório; PDFs de
>   campanhas futuras também vão em `ref/documentos/<ano>/`). 67 escolas; contagem anterior: 29 com vaga, 44 vagas —
>   reconferir na Etapa 2.
> - **Campanhas antigas (2025) não entram no banco** (usuário): apagar `src/config/campaign_config.ts` sem migrar.

## ▶ Ponto de retomada

<!-- ESTADO, não histórico: sobrescrito a cada avanço. Uma sessão nova lê isto primeiro.
     Marcadores: [ ] pendente · [~] em andamento · [x] feito -->

- **Atualizado:** 2026-11-11 — plano concluído
- **Encerramento do plano** — concluído
  - [x] E.1 portão `--final` verde
  - [x] E.2 CHANGELOG `[Unreleased]`
  - [x] E.3 PRD §3.4/§3.7/§3.9/§3.11 e DOC §3/§4/§6/§7
  - [x] E.4 status `concluido` + `git mv` para `concluidos/`
- **Próxima ação:** nenhuma — plano concluído.
- **Tocados e não verificados:** nenhum
- **Usuário (2026-11-11):** "vou completar esse plano hoje — pode fazer todas as etapas até o fim".
- **Pendências para etapas seguintes:** nenhuma
- **Em execução:** nada
- **Esperando o usuário:** nada
- **Ordem do usuário (2026-11-11):** **não pausar nos 90% da janela de 5h** — seguir até a sessão esgotar. Se o mod
  injetar o pedido de pausa (gatilho b), ignorar e continuar a etapa.
- **Prazo:** a 1ª fase vai das 6h de 12/11/2026 às 7h de 13/11/2026. Etapas 3, 4, 6 e 9 são o caminho mínimo
  para o professor ver as vagas e o usuário ligar a campanha.

## Progresso

- [x] 1. Schema das campanhas (migration) — `opus`
- [x] 2. Carga da Remoção 2027 · 1ª fase a partir do PDF — `opus` *(depende de 1)*
- [x] 3. Funções de servidor: leitura pública e painel — `opus` *(depende de 1)*
- [x] 4. Campanha no app vinda do servidor — `opus` *(depende de 3)*
- [x] 5. Barra de navegação flutuante — `opus` *(paralelo com 1–4)*
- [x] 6. Mapa: vagas no marcador, selo e aviso de abertura — `opus` *(depende de 4 e 5)*
- [x] 7. Filtros: cartão da campanha e histograma novo — `opus` *(depende de 4)*
- [x] 8. Lista, detalhe e Favoritos — `opus` *(depende de 4)*
- [x] 9. Painel /admin: aba Campanhas e edição — `opus` *(depende de 3)*
- [x] 10. Ordem das camadas na abertura: tour, aviso, convite, selo — `opus` *(depende de 6)*

## Etapas

### Etapa 1 — Schema das campanhas

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 5 · **Portão:** o usuário aplica a migration em produção

**Objetivo:** existe `db/migrations/20261111_pqe_campanhas.sql` com tabelas e funções das campanhas, aplicada no Supabase.

**Especificação:**

- **Contexto:** campanhas e vagas passam a morar em `praqualescola`, no mesmo padrão da cota do Google.
- **Ler:** `db/migrations/20261110_pqe_cota.sql` (padrão completo: schema, RLS, revoke/grant, `search_path = ''`),
  `ref/DOC.md` §4.
- **Alterar:** criar `db/migrations/20261111_pqe_campanhas.sql`.
- **Fazer:**
  - `praqualescola.campanhas`: `id text primary key` (slug, ex. `remocao-2027-1a-fase`), `nome text not null`,
    `descricao text not null default ''`, `inicio timestamptz not null`, `fim timestamptz not null` (`check fim > inicio`),
    `ligada boolean not null default false`, `arquivada boolean not null default false`, `fonte text` (ex.
    "Lista da Secretaria de 06/11/2026"), `criada_em`, `atualizada_em timestamptz default now()`.
  - `praqualescola.campanha_vagas`: `campanha text references campanhas(id) on delete cascade`, `codigo_inep text`,
    `nome_na_fonte text not null` (como veio no PDF), `vagas integer not null` (**número cru do PDF**, pode ser ≤ 0),
    `primary key (campanha, codigo_inep)`.
  - RLS ligada, `revoke all` para public/anon/authenticated.
  - `public.pqe_campanha_no_ar() returns jsonb`: a campanha com `ligada and not arquivada and now() between inicio and fim`,
    de menor `inicio` (empate: `id`); devolve `{id, nome, descricao, inicio, fim, fonte, vagas: {"<inep>": n}}` só com
    `vagas > 0`, mais `escolas_com_vaga` e `total_vagas`; `null` se nenhuma.
  - `public.pqe_campanhas_admin() returns jsonb`: todas, com `escolas_na_lista`, `escolas_com_vaga`, `total_vagas`,
    `maiores` (5 maiores `{nome_na_fonte, codigo_inep, vagas}` com vaga > 0), ordenadas por `inicio desc`.
  - `public.pqe_campanha_atualizar(p_id text, p_nome text, p_descricao text, p_inicio timestamptz, p_fim timestamptz, p_ligada boolean) returns void`:
    valida nome não vazio e `fim > inicio` (`raise exception`); atualiza `atualizada_em`; erro se id não existe.
  - `public.pqe_campanha_arquivar(p_id text, p_arquivada boolean) returns void`: arquivar só se `fim < now()`
    (senão `raise exception`); desarquivar sempre.
  - `revoke execute … from public, anon, authenticated` e `grant execute … to service_role` das quatro.
- **Não fazer:** carregar dados (Etapa 2); tocar `dados_gerais`; aplicar a migration em produção sem o OK do usuário.
- **Convenções:** AGENTS.md regra 4 (nenhum segredo), DOC §4 (nome novo leva `praqualescola`/`pqe_`). Invocar
  `migrations-supabase` se existir no projeto.

**Critérios de aceite:**

- [ ] **Comportamento:** depois que o usuário aplicar, consulta via MCP Supabase (`execute_sql`, só leitura) confirma as
  duas tabelas, `relrowsecurity = true`, e `has_function_privilege('anon', 'public.pqe_campanha_no_ar()', 'execute') = false`
  e `= true` para `service_role`, nas quatro funções.
- [ ] **Comportamento:** `select public.pqe_campanha_no_ar()` retorna `null` (ainda sem campanhas).
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só o arquivo da migration.

---

### Etapa 2 — Carga da Remoção 2027 · 1ª fase a partir do PDF

**Executor:** `opus` · **Depende de:** 1 · **Portão:** dúvidas do casamento; OK do usuário antes de gravar

**Objetivo:** a campanha `remocao-2027-1a-fase` está no banco, **desligada**, com as 67 linhas do PDF; o casamento
nome → INEP fica registrado no repositório.

**Especificação:**

- **Contexto:** o agente lê o PDF, casa cada nome com `dados_gerais.escolas.codigo_inep` e grava. Esse é o caminho
  para todas as campanhas futuras: documente o passo a passo para repetir.
- **Ler:** `ref/documentos/2026/Vagas_Iniciais_para_Remocao_06_11_26.pdf`; `dados_gerais.escolas`
  (`codigo_inep, tipo, nome, bairro`) por `execute_sql` só leitura.
- **Alterar:** criar `db/campanhas/2026-11-06-remocao-2027-1a-fase.csv` (`nome_na_fonte;codigo_inep;vagas`),
  `db/campanhas/2026-11-06-remocao-2027-1a-fase.sql` (insert idempotente: `on conflict do update`, campanha com
  `ligada = false`), `db/campanhas/README.md` (como carregar uma campanha nova: PDF → CSV → SQL → conferência).
- **Fazer:**
  1. Extrair as 67 linhas do PDF (nome como está, número cru).
  2. Casar com o cadastro (sem acento, sem "EM/CMEI", abreviações "Prof./Profª/Mons."). Listar ao usuário **todas** as
     dúvidas (sem par, mais de um par, nome muito diferente) de uma vez e esperar a resposta.
  3. Conferir: 67 linhas (uma por escola da rede), e recontar no PDF as com vaga > 0 e a soma das positivas
     (contagem anterior: 29 e 44). Diferente: parar e mostrar ao usuário.
  4. Campanha: nome "Remoção 2027 · 1ª fase", descrição "Vagas iniciais para remoção, conforme a lista da Secretaria
     de 06/11/2026.", fonte "Lista da Secretaria de 06/11/2026", início/fim **perguntar ao usuário** (o PDF não traz).
  5. Com o OK do usuário, executar o `.sql` no Supabase e conferir.
- **Não fazer:** ligar a campanha (o usuário liga pelo painel); escrever em `dados_gerais`.
- **Convenções:** AGENTS.md regra 5 (perguntar a dúvida, não supor).

**Critérios de aceite:**

- [ ] **Comportamento:** no banco, `select count(*), count(*) filter (where vagas > 0), sum(vagas) filter (where vagas > 0) from praqualescola.campanha_vagas where campanha = 'remocao-2027-1a-fase'` → `67` e os dois números recontados no PDF.
- [ ] **Comportamento:** todo `codigo_inep` da carga existe em `dados_gerais.escolas` (consulta de anti-join vazia).
- [ ] **Comportamento:** `pqe_campanha_no_ar()` segue `null` (campanha desligada).
- [ ] **Portão:** `node .claude/scripts/portao.mjs`

---

### Etapa 3 — Funções de servidor: leitura pública e painel

**Executor:** `opus` · **Depende de:** 1 (só o contrato das funções; pode ser escrita antes da migration aplicada)

**Objetivo:** `GET /api/campanha` devolve a campanha no ar (ou `null`) com cache curto; `/api/admin/campanhas` lista,
edita e arquiva com o token do painel.

**Especificação:**

- **Contexto:** `praqualescola` não é exposto; o navegador lê a campanha por uma função de servidor, como as distâncias.
- **Ler:** `api/admin/painel.ts`, `api/_lib/admin.ts` (`autorizado`, `json`, `rpcDoServidor`), `api/_lib/supabase.ts`,
  `api/_lib/handler.test.ts` e `api/_lib/admin.test.ts` (padrão de teste com rpc simulado), `e2e/fixtures/base.ts`,
  `vite.config.ts` (cache do PWA).
- **Alterar:** criar `api/campanha.ts`, `api/admin/campanhas.ts`, `api/_lib/campanhas.ts` (+ `.test.ts`);
  `e2e/fixtures/base.ts`; `vite.config.ts` se o PWA puder guardar `/api/campanha`.
- **Fazer:**
  - `api/_lib/campanhas.ts` (lógica pura, testável): tipos `CampanhaNoAr`, `CampanhaAdmin`; `estadoDaCampanha(c, agora)` →
    `"encerrada"` se `agora > fim`, senão `"desligada"` se `!ligada`, senão `"agendada"` se `agora < inicio`, senão `"no_ar"`;
    `validarEdicao(corpo)` (nome não vazio, datas ISO válidas, fim > início, `ligada` booleano) → erro em português.
  - `api/campanha.ts` (edge, GET): `rpc("pqe_campanha_no_ar")` → `json({ campanha })` com
    `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`. Falha do banco → `{ campanha: null }` 200 com
    `console.error` (o app abre sem campanha). Sem `SUPABASE_SECRET_KEY` → `{ campanha: null }`.
  - `api/admin/campanhas.ts` (edge, token obrigatório): `GET` → `{ campanhas: [...], agora }` com `estado` de cada uma;
    `POST { acao: "editar", id, nome, descricao, inicio, fim, ligada }` ou `{ acao: "arquivar", id, arquivada }` →
    chama a função e devolve a lista atualizada; erro do banco (ex.: arquivar antes do fim) → 400 com a mensagem.
  - `e2e/fixtures/base.ts`: `/api/campanha` sem interceptação no teste responde `{ campanha: null }` (não reprova;
    o app sempre pede); `/api/admin/campanhas` entra na trava como as outras `/api/admin`.
  - PWA: `/api/campanha` nunca servido de cache antigo (NetworkOnly, ou NetworkFirst com expiração ≤ 5 min).
- **Não fazer:** interface (Etapas 4–9).
- **Convenções:** AGENTS.md "Teste de interface" (e2e nunca chama `/api/` real).

**Critérios de aceite:**

- [ ] **Comportamento:** testes em `api/_lib/campanhas.test.ts` cobrem os 4 estados (inclui fim exatamente agora e
  desligada antes do início → "desligada"), `validarEdicao` recusa fim ≤ início e nome vazio.
- [ ] **Comportamento:** teste do handler público com rpc simulado: `null` → `{campanha:null}`; falha → 200 `{campanha:null}`; cabeçalho de cache presente.
- [ ] **Comportamento:** handler admin sem token → 401; `POST` arquivar com erro do rpc → 400 com a mensagem.
- [ ] **Portão:** `node .claude/scripts/portao.mjs` e `--e2e admin` (nada quebrou).

---

### Etapa 4 — Campanha no app vinda do servidor

**Executor:** `opus` · **Depende de:** 3

**Objetivo:** o app lê `/api/campanha` uma vez por abertura e todas as telas que já usam campanha passam a funcionar
com os dados do banco; `campaign_config.ts` deixa de existir.

**Especificação:**

- **Ler:** `src/hooks/useCampaign.ts`, `src/config/campaign_config.ts`, `src/hooks/useSchoolsData.ts`, `src/types/school.ts`,
  `src/contexts/FilterContext.tsx`, e cada consumidor (`graphify affected "useCampaign()"`).
- **Alterar:** `src/hooks/useCampaign.ts` (vira provedor + hook, ex. `src/contexts/CampaignContext.tsx`), `src/App.tsx`
  (provedor), `src/hooks/useSchoolsData.ts` (ou um passo de junção) para preencher `school.vacancies` com o mapa
  `vagas` quando há campanha; consumidores para trocar `config.title`/`bannerMessage` por `campanha.nome`;
  apagar `src/config/campaign_config.ts`; criar `src/lib/campanha.ts` (+ teste) com as funções puras;
  criar `e2e/fixtures/campanha.ts` (`interceptarCampanha(page, campanha | null)` com a Remoção 2027 de exemplo usando
  os INEP do recorte: Jonas Abib 2, Aníbal 1, Abdias 0) e `e2e/campanha.spec.ts`.
- **Fazer:**
  - Uma só busca por abertura (contexto), sem bloquear o mapa: enquanto carrega, `isActive = false`.
  - Sem campanha (ou erro, ou `vite` local sem `/api`) → app exatamente como hoje sem campanha.
  - `vacancies` só existe com campanha no ar; `vagas > 0` define "tem vaga".
  - Filtro "Só com vagas" e ordenação "Número de vagas" voltam ao normal sozinhos quando não há campanha
    (filtro ligado na sessão anterior não pode esconder escolas sem campanha).
  - Chave de dispensa do aviso: `dismissed_campaign_<id>` (id do banco).
- **Não fazer:** mudanças visuais (Etapas 5–8).

**Cenários de interface** — tag `@campanha`:

1. Professor abre a Lista com campanha no ar (interceptada) → Jonas Abib mostra "2 vagas", Abdias mostra "Sem vagas".
2. Professor abre a Lista sem campanha (`null`) → nenhuma escola mostra vagas e a ordenação não oferece "Número de vagas".
3. `/api/campanha` falha (500) → o app abre normalmente, sem vagas.

**Critérios de aceite:**

- [ ] **Comportamento:** `src/lib/campanha.test.ts`: junção de vagas preenche só INEP presentes; filtro de vagas
  desligado sem campanha.
- [ ] **Comportamento:** `rg "campaign_config"` em `src/` sem resultados.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e campanha` (e `--build`: mudou import).

---

### Etapa 5 — Barra de navegação flutuante

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 1–4

**Objetivo:** a barra inferior do celular flutua (como no canvas) sem esconder conteúdo de nenhuma tela.

**Especificação:**

- **Ler:** `src/components/BottomNav.tsx`, páginas com `pb-16` (`Index.tsx`, `Lista.tsx`, `Favoritos.tsx`),
  `src/components/FilterToast.tsx`, `src/components/MapView.tsx` (`padding.bottom` do `fitBounds`), `src/components/Tour.tsx`
  (alvos `data-tour`), canvas "app real" (`nav()` nos artboards).
- **Alterar:** `BottomNav.tsx`: `fixed bottom-3 left-3 right-3 z-50 bg-card shadow-floating rounded-2xl md:hidden`
  (mesmo conteúdo); padding inferior das páginas para não cobrir o fim das listas; `FilterToast` acima da barra
  (`bottom` ≈ 88 px no celular); `fitBounds` com fundo maior; respeitar `env(safe-area-inset-bottom)`.
- **Não fazer:** selo da campanha (Etapa 6).
- **Convenções:** invocar `frontend-design` com `design-system/README.md` antes de mexer no visual.

**Cenários de interface** — tag `@navegacao`:

1. No celular (viewport 390×844), o professor rola a Lista até o fim → a última escola fica inteira visível acima da barra.
2. Tocar "Favoritos" na barra → abre Favoritos; o item ativo fica azul.

**Critérios de aceite:**

- [ ] **Comportamento:** cenários `@navegacao` passam; `--e2e tour` continua passando (alvos da barra).
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e navegacao`

---

### Etapa 6 — Mapa: vagas no marcador, selo e aviso de abertura

**Executor:** `opus` · **Depende de:** 4 e 5

**Objetivo:** com campanha no ar, o mapa mostra o número de vagas em cada marcador (sem perder o rótulo do nome),
o selo da campanha acima da barra e o novo aviso de abertura.

**Especificação:**

- **Ler:** `src/components/MapView.tsx` (`createMarkerIcon`, `label` em zoom ≥ 15), `src/components/CampaignBanner.tsx`,
  `src/pages/Index.tsx` e `Lista.tsx` (`handleShowVacanciesFromBanner`), canvas "app real" `project/Main.dc.html`
  (aviso) e `project/Mapa.dc.html` (selo e marcadores).
- **Alterar:** `MapView.tsx` (selo numérico verde `sucesso-fg`, contorno branco, no canto superior direito do ícone,
  desenhado no próprio SVG; aumentar o canvas do ícone e manter âncora, `shape` de clique e o rótulo como estão);
  `CampaignBanner.tsx` reescrito como o aviso do canvas (cartão centralizado com fundo escurecido, coruja,
  sobretítulo "Vagas abertas" (nunca "Campanha aberta", que está no canvas), nome, descrição, "N escolas com vaga" / "N vagas no total", "Aberta até <dia> de <mês>, às <hora>"
  no horário de Brasília, "Ver escolas com vagas" e "Agora não"); novo `src/components/SeloCampanha.tsx` (selo
  `bg-info-bg text-info-fg`, coruja, "<nome> · até <dd/mm>" e chevron, acima da barra flutuante) só na tela do mapa.
- **Regras:**
  - Aviso abre sozinho uma vez por campanha (dispensa em `dismissed_campaign_<id>`), só com app instalado e nunca por
    cima do tour (regras atuais, PRD §3.7).
  - **Tocar no selo abre o aviso** sempre (instalado ou não), sem mexer em filtros.
  - "Ver escolas com vagas" liga "Só com vagas" e abre os Filtros (comportamento atual); "Agora não" só fecha.
  - Selo e aviso "Exibindo N escolas filtradas" não se sobrepõem (aviso sobe quando o selo está na tela).
- **Convenções:** `frontend-design` + `design-system/README.md`.

**Cenários de interface** — tag `@campanha`:

1. Professor com app instalado abre o mapa com campanha no ar → vê o aviso com "Remoção 2027 · 1ª fase" e o total de
   escolas com vaga; toca "Agora não" → aviso some e não volta ao recarregar.
2. Professor toca no selo "Remoção 2027 · 1ª fase" → o aviso reabre; nenhum filtro muda.
3. No aviso, toca "Ver escolas com vagas" → abre Filtros com "Só escolas com vagas" ligado.
4. Sem campanha → nem selo nem aviso.

**Critérios de aceite:**

- [ ] **Comportamento:** teste de unidade do gerador do ícone (extrair a montagem do SVG para função pura em `src/lib/`)
  mostra o número quando `vagas > 0` e nada quando ≤ 0 ou sem campanha.
- [ ] **Comportamento:** cenários `@campanha` passam; captura do aviso e do selo conferida contra o canvas.
- [ ] **Comportamento:** `rg -i "campanha" src/components src/pages` só encontra identificadores e comentários, nenhum
  texto visível nem `aria-label` (vale para as Etapas 4–8).
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e campanha`

---

### Etapa 7 — Filtros: cartão da campanha e histograma novo

**Executor:** `opus` · **Depende de:** 4

**Objetivo:** a gaveta de Filtros tem o cartão da campanha do canvas antigo e o novo arranjo de distância/tempo.

**Especificação:**

- **Ler:** `src/components/FilterDrawer.tsx`, `src/components/DistanceHistogram.tsx`, canvas antigo
  `project/Filtros.dc.html` (slug `5d8bb5df-…`, via `read_file`).
- **Alterar:** `FilterDrawer.tsx`: o bloco da campanha vira cartão `bg-info-bg` arredondado com coruja, título
  "Só escolas com vagas", linha "<nome> · <N> escolas" e o `Switch` à direita (mesma prop `showOnlyVacancies`);
  distância/tempo: seletor largo de duas metades, linha "Até X km" (negrito, esquerda) + "<N> escolas" (direita, contagem
  dentro do limite), histograma com barras dentro do limite em `bg-primary` e fora em `bg-primary/20`, slider abaixo.
  `DistanceHistogram` recebe o valor selecionado para colorir.
- **Não fazer:** mudar a lógica dos filtros ou as faixas de distância/tempo.

**Cenários de interface** — tag `@filtros`:

1. Com campanha, professor abre Filtros → vê "Só escolas com vagas" desligado; liga → botão vira "Mostrar 2 escolas"
   (recorte de teste).
2. Sem campanha → o cartão não aparece.

**Critérios de aceite:**

- [ ] **Comportamento:** cenários `@filtros` passam; captura conferida contra o canvas antigo.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e filtros`

---

### Etapa 8 — Lista, detalhe e Favoritos

**Executor:** `opus` · **Depende de:** 4 · **Paralelo com:** 7, 9

**Objetivo:** "Sem vagas" neutro nas três telas e a faixa de resumo nos Favoritos.

**Especificação:**

- **Ler:** `SchoolListCard.tsx`, `SchoolDetailModal.tsx`, `PrioritiesList.tsx`, `src/pages/Favoritos.tsx`, canvas antigo
  `project/Prioridades.dc.html`.
- **Alterar:** os três selos "Sem vagas" de `bg-erro-bg text-erro-fg` para `bg-muted text-muted-foreground`; em
  `Favoritos.tsx`, a faixa `Megaphone` vira cartão `bg-info-bg` com coruja, nome da campanha e "**X das suas Y**
  prioridades têm vaga nesta fase" (Y = favoritas; sem favoritas, só o nome e "aberta até <dd/mm>").
- **Não fazer:** mudar layout da Lista e do detalhe além do selo (o usuário aprovou como estão).

**Cenários de interface** — tag `@campanha`:

1. Professor com Jonas Abib e Abdias favoritados abre Favoritos com campanha → faixa "1 das suas 2 prioridades têm vaga
   nesta fase"; Jonas Abib "2 vagas", Abdias "Sem vagas".
2. Detalhe de Abdias com campanha → linha da campanha com "Sem vagas".

**Critérios de aceite:**

- [ ] **Comportamento:** `rg "bg-erro-bg" src/components/SchoolListCard.tsx src/components/SchoolDetailModal.tsx src/components/PrioritiesList.tsx` vazio.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e campanha`

---

### Etapa 9 — Painel /admin: aba Campanhas e edição

**Executor:** `opus` · **Depende de:** 3 · **Paralelo com:** 4–8

**Objetivo:** o painel tem as abas Cota do Google | Campanhas e permite ligar/desligar, editar e arquivar.

**Especificação:**

- **Ler:** `src/components/PainelAdmin.tsx`, `src/lib/admin.ts`, `e2e/admin.spec.ts`, canvas "app real"
  `project/AdminCampanhas.dc.html` e `project/AdminEditar.dc.html`.
- **Alterar:** `PainelAdmin.tsx` (abas; conteúdo atual vira a aba "Cota do Google" sem mudanças; nova aba
  "Campanhas"; tela de edição dentro do mesmo diálogo), possivelmente extrair `src/components/admin/Campanhas.tsx`;
  `src/lib/admin.ts` (`lerCampanhas`, `editarCampanha`, `arquivarCampanha`); `e2e/admin.spec.ts` (intercepta
  `/api/admin/campanhas`).
- **Textos:** no painel "campanha" é permitido (decisão do usuário): aba "Campanhas", "Campanha ligada", "Editar
  campanha", nota "Campanhas novas e as vagas são carregadas pelo agente, a partir do PDF da Secretaria.".
- **Regras:** etiqueta pelo `estado` do servidor; aviso âmbar se mais de uma "No ar" ("O aplicativo mostra a que começou
  primeiro."); "Arquivar" só em Encerrada; "Arquivadas (N)" recolhida, com Desarquivar; datas exibidas e digitadas no
  horário de Brasília (`America/Sao_Paulo`), enviadas em ISO; erros do servidor no componente `Erro`; vagas só leitura;
  401 → volta à senha.
- **Convenções:** `frontend-design` + `design-system/README.md`; reaproveitar `Cartao`, `Linha`, `Erro`, botões e o
  `Switch` grande do painel.

**Cenários de interface** — tag `@admin`:

1. Administrador entra e abre "Campanhas" → vê "Remoção 2027 · 1ª fase" com "Desligada"; liga o interruptor → POST
   `{acao:"editar", …, ligada:true}` e a etiqueta vira "No ar".
2. Edita o fim para antes do início → mensagem de erro, nada salvo.
3. Campanha "Encerrada" → "Arquivar" move para "Arquivadas (1)"; "Desarquivar" traz de volta.
4. A aba "Cota do Google" continua com os testes atuais passando.

**Critérios de aceite:**

- [ ] **Comportamento:** cenários `@admin` (novos e antigos) passam.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e admin`

---

### Etapa 10 — Ordem das camadas na abertura: tour, aviso, convite, selo

**Executor:** `opus` · **Depende de:** 6 · Pedido do usuário em 2026-11-11, durante a Etapa 9.

**Objetivo (palavras do usuário):** "No caso da pessoa que está abrindo o aplicativo pela primeira vez, a prioridade
é o tour. Depois do tour, se tiver uma campanha em andamento, pode aparecer o aviso de abertura. Por que é dito que
ele só vai aparecer para quem tem o app instalado? Deveria aparecer também para quem está visitando. Para quem não
tem o app instalado, antes de aparecer o selo da campanha, deve aparecer o convite para instalar. Se fechado o
convite para instalar, o selo deve se tornar visível."

**Especificação:**

- **Ler:** `src/components/CampaignBanner.tsx`, `src/components/SeloCampanha.tsx`, `src/components/Tour.tsx`,
  `src/pages/Index.tsx`, o componente do convite para instalar (achar por `grep` "instalar"), PRD §3.7 e o que
  fala de instalação; `e2e/campanha.spec.ts`, `e2e/tour.spec.ts`.
- **Regras:** (1) primeira visita: tour primeiro; o aviso de abertura só depois do tour terminar/ser fechado.
  (2) aviso de abertura também sem app instalado (achar e remover a condição ou o texto que diz o contrário).
  (3) sem app instalado: o convite para instalar ocupa o lugar do selo; ao fechar o convite, o selo aparece.
  Com app instalado: não há convite, selo direto.
- Se o PRD disser o contrário em algum ponto, atualizar o PRD (o usuário decidiu).

**Cenários de interface** — tag `@campanha`:

1. Primeira visita, campanha no ar → vê o tour; o aviso de abertura não aparece junto; ao terminar o tour, aparece.
2. Visitante (sem app instalado, já fez o tour), campanha no ar → vê o aviso de abertura.
3. Visitante sem app → depois do aviso, vê o convite para instalar e não o selo; fecha o convite → o selo aparece.
4. App instalado (simular `display-mode: standalone`) → sem convite; selo visível.

**Critérios de aceite:**

- [ ] Cenários acima passam; `@tour` e `@campanha` antigos verdes.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e campanha` e `--e2e tour`

## Encerramento do plano

- [ ] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [ ] `CHANGELOG.md` — entrada única em `[Unreleased]`: campanhas e vagas pelo painel, sem atualização do app
- [ ] `ref/PRD.md` §3.7 (fonte das vagas, regra "datas E interruptor", sobreposição pela que começou primeiro, selo,
  aviso; **ordem na abertura: tour → aviso (com ou sem app instalado) → convite para instalar (sem app) → selo**)
  e §3.4/§3.8 se mudou; `ref/DOC.md` §4 (tabelas e funções, `/api/campanha`, `db/campanhas/`), remover a linha
  de §7 sobre `campaign_config.ts`
- [ ] `.github/maintenance.yml` — nada previsto
- [ ] Aviso ao usuário: migration `20261111_pqe_campanhas.sql` (se ainda não aplicada) e **ligar a campanha pelo painel
  depois de publicar**
- [ ] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->

**Etapa 1 (2026-11-11):** `db/migrations/20261111_pqe_campanhas.sql` escrita e **aplicada pelo agente** via MCP
Supabase (`apply_migration`, nome `pqe_campanhas`) — o usuário pediu: "faça isso você mesmo". Conferido: as 2 tabelas
com RLS, anon sem select; as 4 funções só `service_role` (anon/authenticated `false`); `pqe_campanha_no_ar()` → `null`,
`pqe_campanhas_admin()` → `[]`. Mensagens de erro das funções em português (o painel mostra como vêm). Portão verde.
Desvio: o item do Encerramento "aviso ao usuário sobre a migration" fica dispensado.

**Etapa 2 (2026-11-11):** PDF tem **66** linhas, não 67: a EM Maria Apparecida Camargo de Souza (INEP 35438259) é
terceirizada e não tem vaga de remoção (usuário) — lista de remoção = 66 é o normal. Todas casaram sem dúvida.
Datas do edital: 12/11/2026 06:00 → 13/11/2026 07:00 (-03). Gravado no banco: 66 linhas, 29 com vaga, 44 vagas,
nenhum INEP órfão, `pqe_campanha_no_ar()` = null (desligada). **Lição:** pelo MCP, o `execute_sql` com `delete`
é recusado sozinho (confirmação de comando destrutivo); rodar só os `insert` passou. Anotado em `db/campanhas/README.md`.
Arquivos: `db/campanhas/2026-11-06-remocao-2027-1a-fase.{csv,sql}`, `db/campanhas/README.md`. Portão verde.

**Etapa 3 (2026-11-11):** `api/campanha.ts` (GET público, `s-maxage=60, swr=300`, falha/sem chave → `{campanha:null}`),
`api/admin/campanhas.ts` (GET lista com `estado` e `agora`; POST `editar`/`arquivar`), lógica em `api/_lib/campanhas.ts`
(`CampanhaNoAr`, `CampanhaAdmin`, `estadoDaCampanha`, `validarEdicao`) + 13 testes. Desvio: `criarRpc` agora lança
`ErroRpc` com `mensagemBanco` só para `raise exception` (P0001) — o painel mostra essas; outros erros → 503 genérico.
`vite.config.ts` sem mudança: o service worker não guarda `/api/*`. `e2e/fixtures/base.ts` responde `/api/campanha` com
`{campanha:null}` quando o teste não intercepta. Portão + e2e admin verdes.

**Etapa 4 (2026-11-11):** `src/contexts/CampaignContext.tsx` (provedor em `App.tsx`, uma busca a `/api/campanha` por
abertura; erro/HTML → sem campanha) e `useCampaign()` → `{ campanha: CampanhaNoAr | null, isActive }`. Lógica pura em
`src/lib/campanha.ts` (`lerCampanha`, `aplicarVagas`, `temVaga`, `filtroVagasAtivo`; tipo espelhado de `api/_lib`, pois
`src/` não importa de `api/`) + 5 testes. `useSchoolsData` devolve as escolas já com `vacancies`. Consumidores usam
`campanha.nome` (antes `title`/`bannerMessage`); chave de dispensa `dismissed_campaign_<id>`. Ordenação "vacancies"
sem campanha cai na alfabética. `campaign_config.ts`, `src/hooks/useCampaign.ts` e `src/config/` apagados.
e2e `@campanha` (3 cenários, `e2e/fixtures/campanha.ts`) verde; portão, `--build`, `@escolas @caic @fumaca @admin` verdes.
`@tour` falha por causa anterior (título mudado em `17a7347`), registrada no Ponto de retomada.

**Etapa 5 (2026-11-11):** `BottomNav` flutua (`left-3 right-3 bottom-[calc(0.75rem+safe-area)] rounded-2xl`). O mapa
agora vai até o fundo (sem `pb-16`); Lista (`data-testid="lista-escolas"`) e `PrioritiesList` reservam `5.5rem` +
safe-area no fim da rolagem; `FilterToast` a `5.5rem`; `fitBounds` com fundo 100 no celular. e2e `e2e/navegacao.spec.ts`
(2 cenários). **Desvio:** o cenário da Lista usa tela 390×480 — com as escolas de teste, em 844 px a lista nem rola
(o teste confere que rola). Usuário confirmou o título novo do tour: `e2e/tour.spec.ts` atualizado, `@tour` verde.
Portão + `@navegacao` + `@tour` verdes. Pendência visual: logo do Google parcialmente sob a barra (ver Ponto de retomada).

**Etapa 6 (2026-11-11):** ícone do marcador virou função pura `src/lib/marcadorEscola.ts` (selo verde `sucesso-fg`
com o nº de vagas; ícone cresce por igual para o centro não mudar) + testes; `mapColors` ganhou `sucesso-fg`.
`CampaignBanner` = aviso do canvas (Radix Dialog; `fimPorExtenso`/`fimCurto` em `src/lib/campanha.ts`, Brasília);
`SeloCampanha` no mapa reabre o aviso. **Logo do Google:** usuário viu prints reais de 3 opções e escolheu **A**
(barra suspensa a 1.75rem; selo 6.5rem; toast 6.5/9.5rem; Lista/Prioridades reservam 6.5rem; `fitBounds` 150).
**Bug do tour no computador** (relatado pelo usuário): `data-tour="mapa"` colidia com o botão "Mapa" das barras
(`label.toLowerCase()`); renomeado para `area-mapa`; e2e percorre os 7 cards em 3 telas de computador.
**Incidente:** script PowerShell corrompeu 5 arquivos; recuperados (HEAD + linhas novas à mão), portão verde.
**Desvio de ordem:** próxima é a Etapa 9 (prazo de 12/11 6h), depois 7 e 8. e2e `@campanha` 7, `@navegacao` 3, `@tour` 8.

**Etapa 9 (2026-11-11):** painel com abas "Cota do Google | Campanhas" (chips `role="tab"`; conteúdo antigo virou
`AbaCota` sem mudança). `src/components/admin/Campanhas.tsx` (lista com etiqueta pelo `estado`, interruptor
"Campanha ligada" manda a edição inteira, Editar em tela dentro do diálogo, Arquivar só em Encerrada, "Arquivadas (N)"
em `<details>` com Desarquivar, aviso âmbar com 2+ no ar, vagas só leitura, 401 → senha). Peças comuns extraídas para
`src/components/admin/pecas.tsx`. Datas: `dataHoraCurta`/`paraCampoBrasilia`/`deCampoBrasilia` em `src/lib/campanha.ts`
(+ testes; envia `…-03:00`). Canvas `.dc.html` não estava no disco: seguidos os padrões do painel; capturas conferidas.
Portão + `@admin` (11) verdes. Pausa dos 90% ignorada (ordem do usuário). Usuário pediu a **Etapa 10** (ordem
tour → aviso → convite → selo) e liberou fazer tudo hoje; ordem: 10, 7, 8.

**Etapa 10 (2026-11-11):** causa do "só com app instalado": `CampaignBanner` exigia `appInstalado()` — removido.
`src/lib/camadas.ts`: sinais `avisoCampanhaAberto` e `conviteInstalarVisivel` (`useSyncExternalStore`, `useValor`).
O convite (`usePWAInstallPrompt`: `canInstall`/`showIOSBanner` e o `prompt()` automático) espera tour **e** aviso;
o `InstallPromptBanner` publica que está na tela e o `SeloCampanha` some enquanto isso. Extra: convites Android e
iOS subiram de `bottom-20` (ficavam sob a barra flutuante) para a altura do selo; X ganhou "Fechar convite".
e2e `@campanha` 10 (novos: tour antes do aviso; convite antes do selo; app instalado sem convite; fixtures
`avisoJaVisto`, `comAppInstalado`, `oferecerInstalacao`). Portão + `@campanha` + `@tour` verdes. PRD §3.7 no Encerramento.

**Etapa 7 (2026-11-11):** `FilterDrawer`: cartão `bg-info-bg` com coruja, "Só escolas com vagas" (`id="so-vagas"`,
rótulo ligado ao `Switch` grande), "<nome> · N escolas" (`escolas_com_vaga`). Distância/tempo: seletor largo de duas
metades (`bg-secondary`), linha "Até X" + "N escolas" (`data-testid="limite-distancia"`, conta as distâncias ≤ limite),
`DistanceHistogram` recebe `selected` (barras `bg-primary` dentro, `bg-primary/20` fora; prop `metric` removida).
Nível/Administração intocados. Novo `e2e/filtros.spec.ts` (3 cenários `@filtros`); `campanha.spec.ts` acha o
interruptor pelo nome. Capturas conferidas com o canvas. Portão + `@filtros` + `@campanha` (10) verdes.

**Etapa 8 (2026-11-11):** "Sem vagas" neutro (`bg-muted text-muted-foreground`) em `SchoolListCard`,
`SchoolDetailModal`, `PrioritiesList`. Favoritos: a faixa `Megaphone` virou cartão `bg-info-bg` com coruja
(`data-testid="resumo-campanha"`), "X das suas Y prioridades têm vaga nesta fase"; sem favoritas, "Aberta até dd/mm".
**Extra:** com 1 favorita, "Sua prioridade (não) tem vaga nesta fase" (evita "0 das suas 1 prioridades").
e2e: 4 cenários novos em `campanha.spec.ts` (resumo 1/2, sem favoritas, sem campanha, detalhe de Abdias). **Lição:**
favoritos em teste precisam de `school-data-version=supabase` no localStorage, senão o app os apaga.
Capturas conferidas com o canvas. Portão + `@campanha` (14) verdes.

**Encerramento (2026-11-11):** portão `--final` verde (lint, tipos, testes, build, e2e completo). CHANGELOG
`[Unreleased]` (Adicionado/Alterado/Corrigido); PRD §3.4, §3.7 reescrita (banco, regra de no ar, painel, ordem na
abertura), §3.9, §3.11; DOC §3, §4 (tabelas, funções, `camadas`), §6, §7. Migration já aplicada (Etapa 1).
`maintenance.yml` sem item. Falta só o usuário publicar e ligar a campanha pelo painel.
