---
status: pausado
revezamento: aguardando_usuario
criado: 2026-11-10
demanda: O app passa a ler escolas e turmas do Supabase "Dados" (fonte oficial da SME) em vez da planilha Google ESCOLAS-PINDA
---

# Plano — Escolas lidas do Supabase da SME

> **Demanda original:** O Supabase "Dados SME" é agora a fonte oficial de verdade sobre as escolas (dados
> cadastrais, geolocalização conferida e validada, turmas de 2027). O aplicativo deve ler de lá, e não
> mais da planilha Google ESCOLAS-PINDA. Total de 67 escolas (NAPs e Casa Verde não entram).
>
> **Contexto investigado (2026-11-10):**
> - **Banco:** projeto Supabase `Dados`, ref `fvyholoabfjjynrycvof`, URL `https://fvyholoabfjjynrycvof.supabase.co`.
>   Schema `dados_gerais`, alimentado por um Apps Script da planilha "dados-gerais" da SME (as tabelas são
>   substituídas inteiras a cada publicação; **este app só lê, nunca escreve nem cria migration ali**).
>   - `escolas` (67 linhas = 41 EM + 25 CMEI ativas + CAIC inativo): `codigo_inep` (texto, ID estável —
>     "os apps devem referenciar este código, nunca o nome"), `tipo`, `nome`, `nome_oficial`, `endereco`,
>     `bairro`, `cep`, `latitude`/`longitude` (numeric → chegam como **texto** no JSON), `telefone`, `email`,
>     `setor` (smallint), `regiao`, `secretaria_polo`, `terceirizada`, `ativa`, `observacao`, `link_mapa`,
>     `google_place_id`, `link_google_maps`. **Não tem ramal.**
>   - `turmas` (839 linhas, só `ano_letivo` 2027): `codigo_inep` (escola **responsável**), `codigo_inep_local`
>     (prédio onde funciona), `etapa` ∈ {bercario, infantil_1, infantil_2, pre_1, pre_2, ano_1…ano_5,
>     multisseriada}, `nome_turma`, `turno`, `modulo_atendimento` (vagas da turma). Só as 13 turmas do CAIC
>     têm local ≠ responsável (funcionam no CMEI Lucineia 35010633, CMEI Jonas Abib 35010839 e EM Aníbal
>     Ferreira 35191644). Multisseriadas: só EM Maria Apparecida Camargo de Souza (35438259): "Pré I/Pré II"
>     e "2º/3º ano".
>   - `turmas_por_etapa` (view: contagem por escola/etapa) e `metadados` (versão/data por tabela).
>   - **Acesso confirmado:** RLS "leitura publica" + GRANT SELECT para `anon`; o schema está exposto na API.
>     Testado: `GET /rest/v1/escolas?select=…&ativa=eq.true` com header `Accept-Profile: dados_gerais` e
>     `apikey: <chave publishable>` devolve 66; `turmas_por_etapa` e `metadados` também respondem.
>   - Chave publishable (pública por natureza, vai para o navegador): `sb_publishable_6mh1ihgP81j4FAKc26DxOQ_aONil94m`.
> - **App hoje:** `src/hooks/useSchoolsData.ts` baixa o CSV da planilha (`1I3W6LJtNyeTfzXdo5gh4xiAy9IuKw-Fyp1luA4e753A`)
>   e `src/lib/csvParser.ts` monta `School` (`src/types/school.ts`). A planilha tem os mesmos 67 (IDs
>   numéricos 1–70, faltando 11, 19 e 47); o CAIC aparece como "CAIC (⚠ Prédio Desativado)" — o aviso
>   está **no nome**, não no código.
> - **`School.id` numérico é chave no aparelho do usuário:** `school-favorites` (array de ids em ordem),
>   `school-distances` e `cachedDistances_<lat>_<lng>` (objetos `{[id]: …}`). Trocar o id para o código INEP
>   **exige migrar** esses dados, senão o professor perde favoritos e distâncias (e a API de rotas é paga).
> - Usos de campos: tags de nível (`src/lib/schoolTags.ts`), filtros em `src/pages/Index.tsx` e `Lista.tsx`
>   (níveis pelos contadores, gestão por `outsourced`), `MapView.tsx` (cor do marcador pelos contadores),
>   `SchoolDetailModal.tsx` (telefone+ramal, polo), `SearchBar.tsx` (busca em nome/bairro/terceirizada),
>   analytics enviam `school.id`. Cache do PWA da planilha em `vite.config.ts` (`google-sheets-cache`).
> - **Decisões do usuário (2026-11-10):**
>   1. **Vagas de campanha ficam para depois.** Não existem no Supabase; não há campanha ativa (a última
>      acabou em 22/12/2025). O app deixa de ler a planilha por completo e funciona sem vagas; o mecanismo
>      de campanha permanece no código. Uma tabela de vagas no Supabase será um plano à parte.
>   2. **CAIC continua aparecendo**, com aviso de prédio desativado (67 escolas no app).
>   3. **Turmas contam pela escola responsável** (`codigo_inep`). Quem abre o CAIC cai no endereço real
>      (prédio desativado), e no detalhe vê onde as turmas estão sediadas, **com link**.
>      *Premissa a confirmar no cenário de interface:* o link abre o detalhe da escola-sede dentro do app.
> - Sem dependência nova: a leitura é `fetch` puro na API REST (são 2 GETs), sem `@supabase/supabase-js`.

## ▶ Ponto de retomada

- **Atualizado:** 2026-11-10 — pausado pelo usuário para dar lugar ao plano do design system (2026-11-10-design-system-coruja.md); ao retomar, usar as classes de token novas nos componentes
- **Etapa 1 — Camada de dados do Supabase e tabela de IDs antigos** (`opus`) — não iniciada
- **Próxima ação:** aguardar aprovação do usuário; depois abrir a Etapa 1 gravando as sub-tarefas aqui.
- **Tocados e não verificados:** nenhum
- **Em execução:** nenhum subagente
- **Esperando o usuário:** aprovação do plano e dos cenários de interface

## Progresso

- [ ] 1. Camada de dados do Supabase e tabela de IDs antigos — `opus`
- [ ] 2. Troca da fonte: app lê o Supabase, id vira código INEP, migração do aparelho — `opus` *(depende de 1)*
- [ ] 3. CAIC desativado e turmas sediadas em outro prédio — `opus` *(depende de 2)* · ⛔ portão: conferência visual do detalhe do CAIC
- [ ] 4. Fechamento: documentação, Vercel e portão final — `opus` *(depende de 3)* · ⛔ portão: variáveis na Vercel antes de publicar

## Etapas

### Etapa 1 — Camada de dados do Supabase e tabela de IDs antigos

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** — · **Portão:** —

**Objetivo:** existem funções puras, testadas, que buscam e convertem os dados do Supabase em `School`,
e uma tabela fixa "ID antigo da planilha → código INEP" com função de migração do `localStorage`. Nada
ligado à tela ainda.

**Especificação:**

- **Contexto:** preparar, sem mudar o comportamento do app, tudo o que a Etapa 2 vai plugar. Ver o bloco
  *Contexto investigado* para schema, URL e chave.
- **Ler:** `src/types/school.ts`, `src/lib/csvParser.ts` (mapeamento atual de campos), `src/hooks/useSchoolDistances.ts`
  (formato dos caches), `src/hooks/useFavorites.ts`, `.env.example`, `src/vite-env.d.ts`.
- **Criar:**
  - `src/lib/escolasSupabase.ts`:
    - `buscarDadosEscolas(url, chave, fetchFn = fetch)` → faz em paralelo
      `GET {url}/rest/v1/escolas?select=*&order=nome` e
      `GET {url}/rest/v1/turmas?select=codigo_inep,codigo_inep_local,etapa,nome_turma,ano_letivo`,
      ambos com headers `apikey: <chave>` e `Accept-Profile: dados_gerais`; erro HTTP vira `Error` com
      mensagem em português.
    - `montarEscolas(escolas, turmas)` → `School[]`: considera só o **maior `ano_letivo`** presente;
      contadores de nível pela escola **responsável** (`codigo_inep`); `lat`/`lng` com `Number()`;
      `sector` = `String(setor)`; `polo` = `secretaria_polo`; `outsourced` = `terceirizada ?? undefined`;
      `phone` = `telefone ?? ""`; `extension` = undefined; e campos novos opcionais em `School`:
      `active: boolean` (de `ativa`), `note?: string` (de `observacao`), `hostedAt?: string[]` (códigos
      INEP **distintos** de `codigo_inep_local` diferentes da própria escola, em ordem estável).
      Multisseriada: deduz os níveis pelo `nome_turma` ("Pré I/Pré II" → pre1+pre2; "2º/3º ano" → ano2+ano3;
      separador `/`); nome que não casar é ignorado com `console.warn`.
  - `src/lib/idsLegados.ts`: `ID_LEGADO_PARA_INEP: Record<number, string>` com **as 67 entradas** e
    `migrarArmazenamentoLocal(storage: Storage)`: converte `school-favorites` (mantém a ordem; descarta id
    sem correspondência), `school-distances` e toda chave `cachedDistances_*` (renomeia as chaves internas
    para o INEP). Idempotente: valor já em INEP fica como está. Grava uma marca (`school-ids-version` = `"inep"`)
    e não roda de novo.
    - **Como gerar a tabela:** baixar o CSV da planilha (URL em `src/hooks/useSchoolsData.ts`) e casar cada
      linha com `dados_gerais.escolas` primeiro pela coluna `ID_SAEB` (quando preenchida = INEP), depois por
      nome normalizado (sem acento, sem título "Profª/Prof./Dr./Pe./Da./Frei/Mons.", sem " / CAIC"). Pares
      conhecidos que exigem cuidado: 6 "Aníbal Ferreira Lima / CAIC" → 35191644; 10 "CAIC" → 35234990;
      33 "CMEI Lessa" → 35004045; 34 "Lucineia … / CAIC" → 35010633; 27 "Joaquim Pereira Silva" → 35410676.
      Conferir que são 67 pares, INEP sem repetição, todos existentes no banco.
  - Testes: `src/lib/escolasSupabase.test.ts` e `src/lib/idsLegados.test.ts`.
  - `src/vite-env.d.ts` e `.env.example`: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` (com
    comentário: chave pública de leitura, não é segredo; em produção fica na Vercel). Preencher o `.env`
    local com os valores do Contexto.
- **Não fazer:** ligar nada na tela; apagar `csvParser`; mexer no Supabase (nenhuma escrita/migration).
- **Convenções:** AGENTS.md regras 6–8; testes de `src/lib/` em Vitest ambiente `node`.

**Critérios de aceite:**

- [ ] **Comportamento:** com fixture (2 escolas + turmas de 2026 e 2027, uma turma do CAIC hospedada em
  outro prédio e uma multisseriada), `montarEscolas` devolve contadores só de 2027, pela responsável;
  `hostedAt` do CAIC lista o prédio-sede; "Pré I/Pré II" soma 1 em `pre1` e em `pre2`; `lat` é `number`.
- [ ] **Comportamento:** `buscarDadosEscolas` com `fetchFn` falso envia os dois headers e lança erro legível em 500.
- [ ] **Comportamento:** `Object.keys(ID_LEGADO_PARA_INEP).length === 67` e os 67 valores são distintos.
- [ ] **Comportamento:** `migrarArmazenamentoLocal` sobre um storage falso com `school-favorites=[10,1]`
  e `cachedDistances_-22.9_-45.4={"1":{…}}` resulta em `["35234990","35073179"]` e chave `"35073179"`;
  segunda execução não altera nada.
- [ ] **Dado real (one-liner, não teste):** `buscarDadosEscolas` + `montarEscolas` contra o Supabase
  devolve 67 escolas, 66 `active`, CAIC com `hostedAt` de 3 códigos.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só arquivos novos de `src/lib/`, `src/types/school.ts`, `src/vite-env.d.ts`, `.env.example`.

---

### Etapa 2 — Troca da fonte: app lê o Supabase, id vira código INEP, migração do aparelho

**Executor:** `opus` · **Depende de:** 1 · **Paralelo com:** — · **Portão:** —

**Objetivo:** o app carrega as 67 escolas do Supabase, `School.id` é o código INEP (string), e quem já
tinha favoritos/distâncias os mantém. A planilha não é mais acessada.

**Especificação:**

- **Contexto:** plugar a camada da Etapa 1. A troca do tipo do id atravessa vários arquivos; o
  verificador de tipos (`npm run typecheck`) aponta todos.
- **Ler:** `src/hooks/useSchoolsData.ts`, `src/main.tsx`, `src/hooks/useFavorites.ts`,
  `src/hooks/useSchoolDistances.ts`, `src/lib/distanceMatrix.ts`, `src/components/{MapView,PrioritiesList,SchoolDetailModal,SchoolListCard,SearchBar}.tsx`,
  `src/pages/{Index,Lista,Favoritos}.tsx`, `src/config/campaign_config.ts`, `vite.config.ts`, `playwright.config.ts`, `e2e/fumaca.spec.ts`.
- **Fazer:**
  - `School.id: string`; `FavoriteSchool.schoolId: string`; ajustar todos os usos (favoritos, distâncias,
    `distanceMatrix`, props `onToggleFavorite`/`onRemoveFavorite`, analytics).
  - Chamar `migrarArmazenamentoLocal(localStorage)` em `src/main.tsx` **antes** do `render` (os hooks leem o
    `localStorage` no estado inicial).
  - `useSchoolsData`: usar `buscarDadosEscolas(import.meta.env.VITE_SUPABASE_URL, …KEY)` + `montarEscolas`;
    manter os mesmos toasts de erro/lista vazia (texto "Nenhuma escola encontrada"); remover o log de campanha.
  - Vagas: sem fonte. Remover `vacancyColumnHeader` de `CampaignConfig`/`CAMPAIGNS` e do hook; `vacancies`
    fica `undefined`. Não mexer na interface de campanha (fica inerte, nenhuma campanha está ativa).
  - Apagar `src/lib/csvParser.ts` e `src/lib/csvParser.test.ts` (ficam órfãos).
  - `vite.config.ts`: trocar a regra `docs.google.com` por uma `NetworkFirst` para
    `^https://[a-z0-9]+\.supabase\.co/rest/v1/.*` (`cacheName: "escolas-supabase"`, 1 h, 5 entradas,
    `networkTimeoutSeconds: 5`) — o app continua abrindo sem rede com o último dado.
  - `playwright.config.ts`: no `webServer.env`, `VITE_SUPABASE_URL=https://supabase.teste.invalid` e uma
    chave fictícia. Criar `e2e/fixtures/escolas.ts` (3–4 escolas reais copiadas do banco, incluindo CAIC,
    Abdias 35073179 e Lucineia 35010633, + turmas) e um helper que intercepta `**/rest/v1/**` com
    `page.route`. O e2e **nunca** chama o Supabase real.
  - Novo `e2e/escolas.spec.ts` com os cenários abaixo.
- **Não fazer:** UI do CAIC/turmas sediadas (Etapa 3); ramal (some — o banco não tem); tabela de vagas.
- **Convenções:** AGENTS.md (teste de interface, mudanças cirúrgicas); remova só o que ficou órfão.

**Cenários de interface** — tag `@escolas`:

1. Visitante sem dados salvos abre `/lista` → vê as escolas da fixture pelos nomes do Supabase.
2. Visitante com `school-favorites=[1,34]` (IDs antigos) no `localStorage` abre `/favoritos` → vê Abdias
   em 1º e Lucineia em 2º.
3. API do Supabase responde 500 → aparece o aviso "Erro ao carregar escolas".
4. Visitante abre `/lista`, abre uma escola e a favorita → em `/favoritos` ela aparece; o `localStorage`
   guarda o código INEP.

**Critérios de aceite:**

- [ ] **Comportamento:** `npm run typecheck` sem erro; `grep -r "docs.google.com" src vite.config.ts` vazio.
- [ ] **Comportamento:** cenários `@escolas` passam; `@fumaca` continua passando (com a interceptação).
- [ ] **Dado real:** `npm run dev` + navegador: a lista mostra 67 escolas (contagem na tela/console), o
  mapa posiciona marcadores (conferir 2–3 escolas contra `link_google_maps`).
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e escolas` e `--build` (mexeu em configuração).

---

### Etapa 3 — CAIC desativado e turmas sediadas em outro prédio

**Executor:** `opus` · **Depende de:** 2 · **Paralelo com:** — · **Portão:** conferência visual do usuário

**Objetivo:** escola inativa aparece com aviso; o detalhe de uma escola cujas turmas funcionam em outro
prédio mostra onde, com link que abre o detalhe da escola-sede.

**Especificação:**

- **Contexto:** decisões 2 e 3 do Contexto. Hoje o aviso do CAIC vinha escrito no nome da planilha; agora
  vem de `School.active === false` e `School.note`.
- **Antes de escrever markup:** invocar `frontend-design` com `args` = `design-system/README.md`. Seguir
  padrões existentes (Badge do card/modal); sem canvas, salvo se surgir decisão visual nova.
- **Alterar:** `src/components/SchoolListCard.tsx`, `src/components/SchoolDetailModal.tsx`,
  `src/components/PrioritiesList.tsx`, `src/components/SearchBar.tsx` (resultado), e onde o modal é aberto
  (`src/pages/Index.tsx`, `Lista.tsx`, `Favoritos.tsx`) para permitir trocar a escola exibida.
  - Inativa: selo "Prédio desativado" no card, no resultado da busca, na lista de prioridades e no modal;
    no modal, o texto de `note`.
  - `hostedAt` não vazio: seção no modal "Turmas funcionando em" com o nome de cada escola-sede como link;
    clicar troca o modal para aquela escola (analytics `view_school` normal).
  - Marcador no mapa do CAIC: manter a cor por nível; não esconder.
- **Não fazer:** mudar contagem/filtros de nível; esconder o CAIC.

**Cenários de interface** — tag `@caic`:

1. Visitante abre `/lista` → o card do CAIC mostra "Prédio desativado".
2. Visitante abre o detalhe do CAIC → vê o aviso, a observação e "Turmas funcionando em" com Lucineia,
   Jonas Abib e Aníbal Ferreira.
3. No detalhe do CAIC, clica em "Aníbal Ferreira Lima" → o detalhe passa a mostrar a EM Aníbal Ferreira.
4. Visitante abre o detalhe de uma escola ativa sem turmas fora → não vê selo nem a seção.

**Critérios de aceite:**

- [ ] **Comportamento:** cenários `@caic` passam.
- [ ] **Interface:** capturas do card e do modal do CAIC (celular e desktop) conferidas contra o design system.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e caic`
- [ ] ⛔ **Usuário:** aprova as capturas (veredito de gosto).

---

### Etapa 4 — Fechamento: documentação, Vercel e portão final

**Executor:** `opus` · **Depende de:** 3 · **Paralelo com:** — · **Portão:** variáveis na Vercel

**Objetivo:** documentação reflete a nova fonte; produção tem o que precisa para funcionar.

**Especificação:**

- `ref/PRD.md` §3.1: escolas e turmas vêm do banco oficial da SME (Supabase), atualizado pela SME sem
  publicar código; turmas pela escola responsável; CAIC/inativas com aviso e link para a sede; ramal sai.
  §3.7: vagas de campanha sem fonte até haver tabela própria.
- `ref/DOC.md`: Visão (não é mais planilha), seção Dados (endpoint, schema `dados_gerais`, headers,
  `montarEscolas`, ano letivo = maior presente, id = código INEP), `localStorage` (`school-ids-version`,
  ids agora INEP), remover "Sem banco de dados", variáveis `VITE_SUPABASE_*`, cache do PWA, e2e com
  `page.route`, "Nova campanha" (precisa de fonte de vagas).
- `.github/maintenance.yml`: item "Remover migração de IDs antigos (`src/lib/idsLegados.ts`)" com `due`
  2027-06-30 — depois disso quase todo aparelho já migrou.
- `node .claude/scripts/portao.mjs --final`.
- ⛔ **Usuário:** cadastrar na Vercel (Production e Preview) `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` **antes** de publicar — sem elas o app abre sem escolas.

## Encerramento do plano

- [ ] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [ ] `CHANGELOG.md` — entrada única em `[Unreleased]`: escolas vêm do cadastro oficial da Secretaria
  (localização conferida, turmas de 2027); favoritos preservados; CAIC com aviso e link para onde as
  turmas funcionam; ramal deixa de aparecer; vagas de campanha temporariamente sem fonte
- [ ] `ref/DOC.md` / `ref/PRD.md` — Etapa 4
- [ ] `.github/maintenance.yml` — Etapa 4
- [ ] Migrations: nenhuma (o app só lê o Supabase)
- [ ] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->
