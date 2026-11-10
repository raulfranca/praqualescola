---
status: concluido
revezamento: aguardando_usuario
criado: 2026-11-10
demanda: O app passa a ler escolas e turmas do Supabase "Dados" (fonte oficial da SME) em vez da planilha Google ESCOLAS-PINDA, e nenhuma escola some por falta de distância calculada
---

# Plano — Escolas lidas do Supabase da SME

> **Demanda original:** O Supabase "Dados SME" é agora a fonte oficial de verdade sobre as escolas (dados
> cadastrais, geolocalização conferida e validada, turmas de 2027). O aplicativo deve ler de lá, e não
> mais da planilha Google ESCOLAS-PINDA. Total de 67 escolas (NAPs e Casa Verde não entram).
>
> **Revisão (2026-11-10, depois do design system):** o plano também deve resolver o caso das 3 escolas que
> somem com o filtro de distância, e ligar a interface atual (design system "Coruja e Mapa", versão 2.1.0)
> aos dados novos.
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
>   `school-distances` e `cachedDistances_<lat>_<lng>` (objetos `{[id]: …}`). Com o id virando código INEP,
>   esses dados viram lixo; pela decisão 5 eles são apagados, não convertidos. Outras chaves do aparelho
>   (`home-location`, `addressSetDate`, `app-version-seen`, avisos do PWA) estão em `src/hooks/` e `src/lib/utils.ts`.
> - **Bug das 3 escolas (confirmado no navegador do usuário, 2026-11-10):** o cache de distâncias do aparelho
>   tinha 64 escolas; a planilha tem 67. Faltavam 63 (CMEI Silvia Aparecida Quirino de Jesus), 69 (CMEI Jonas
>   Abib) e 70 (CMEI Neide Maria Pereira de Andrade), entradas posteriores ao cálculo. Causa: ao reutilizar o
>   endereço, `useSchoolDistances.calculateAndCacheDistances` devolve o cache sem conferir se cobre todas as
>   escolas, e o filtro de distância (`Index.tsx` e `Lista.tsx`) descarta escola sem `distanceInKm`. Os
>   botões "Mostrar N escolas" e a lista mostram 64. O recomeço da troca apaga esse cache, mas
>   **não resolve a causa**: toda escola nova cadastrada no banco depois repetiria o problema.
> - **Google Maps** é carregado no `App.tsx` (`LoadScript` envolve todas as rotas), então `/` e `/lista`
>   têm o `DistanceMatrixService` disponível. `useSchoolDistances` é usado nas duas páginas.
> - **Design system (2.1.0, concluído depois deste plano ser escrito):** cores por tokens Tailwind
>   (`bg-aviso-bg text-aviso-fg`, `text-primary`, `nivel-*`, `surface-*`); regras em `design-system/README.md`
>   (estados: par fundo suave + texto forte; selo em `--text-micro`, raio cheio). Testes `e2e/design.spec.ts`
>   (`@design`) e `e2e/fumaca.spec.ts` (`@fumaca`) abrem `/` e `/lista` e hoje **baixam a planilha real**:
>   depois da troca, precisam da mesma interceptação do Supabase.
> - **`playwright.config.ts`** já tem a função `envLocal()` (trava para projeto com Supabase local). Este
>   projeto não tem pasta `supabase/`, então ela devolve `{}` sem `.env.local`. As variáveis fictícias do e2e
>   entram **mescladas** com o que `envLocal()` devolve, sem remover a trava.
> - Usos de campos: tags de nível (`src/lib/schoolTags.ts`), filtros em `src/pages/Index.tsx` e `Lista.tsx`
>   (níveis pelos contadores, gestão por `outsourced`), `MapView.tsx` (cor do marcador pelos contadores),
>   `SchoolDetailModal.tsx` (telefone+ramal via `formatPhone`, polo), `SearchBar.tsx` (busca em
>   nome/bairro/terceirizada), analytics enviam `school.id`. Cache do PWA da planilha em `vite.config.ts`
>   (`google-sheets-cache`).
> - **Decisões do usuário (2026-11-10):**
>   1. **Vagas de campanha ficam para depois.** Não existem no Supabase; não há campanha ativa (a última
>      acabou em 22/12/2025). O app deixa de ler a planilha por completo e funciona sem vagas; o mecanismo
>      de campanha permanece no código. Uma tabela de vagas no Supabase será um plano à parte.
>   2. **CAIC continua aparecendo**, com aviso de prédio desativado (67 escolas no app).
>   3. **Turmas contam pela escola responsável** (`codigo_inep`). Quem abre o CAIC cai no endereço real
>      (prédio desativado), e no detalhe vê onde as turmas estão sediadas, **com link**.
>      *Premissa a confirmar no cenário de interface:* o link abre o detalhe da escola-sede dentro do app.
>   4. **Distâncias compartilhadas no Supabase** (uma tabela por endereço, reaproveitada entre usuários) é
>      ideia para um plano futuro, **fora deste**. Aqui o cache continua no aparelho.
>   5. **Recomeço do zero, sem migração (2026-11-10).** Na troca para o Supabase, o app apaga uma única vez os
>      dados do professor ligados às escolas: favoritos, endereço de casa, distâncias e a data da última troca
>      de endereço (para ele poder definir o endereço de novo no mesmo dia). "Como se todo mundo começasse uma
>      vida nova no app." Quem tinha algum desses dados vê **uma vez** um aviso explicando. Não há tabela de
>      IDs antigos nem conversão de dados.
> - Sem dependência nova: a leitura é `fetch` puro na API REST (são 2 GETs), sem `@supabase/supabase-js`.

## ▶ Ponto de retomada

- **Atualizado:** 2026-11-10 — plano concluído
- **Plano concluído** — todas as etapas fechadas, portão `--final` verde.
- **Próxima ação:** nenhuma; publicar é decisão do usuário.
- **Tocados e não verificados:** nenhum
- **Em execução:** nenhum subagente
- **Esperando o usuário:** nada
- **Lembrete Etapa 5:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` **já estão na Vercel** em All Environments (usuário, 2026-11-10); falta só um novo deploy para valerem. A chave do Google Maps recusa `127.0.0.1:8095` e o console do Google não aceita IP com porta curinga: e2e e testes locais ficam sem o fundo do mapa; é esperado e não bloqueia. `School.extension` ficou sem leitor (mencionar no fechamento).

## Progresso

- [x] 1. Distâncias completas: calcular só as escolas que faltam no cache — `opus` · pode ser publicada sozinha
- [x] 2. Camada de dados do Supabase e recomeço do aparelho — `opus`
- [x] 3. Troca da fonte: app lê o Supabase, id vira código INEP, recomeço com aviso — `opus` *(depende de 1 e 2)*
- [x] 4. CAIC desativado e turmas sediadas em outro prédio — `opus` *(depende de 3)* · ⛔ portão: conferência visual do detalhe do CAIC
- [x] 5. Fechamento: documentação, Vercel e portão final — `opus` *(depende de 4)* · ⛔ portão: variáveis na Vercel antes de publicar

## Etapas

### Etapa 1 — Distâncias completas: calcular só as escolas que faltam no cache

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 2 · **Portão:** —

**Objetivo:** com endereço de casa definido, toda escola carregada tem distância. Se o cache do aparelho não
cobre alguma, o app calcula **só as que faltam**, junta ao cache e grava. Corrige o caso 64 de 67 ainda com a
planilha, e depois da troca garante que escola nova cadastrada no Supabase não some para quem já tem endereço.

**Especificação:**

- **Contexto:** ver *Bug das 3 escolas* e *Google Maps* no Contexto. A correção mora no hook, para valer em
  `/` e em `/lista`.
- **Ler:** `src/hooks/useSchoolDistances.ts`, `src/lib/distanceMatrix.ts`, `src/hooks/useHomeLocation.ts`,
  `src/pages/Index.tsx` (uso do hook e filtro de distância), `src/pages/Lista.tsx`, `src/lib/utils.ts`
  (`recordAddressSetTimestamp`).
- **Fazer:**
  - Função pura exportada em `src/hooks/useSchoolDistances.ts` (ou `src/lib/distanceCalculator.ts`, onde ficar
    mais natural): `escolasSemDistancia(schools, distances)` → escolas cujo id não tem entrada no cache.
    Genérica no tipo do id (vai virar string na Etapa 3).
  - No hook, um efeito: quando há `homeLocation`, `schools` carregadas, `distances` não vazio (já houve cálculo
    para este endereço) e `escolasSemDistancia` não vazio, chama `calculateDistancesForSchools` **só com as
    que faltam**, mescla em `distances` e grava em `school-distances` **e** em `cachedDistances_<lat>_<lng>`
    do endereço atual. **Não** chama `recordAddressSetTimestamp` (não é troca de endereço).
  - `calculateAndCacheDistances`: ao achar o cache do endereço, se ele não cobre todas as escolas, completa da
    mesma forma antes de devolver `true`.
  - Proteção contra repetição: no máximo uma tentativa por conjunto de ids faltantes por montagem do hook
    (`useRef`). Escola cujo cálculo devolver número não finito não é gravada.
- **Não fazer:** mudar o cálculo completo, o fallback ou o filtro; mexer em interface; tabela no Supabase.
- **Convenções:** AGENTS.md regras 6–8; teste em Vitest ao lado do código.

**Cenários de interface** — tag `@distancias`:

1. Visitante com casa definida e `school-distances` (e o `cachedDistances_*` do mesmo endereço) cobrindo todas
   as escolas menos uma abre `/lista` → a escola que faltava aparece na lista com distância; o `localStorage`
   passa a ter a entrada dela nas duas chaves.
2. Mesmo estado, abre `/` e o painel de filtros → o botão mostra "Mostrar N escolas" com N = total de escolas.

*Nota:* até a Etapa 3 o e2e usa a planilha real; o cálculo da escola que falta usa a API do Google se a chave
local aceitar `127.0.0.1`, senão o fallback. O teste só confere que há distância, não o valor.

**Critérios de aceite:**

- [ ] **Comportamento:** teste unitário de `escolasSemDistancia` (nenhuma faltando, algumas, cache vazio).
- [ ] **Comportamento:** cenários `@distancias` passam; vistos falhando antes da correção.
- [ ] **Dado real:** no navegador local, com o cache de 64 do usuário reproduzido, a lista mostra 67.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e distancias`
- [ ] **CHANGELOG:** bullet em `[Unreleased]` › Corrigido: escolas novas deixam de sumir da lista para quem já
  tinha o endereço salvo.

---

### Etapa 2 — Camada de dados do Supabase e recomeço do aparelho

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 1 · **Portão:** —

**Objetivo:** existem funções puras, testadas, que buscam e convertem os dados do Supabase em `School`,
e uma função que apaga uma vez os dados antigos do aparelho e diz se havia algo. Nada ligado à tela ainda.

**Especificação:**

- **Contexto:** preparar, sem mudar o comportamento do app, tudo o que a Etapa 3 vai plugar. Ver o bloco
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
  - `src/lib/recomeco.ts`: `recomecarAparelho(storage: Storage): boolean`. Se a marca `school-data-version`
    já vale `"supabase"`, não faz nada e devolve `false`. Senão, apaga `school-favorites`, `home-location`,
    `school-distances`, `addressSetDate` e toda chave que começa com `cachedDistances_`; grava a marca; devolve
    `true` **só se** alguma dessas chaves existia (visitante novo não vê aviso). Conferir os nomes das chaves
    nos hooks antes de escrever (não supor). Não toca em outras chaves (`app-version-seen`, avisos do PWA etc.).
  - Testes: `src/lib/escolasSupabase.test.ts` e `src/lib/recomeco.test.ts`.
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
- [ ] **Comportamento:** `recomecarAparelho` sobre um storage falso com favoritos, casa, `addressSetDate`,
  `school-distances`, dois `cachedDistances_*` e `app-version-seen` → devolve `true`, apaga os seis primeiros,
  mantém `app-version-seen`, grava a marca; segunda execução devolve `false` e não altera nada; storage vazio
  devolve `false` e grava a marca.
- [ ] **Dado real (one-liner, não teste):** `buscarDadosEscolas` + `montarEscolas` contra o Supabase
  devolve 67 escolas, 66 `active`, CAIC com `hostedAt` de 3 códigos.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só arquivos novos de `src/lib/`, `src/types/school.ts`, `src/vite-env.d.ts`, `.env.example`.

---

### Etapa 3 — Troca da fonte: app lê o Supabase, id vira código INEP, recomeço com aviso

**Executor:** `opus` · **Depende de:** 1 e 2 · **Paralelo com:** — · **Portão:** conferência visual do aviso

**Objetivo:** o app carrega as 67 escolas do Supabase, `School.id` é o código INEP (string), o aparelho
recomeça do zero e quem tinha dados vê uma vez o aviso. A planilha não é mais acessada.

**Especificação:**

- **Contexto:** plugar a camada da Etapa 2. A troca do tipo do id atravessa vários arquivos; o
  verificador de tipos (`npm run typecheck`) aponta todos.
- **Ler:** `src/hooks/useSchoolsData.ts`, `src/main.tsx`, `src/hooks/useFavorites.ts`,
  `src/hooks/useSchoolDistances.ts`, `src/lib/distanceMatrix.ts`, `src/components/{MapView,PrioritiesList,SchoolDetailModal,SchoolListCard,SearchBar}.tsx`,
  `src/pages/{Index,Lista,Favoritos}.tsx`, `src/config/campaign_config.ts`, `vite.config.ts`, `playwright.config.ts`,
  `e2e/fumaca.spec.ts`, `e2e/design.spec.ts`.
- **Fazer:**
  - `School.id: string`; `FavoriteSchool.schoolId: string`; ajustar todos os usos (favoritos, distâncias,
    `distanceMatrix` (`SchoolDistanceResult.schoolId`), props `onToggleFavorite`/`onRemoveFavorite`, analytics).
  - Chamar `recomecarAparelho(localStorage)` em `src/main.tsx` **antes** do `render` (os hooks leem o
    `localStorage` no estado inicial) e passar o resultado para o `App` mostrar o aviso.
  - **Aviso de recomeço** (só quando `recomecarAparelho` devolveu `true`, uma vez): diálogo centralizado
    (`AlertDialog` do shadcn, já usado no app se houver; senão o `Dialog`), com a coruja pequena como no aviso de
    campanha. Texto: título "O app foi atualizado"; corpo "Agora as escolas vêm do cadastro oficial da
    Secretaria de Educação. Para começar, defina de novo o endereço de casa e marque suas escolas
    favoritas."; botão único "Entendi". Antes do markup, invocar `frontend-design` com `args` =
    `design-system/README.md`; seguir os tokens (sem token novo).
  - `useSchoolsData`: usar `buscarDadosEscolas(import.meta.env.VITE_SUPABASE_URL, …KEY)` + `montarEscolas`;
    manter o toast de erro "Erro ao carregar escolas"; lista vazia passa a dizer "Nenhuma escola encontrada"
    (sem "na planilha"); remover o log de campanha.
  - Vagas: sem fonte. Remover `vacancyColumnHeader` de `CampaignConfig`/`CAMPAIGNS` e do hook; `vacancies`
    fica `undefined`. Não mexer na interface de campanha (fica inerte, nenhuma campanha está ativa).
  - Apagar `src/lib/csvParser.ts` e `src/lib/csvParser.test.ts` (ficam órfãos).
  - `vite.config.ts`: trocar a regra `docs.google.com` por uma `NetworkFirst` para
    `^https://[a-z0-9]+\.supabase\.co/rest/v1/.*` (`cacheName: "escolas-supabase"`, 1 h, 5 entradas,
    `networkTimeoutSeconds: 5`) — o app continua abrindo sem rede com o último dado.
  - `playwright.config.ts`: `webServer.env` = `{ VITE_SUPABASE_URL: "https://supabase.teste.invalid",
    VITE_SUPABASE_PUBLISHABLE_KEY: "chave-ficticia", ...envLocal() }` (mantém a trava). Criar
    `e2e/fixtures/escolas.ts` (3–4 escolas reais copiadas do banco, incluindo CAIC 35234990, Abdias 35073179,
    Lucineia 35010633 e Jonas Abib 35010839, + turmas) e um helper que intercepta `**/rest/v1/**` com
    `page.route`. Usar o helper em **todos** os specs (`@fumaca`, `@design`, `@distancias` e os novos). O
    e2e **nunca** chama o Supabase real.
  - Novo `e2e/escolas.spec.ts` com os cenários abaixo.
- **Não fazer:** UI do CAIC/turmas sediadas (Etapa 4); ramal (some — o banco não tem); tabela de vagas.
- **Convenções:** AGENTS.md (teste de interface, mudanças cirúrgicas); remova só o que ficou órfão.

**Cenários de interface** — tag `@escolas`:

1. Visitante sem dados salvos abre `/lista` → vê as escolas da fixture pelos nomes do Supabase e **não** vê
   o aviso de recomeço.
2. Professor antigo (`school-favorites=[1,34]`, `home-location` e `cachedDistances_*` no `localStorage`) abre `/`
   → vê o aviso "O app foi atualizado"; clica "Entendi" → o aviso some; em `/favoritos` a lista está vazia;
   o mapa não tem casa definida. Recarrega a página → o aviso não volta.
3. API do Supabase responde 500 → aparece o aviso "Erro ao carregar escolas".
4. Visitante abre `/lista`, abre uma escola e a favorita → em `/favoritos` ela aparece; o `localStorage`
   guarda o código INEP.

Os cenários `@distancias` da Etapa 1 passam a usar a fixture e ids INEP, com a marca `school-data-version`
já gravada (senão o recomeço apagaria o cache que o teste prepara).

**Critérios de aceite:**

- [ ] **Comportamento:** `npm run typecheck` sem erro; `grep -r "docs.google.com" src vite.config.ts` vazio.
- [ ] **Comportamento:** cenários `@escolas` passam; `@fumaca`, `@design` e `@distancias` continuam passando
  (com a interceptação).
- [ ] **Dado real:** `npm run dev` + navegador: a lista mostra 67 escolas (contagem na tela/console), o
  mapa posiciona marcadores (conferir 2–3 escolas contra `link_google_maps`); com endereço de casa, o
  botão do filtro mostra "Mostrar 67 escolas".
- [ ] **Interface:** captura do aviso de recomeço (celular e desktop) conferida contra o design system.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e escolas` e `--build` (mexeu em configuração).
- [ ] ⛔ **Usuário:** aprova a captura e o texto do aviso.

---

### Etapa 4 — CAIC desativado e turmas sediadas em outro prédio

**Executor:** `opus` · **Depende de:** 3 · **Paralelo com:** — · **Portão:** conferência visual do usuário

**Objetivo:** escola inativa aparece com aviso; o detalhe de uma escola cujas turmas funcionam em outro
prédio mostra onde, com link que abre o detalhe da escola-sede.

**Especificação:**

- **Contexto:** decisões 2 e 3 do Contexto. Hoje o aviso do CAIC vinha escrito no nome da planilha; agora
  vem de `School.active === false` e `School.note`.
- **Antes de escrever markup:** invocar `frontend-design` com `args` = `design-system/README.md`. Seguir os
  padrões que o design system 2.1.0 já aplicou no card, no modal e na lista de prioridades; sem canvas,
  salvo se surgir decisão visual nova.
- **Alterar:** `src/components/SchoolListCard.tsx`, `src/components/SchoolDetailModal.tsx`,
  `src/components/PrioritiesList.tsx`, `src/components/SearchBar.tsx` (resultado), e onde o modal é aberto
  (`src/pages/Index.tsx`, `Lista.tsx`, `Favoritos.tsx`) para permitir trocar a escola exibida.
  - Inativa: selo "Prédio desativado" no card, no resultado da busca, na lista de prioridades e no modal.
    Estilo de estado do design system: `bg-aviso-bg text-aviso-fg`, raio cheio, texto de selo
    (`--text-micro`), mesma altura das etiquetas de nível. No modal, o texto de `note` como uma seção, no
    mesmo formato de rótulo + valor das seções existentes (ex.: "Polo").
  - `hostedAt` não vazio: seção no modal "Turmas funcionando em" com o nome de cada escola-sede como link
    (`text-primary`, sublinhado no foco/hover); clicar troca o modal para aquela escola (analytics
    `view_school` normal).
  - Telefone: sem ramal, `formatPhone` fica só com o número (remover o ramo do ramal se ficar órfão).
  - Marcador no mapa do CAIC: manter a cor por nível; não esconder.
- **Não fazer:** mudar contagem/filtros de nível; esconder o CAIC; criar token novo.

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

### Etapa 5 — Fechamento: documentação, Vercel e portão final

**Executor:** `opus` · **Depende de:** 4 · **Paralelo com:** — · **Portão:** variáveis na Vercel

**Objetivo:** documentação reflete a nova fonte; produção tem o que precisa para funcionar.

**Especificação:**

- `ref/PRD.md` §3.1: escolas e turmas vêm do banco oficial da SME (Supabase), atualizado pela SME sem
  publicar código; turmas pela escola responsável; CAIC/inativas com aviso e link para a sede; ramal sai.
  §3.7: vagas de campanha sem fonte até haver tabela própria. Seção de distâncias: escola nova ganha
  distância automaticamente para quem já tem endereço salvo. Registrar o recomeço de 2026 (dados do
  aparelho apagados uma vez, com aviso).
- `ref/DOC.md`: Visão (não é mais planilha), seção Dados (endpoint, schema `dados_gerais`, headers,
  `montarEscolas`, ano letivo = maior presente, id = código INEP), `localStorage` (`school-data-version`,
  ids agora INEP, recomeço único, cache de distâncias completado quando falta escola), remover "Sem banco
  de dados", variáveis `VITE_SUPABASE_*`, cache do PWA, e2e com `page.route`, "Nova campanha" (precisa de
  fonte de vagas).
- `.github/maintenance.yml`: item "Remover o recomeço do aparelho (`src/lib/recomeco.ts`) e o aviso" com
  `due` 2027-06-30 — depois disso quase todo aparelho já passou por ele. A marca `school-data-version` pode
  ficar gravada; o código que a lê sai.
- `node .claude/scripts/portao.mjs --final`.
- ⛔ **Usuário:** cadastrar na Vercel (Production e Preview) `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_PUBLISHABLE_KEY` **antes** de publicar — sem elas o app abre sem escolas.

## Encerramento do plano

- [x] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [x] `CHANGELOG.md` — em `[Unreleased]`: o bullet de Corrigido da Etapa 1 e uma entrada para a troca:
  escolas vêm do cadastro oficial da Secretaria (localização conferida, turmas de 2027); todos recomeçam
  do zero (endereço de casa e favoritos precisam ser definidos de novo, com aviso na primeira abertura); CAIC com aviso e link para onde as turmas funcionam; ramal deixa de aparecer; vagas de
  campanha temporariamente sem fonte
- [x] `ref/DOC.md` / `ref/PRD.md` — Etapa 5
- [x] `.github/maintenance.yml` — Etapa 5
- [x] Migrations: nenhuma (o app só lê o Supabase)
- [x] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->

**Etapa 1 — 2026-11-10.** `escolasSemDistancia` em `src/lib/distanceCalculator.ts` (+4 testes). Hook: `completarDistancias`
(só as faltantes, `useRef` por conjunto, ignora não finito) usado num efeito e no ramo de cache de `calculateAndCacheDistances`;
grava nas duas chaves. **Desvio 1:** o e2e revelou um 2º defeito — `initializeDistanceFilters` fixava `maxDistanceFilter`
com o intervalo provisório {0,10} (escolas ainda carregando) e escondia escolas > 10 km / 30 min. Correção em
`FilterContext.tsx` (só zera sem distâncias; `null` já é "sem limite") e chamadas em `Index`/`Lista`. **Desvio 2:** a causa
do "64 de 67" do usuário é o `parseCSV` (`split('\n')`) quebrando as linhas 63/69/70, que têm Enter no TELEFONE; não
corrigido (o parser sai na Etapa 3), então "dado real: 67" fica para a Etapa 3. e2e `@distancias` (2 cenários) visto
falhando antes de cada correção; portão `--e2e distancias` verde; suíte e2e completa 7/7. CHANGELOG: 2 bullets em Corrigido.

**Etapa 2 — 2026-11-10.** `src/lib/escolasSupabase.ts` (`buscarDadosEscolas`, `montarEscolas`, tipos `LinhaEscola`/`LinhaTurma`)
e `src/lib/recomeco.ts` (`recomecarAparelho`), 9 testes. `School` ganhou `active?`, `note?`, `hostedAt?` (opcionais para não
quebrar o `csvParser`). **Desvio:** `montarEscolas` devolve `EscolaSupabase` (= `School` com `id: string`), porque `School.id`
só vira string na Etapa 3. Latitude chega como **número** no JSON (não texto); `Number()` cobre os dois. Env: `VITE_SUPABASE_URL`
e `VITE_SUPABASE_PUBLISHABLE_KEY` em `vite-env.d.ts`, `.env.example` e `.env`. Dado real: 839 turmas, 67 escolas, 66 ativas,
CAIC `hostedAt` = 35010633/35010839/35191644, multisseriada 35438259 com pre1/pre2/ano2/ano3 = 1. **Atenção:** 839 turmas num
único GET, perto do limite padrão de 1000 linhas do PostgREST; avaliar na Etapa 5 (item de manutenção ou paginação). Portão verde.

**Etapa 3 — 2026-11-10.** `School.id` virou string (código INEP) em tipos, favoritos, distâncias, `distanceMatrix`, `MapView`
(ordenação de ids agora `.sort()`), `PrioritiesList`, `SchoolDetailModal`; alias `EscolaSupabase` removido. `useSchoolsData` lê o
Supabase; `vacancyColumnHeader` saiu de `campaign_config`; `csvParser(.test)` apagados. PWA: cache `escolas-supabase`. Recomeço em
`main.tsx` (só fora da manutenção) + `src/components/AvisoRecomeco.tsx` (Dialog com coruja, sem o X). e2e: `e2e/fixtures/escolas.ts`
(4 escolas + 49 turmas reais, `interceptarSupabase`, `marcarMigrado`); `@fumaca`/`@design`/`@distancias` interceptam; novo
`e2e/escolas.spec.ts` (4 cenários). Dado real (vite 8095 + Chrome): lista 67; com casa, "Mostrar 67 escolas" — fecha também o
critério da Etapa 1. Marcadores: posição vem direto de lat/lng do banco (não conferida contra o Google Maps, mapa sem tiles no teste).
Obs.: `portao.mjs --e2e "a|b"` quebra no Windows (o `|` vai para o shell); rodar uma tag por vez.

**Etapa 4 — 2026-11-10.** `src/components/SeloDesativado.tsx` (classes das etiquetas de nível + `bg-aviso-bg text-aviso-fg`; `--text-micro`
não tem utilitário Tailwind) em card, busca, prioridades e cabeçalho do modal. Modal: seções "Observação" e "Turmas funcionando em"
(botões-link `text-primary`) com props novas `schools`/`onSelectSchool` passadas por Index/Lista/Favoritos; `formatPhone` saiu.
Não há evento `view_school` no analytics: nada a disparar. `School.extension` ficou sem leitor (não apagado). Fixture e2e ganhou a
EM Aníbal Ferreira (dado real) + 1 turma. **Armadilha:** `Get-Content | Set-Content -Encoding utf8` no PowerShell 5.1 corrompeu os
acentos do modal (lê como ANSI) e pôs BOM; corrigido, e o e2e agora confere "Observação". Editar arquivo só com Edit/Write ou Node.
`@caic` 5/5, suíte e2e 15/15, portão verde. Capturas aprovadas pelo usuário.

**Etapa 5 — 2026-11-10.** PRD §3.1 (cadastro oficial, INEP, turmas pela responsável, inativa com selo "Prédio desativado" e link,
recomeço de 2026), §3.3 (escola nova ganha distância), §3.7 (vagas sem fonte), §3.8 (observação). DOC §1/§3/§4/§5/§6/§7/§8 (Supabase
só leitura, `montarEscolas`, `localStorage` com INEP e `school-data-version`, `VITE_SUPABASE_*`, cache `escolas-supabase`, e2e com
`page.route`). `maintenance.yml`: `remover-recomeco-aparelho` (2027-06-30) e `turmas-limite-1000-linhas` (2027-10-01), YAML validado.
CHANGELOG `[Unreleased]`: Adicionado/Alterado. Portão `--final` verde (lint, tipos, testes, build, e2e). Variáveis já na Vercel
(usuário); falta só publicar, que é decisão do usuário.
