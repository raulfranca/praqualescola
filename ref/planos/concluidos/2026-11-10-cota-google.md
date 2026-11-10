---
status: concluido
revezamento: aguardando_usuario
criado: 2026-11-10
demanda: Fase 1 do controle da cota do Google — cache compartilhado, função de servidor, contador com três estados, painel /admin, testes sem Google
---

# Plano — Controle da cota do Google

> **Demanda original:** o dono já recebeu uma conta de ~R$ 400 da API de distâncias do Google. Quer: (1) medir em tempo real o consumo da cota; (2) reaproveitar cálculos de endereços iguais ou próximos entre aparelhos; (3) regra de projeto que impeça testes de gastar cota; (4) gatilho automático que, perto do limite, troca para um cálculo aproximado. Decisão: **ficar sempre dentro da cota grátis**.
>
> **Contexto investigado:** o desenho aprovado é `ref/specs/2026-11-10-cota-google-design.md` — **leia-o antes de qualquer etapa**; ele manda em caso de dúvida. Achados-chave:
> - Hoje o navegador chama a Distance Matrix direto: `src/lib/distanceMatrix.ts` (lotes de 25, fallback linha reta × 1,3), orquestrado por `src/hooks/useSchoolDistances.ts` (cache local `cachedDistances_<lat>_<lng>`, completa escolas faltantes). 67 escolas → 67 unidades por endereço. Cota grátis 10.000/mês.
> - Limite "1 endereço por dia" em `src/lib/utils.ts` (`canSetNewAddress`, `recordAddressSetTimestamp`) e `src/components/HomeLocationInput.tsx`; atalho `/dev` sem senha em `src/components/SearchBar.tsx` → `src/pages/Index.tsx` (`devModeEnabled`). Ambos saem.
> - Funções Vercel ficam em `api/` (exemplo: `api/maintenance.ts`, edge). O `vite` local não roda `api/`.
> - Supabase "Dados" (ref `fvyholoabfjjynrycvof`) é o único projeto e é produção. Schemas da SME: `dados_gerais` (substituído inteiro pelo Apps Script). Extensões: `pgcrypto`, `uuid-ossp`. Acesso administrativo via MCP do Supabase.
> - e2e: `playwright.config.ts` (porta 8090; **recusa rodar se existir pasta `supabase/`** sem banco local — não criar essa pasta), `e2e/fixtures/escolas.ts` (`interceptarSupabase`, `marcarMigrado`), `e2e/distancias.spec.ts` (hoje pode chamar a Distance Matrix real para 1 escola).
> - Nome pedido pelo dono: tudo que for criado no banco leva `praqualescola` (schema) ou `pqe_` (prefixo).
> - Arquitetura do banco decidida no planejamento: tabelas no schema **`praqualescola`** (não exposto na API REST); acesso só por funções **`public.pqe_*`** (`security definer`, `EXECUTE` só para `service_role`), chamadas pelo servidor com a chave secreta via `/rest/v1/rpc/pqe_*`. Nada disso é acessível com a chave publishable.

## ▶ Ponto de retomada

- **Atualizado:** 2026-11-10 — plano concluído
- **Encerramento do plano** (`opus`) — concluído
  - [x] E.1 Portão `--final` (verde: lint, tipos, testes, build, e2e)
  - [x] E.2 `CHANGELOG.md` `[Unreleased]`
  - [x] E.3 `ref/DOC.md` e `ref/PRD.md`
  - [x] E.4 `.github/maintenance.yml` (`revisar-cota-google`; `addressSetDate` já sai pelo recomeço e pelo item `remover-recomeco-aparelho`)
  - [x] E.5 Frontmatter `concluido` + `git mv` para `concluidos/`
- **Próxima ação:** nenhuma — plano concluído
- **Tocados e não verificados:** nenhum (só documentação após o portão final)
- **Em execução:** nenhum subagente
- **Esperando o usuário:** nada

## Progresso

- [x] 1. Banco: schema `praqualescola` e funções `pqe_*` — `opus` · ⛔ portão: dono aprova o SQL antes de aplicar no Dados
- [x] 2. Lógica pura da cota (grade, estados, estimativa) — `opus`
- [x] 3. Trava: e2e nunca chama o Google — `opus` *(paralelo com 2)*
- [x] 4. Função `api/distancias` com Routes API — `opus` *(depende de 1, 2)*
- [x] 5. App usa a função; selo "aproximado"; limite passa a 3 endereços/dia — `opus` *(depende de 3, 4)*
- [x] 6. APIs do painel: login, resumo, forçar aproximado, conferir com o Google — `opus` *(depende de 1)*
- [x] 7. Rascunho visual do painel `/admin` — `opus` *(paralelo com 2–6)* · ⛔ portão: dono aprova o visual
- [x] 8. Painel `/admin` na tela, substituindo `/dev` — `opus` *(depende de 6, 7)*
- [x] 9. Configuração externa e prova real no preview da `dev` — `opus` *(depende de 5, 8)* · ⛔ portão: dono cria chaves/segredos e confere

## Etapas

### Etapa 1 — Banco: schema `praqualescola` e funções `pqe_*`

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** — · **Portão:** dono aprova o SQL antes de `apply_migration`

**Objetivo:** existem no Dados as tabelas do cache, do contador e dos limites, acessíveis só pelo servidor.

**Especificação:**

- **Contexto:** guardar distâncias por célula de grade (~200 m), contar unidades gastas no mês da cota do Google (fuso `America/Los_Angeles`), limitar abuso por hash de IP e por tentativas de senha, e guardar a configuração (modo aproximado forçado).
- **Ler:** desenho §5.3, §5.5, §5.6, §6; `ref/DOC.md` §4.
- **Alterar:** criar `db/migrations/20261110_pqe_cota.sql` (pasta `db/`, **nunca** `supabase/`).
- **Fazer:**
  - `create schema praqualescola`; `revoke all` de `anon`/`authenticated`; RLS ligado em todas as tabelas, sem políticas.
  - Tabelas (nomes livres, sugestão): `celulas` (id da célula como texto `"<i>_<j>"`, centro lat/lng, criada_em); `distancias` (célula, `codigo_inep`, metros, segundos, lat/lng da escola usados no cálculo, calculado_em; PK célula+inep); `uso_mensal` (mês `AAAA-MM`, unidades, acertos_cache, calculos_google, calibrado_em); `config` (chave/valor: `modo_forcado`); `limites` (hash, janela, contagem — serve para IP da função e para tentativas de login).
  - Funções `public.pqe_*`, `security definer`, `set search_path = ''`, `revoke execute from public, anon, authenticated`, `grant execute to service_role`:
    - `pqe_reservar(unidades int, limite int) → bool` — atômica (`update ... where unidades + n <= limite returning`), cria a linha do mês se faltar;
    - `pqe_devolver(unidades int)` — estorna reserva quando o Google falha;
    - `pqe_buscar(celula text, vizinhas text[]) → setof (celula, inep, metros, segundos, lat, lng)`;
    - `pqe_gravar(celula, centro, linhas jsonb)` — upsert;
    - `pqe_contar_acerto()`; `pqe_limite(hash text, janela text, maximo int) → bool` (incrementa e diz se passou);
    - `pqe_resumo() → jsonb` (mês, unidades, acertos, cálculos, modo_forcado, calibrado_em); `pqe_config_definir(chave, valor)`; `pqe_calibrar(unidades int)`.
  - Mostrar o SQL ao dono (portão) e só então aplicar com `apply_migration` do MCP no projeto `fvyholoabfjjynrycvof`.
- **Não fazer:** tocar `dados_gerais`; expor o schema na API; criar pasta `supabase/`.
- **Convenções:** regra 4 do AGENTS (segredos); `get_advisors` (security) depois de aplicar.

**Critérios de aceite:**

- [ ] **Comportamento:** via `execute_sql` com `set role service_role`: `pqe_reservar(67, 100)` → true, segunda chamada → false; `pqe_resumo()` mostra 67; `pqe_devolver(67)` volta a 0. Limpar o mês de teste ao final.
- [ ] **Comportamento:** com `set role anon`, `select public.pqe_resumo()` falha por permissão; `select * from praqualescola.distancias` falha.
- [ ] **Comportamento:** `get_advisors` sem alerta novo de segurança nos objetos `pqe_*`/`praqualescola`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só `db/migrations/` e o plano.

---

### Etapa 2 — Lógica pura da cota

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 3 · **Portão:** —

**Objetivo:** funções puras e testadas que servidor e app compartilham.

**Especificação:**

- **Ler:** desenho §5.2, §6; `src/lib/distanceMatrix.ts` (fallback atual).
- **Alterar:** criar `src/lib/cota.ts` e `src/lib/cota.test.ts`.
- **Fazer:**
  - `celulaDe(lat, lng)` → `{ id, centro }` numa grade de ~200 m (passo em graus: 0,0018 lat; lng corrigido por `cos(lat)` fixo da região, ~0,00195). Determinístico.
  - `celulasVizinhas(id)` → as 8 vizinhas (modo Economia).
  - `estadoDaCota({ unidades, cota: 10000, custoEndereco, modoForcado })` → `'normal' | 'economia' | 'aproximado'` (Economia ≥ 8.000; Aproximado quando `unidades + custoEndereco > 9500` ou forçado).
  - `estimativaAproximada(origem, escola)` → `{ distanceInKm: haversine × 1,3, durationInMinutes: ceil(km / 30 × 60), aproximado: true }`.
  - `mesDaCota(data)` → `AAAA-MM` no fuso `America/Los_Angeles`.
  - Importável por `api/` (sem dependência de DOM nem de `@/` dentro do arquivo).
- **Não fazer:** mexer em hooks ou componentes.

**Critérios de aceite:**

- [ ] **Comportamento:** testes cobrem: dois pontos a 50 m na mesma célula; pontos a 400 m em células diferentes e vizinhas; `estadoDaCota` nos limiares 7999/8000/9433+67; `mesDaCota('2026-12-01T05:00:00Z')` = `2026-11`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só `src/lib/cota*`.

---

### Etapa 3 — Trava: e2e nunca chama o Google

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 2 · **Portão:** —

**Objetivo:** qualquer requisição de teste ao Google é bloqueada e reprova o teste.

**Especificação:**

- **Ler:** `e2e/*.spec.ts`, `e2e/fixtures/escolas.ts`, `playwright.config.ts`, `ref/DOC.md` §6.
- **Alterar:** `e2e/fixtures/` (novo `base.ts` com `test` estendido), todas as specs passam a importar `test`/`expect` dele; `AGENTS.md` (seção *Teste de interface*: regra "e2e nunca chama Google nem `/api/` real"); `ref/DOC.md` §6.
- **Fazer:** fixture automática (`auto: true`) que faz `page.route` em `*.googleapis.com`, `maps.gstatic.com`, `routes.googleapis.com` e `**/api/distancias**`/`**/api/admin/**` sem interceptação explícita → `abort` e registra; ao fim do teste, `expect(bloqueadas).toEqual([])` só para os domínios **pagos** (o mapa abortado não reprova, só é bloqueado). Dica: aborta o script do Maps → a app não deve quebrar (já não depende do mapa).
- **Não fazer:** mudar o comportamento da app.

**Critérios de aceite:**

- [ ] **Comportamento:** um teste temporário que faz `fetch('https://routes.googleapis.com/...')` na página falha com a mensagem da trava; removido depois.
- [ ] **Comportamento:** `npx playwright test` inteiro passa, e o relatório não mostra nenhuma requisição concluída a `googleapis.com`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --final` não é necessário aqui; rodar `node .claude/scripts/portao.mjs` + `npx playwright test`.

---

### Etapa 4 — Função `api/distancias` com Routes API

**Executor:** `opus` · **Depende de:** 1, 2 · **Paralelo com:** — · **Portão:** —

**Objetivo:** endpoint que devolve distâncias de uma célula, pelo cache ou pelo Google, sem nunca passar da cota.

**Especificação:**

- **Ler:** desenho §5.1–5.5; `api/maintenance.ts`; `src/lib/escolasSupabase.ts` (como ler escolas); `src/lib/cota.ts`; docs da Routes API `computeRouteMatrix` (REST `https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix`, header `X-Goog-FieldMask`, até 625 elementos/requisição com origem única — conferir limites atuais).
- **Alterar:** criar `api/distancias.ts`, `api/_lib/supabase.ts` (RPC com chave secreta), `api/_lib/google.ts`, `api/_lib/ip.ts` (hash SHA-256 de IP + segredo); testes `api/**/*.test.ts` com `fetch` simulado (ajustar `vitest` `include` se preciso); `.env.example` (variáveis de servidor **sem** `VITE_`: `GOOGLE_ROUTES_API_KEY`, `SUPABASE_SECRET_KEY`, `PQE_HASH_SECRET`).
- **Fazer:**
  - `POST { lat, lng }` (o servidor arredonda para a célula; nunca guarda a coordenada recebida). Validar faixa de Pindamonhangaba (rejeitar fora de uma caixa generosa).
  - Ler escolas (inep, lat, lng) de `dados_gerais.escolas` com a publishable.
  - `pqe_resumo` → estado (`estadoDaCota`). `pqe_buscar` (célula; em Economia, + vizinhas, pega a mais próxima que cubra as escolas).
  - Escolas faltantes ou com lat/lng diferente da gravada → precisam de cálculo. Se estado ≠ aproximado e `pqe_limite(ip, dia, N)` ok e `pqe_reservar(faltantes, 9500)` ok → Google a partir do **centro da célula**; erro → `pqe_devolver` e estimativa; sucesso → `pqe_gravar`. Senão → estimativa para as faltantes.
  - Acerto total de cache → `pqe_contar_acerto`.
  - Resposta: `{ estado, distancias: { [inep]: { distanceInKm, durationInMinutes, aproximado } } }`. Estimativas nunca gravadas.
  - Sem chaves configuradas → responde só estimativas (nunca 500).
- **Não fazer:** tocar o app; usar a chave `VITE_`.

**Critérios de aceite:**

- [x] **Comportamento (testes com fetch simulado):** cache completo → 0 chamadas ao Google e `pqe_contar_acerto`; 1 escola faltando → Google com 1 destino, reserva 1; `pqe_reservar` false → estimativas marcadas `aproximado`, 0 chamadas ao Google; Google 429/erro → `pqe_devolver` chamado e estimativas; corpo sem chaves de ambiente → estimativas, status 200.
- [x] **Portão:** `node .claude/scripts/portao.mjs --build`
- [x] **Escopo:** `api/`, `.env.example`, config do vitest se preciso.

---

### Etapa 5 — App usa a função; selo "aproximado"; limite passa a 3 endereços/dia

**Executor:** `opus` · **Depende de:** 3, 4 · **Paralelo com:** — · **Portão:** —

**Objetivo:** o app calcula distâncias só pela função, mostra quando são aproximadas e se recupera sozinho.

**Especificação:**

- **Ler:** `src/hooks/useSchoolDistances.ts`, `src/lib/distanceMatrix.ts`, `src/components/HomeLocationInput.tsx`, `src/lib/utils.ts`, onde `distanceInKm`/`durationInMinutes` aparecem (`grep`), `design-system/README.md`, `e2e/distancias.spec.ts`.
- **Alterar:** `useSchoolDistances.ts` (chama `POST /api/distancias`; função ausente/erro de rede → `estimativaAproximada` local); remover `src/lib/distanceMatrix.ts`; guardar `aproximado` por escola no `localStorage`; se há entradas aproximadas e a resposta nova vem real, substituir (pedir de novo ao abrir com casa definida, no máximo 1 vez por sessão); **limite por aparelho: 3 endereços novos por dia** (decisão do dono, 2026-11-10: limita até o uso legítimo, porque a cota é pequena) — em `utils.ts`, trocar o par `canSetNewAddress`/`recordAddressSetTimestamp` por um contador do dia (chave nova, ex. `enderecos-do-dia` = `{ data, quantidade }`; a antiga `addressSetDate` deixa de ser escrita); conta cada endereço novo definido, inclusive os servidos pelo cache; voltar a um endereço já no cache local do aparelho não conta; vira à meia-noite local; aviso no `HomeLocationInput` com quantos restam/quando volta; com sessão do painel `/admin` válida o limite não se aplica (substitui o `/dev`; ligar isso na Etapa 8); `HomeLocationInput.tsx` (sai a prop `devModeEnabled`); selo "aproximado" onde distância/tempo aparecem (lista, detalhe da escola) + aviso curto no modal de casa quando a resposta vier aproximada; e2e.
- **Fazer:** invocar `frontend-design` com `args: design-system/README.md` antes do selo. Atualizar `e2e/distancias.spec.ts` para interceptar `/api/distancias` (respostas real e aproximada).
- **Não fazer:** mexer no `/dev` (Etapa 8) além de remover a prop `devModeEnabled` do `HomeLocationInput`; Places continua igual.

**Cenários de interface** — tag `@distancias`:

1. Visitante com casa salva e cache faltando uma escola abre a lista → a escola aparece com distância (resposta interceptada).
2. Visitante define a casa e a função responde `estado: aproximado` → lista mostra distâncias com selo "aproximado" e o modal avisa que são estimadas.
3. Visitante com distâncias aproximadas salvas abre o app e a função responde real → o selo some.
4. Visitante define 3 endereços diferentes no mesmo dia → os três calculam; no 4º vê o aviso de limite diário e o campo fica bloqueado até amanhã.
5. Função indisponível (rota abortada) → app mostra distâncias aproximadas, sem erro.

**Critérios de aceite:**

- [ ] **Comportamento:** cenários 1–5 passam.
- [ ] **Comportamento:** `grep -r "DistanceMatrix\|canSetNewAddress" src` sem resultados; teste de unidade do contador do dia (3 permitidos, 4º bloqueado, zera no dia seguinte).
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e distancias` e `--build`.

---

### Etapa 6 — APIs do painel

**Executor:** `opus` · **Depende de:** 1 · **Paralelo com:** 2–5 · **Portão:** —

**Objetivo:** login por senha conferida no servidor e endpoints protegidos do painel.

**Especificação:**

- **Ler:** desenho §5.3, §5.4; `api/_lib/` da Etapa 4 (se já existir, reaproveitar; senão criar `api/_lib/supabase.ts` igual).
- **Alterar:** `api/admin/login.ts`, `api/admin/painel.ts`, `api/admin/google.ts`, `api/_lib/token.ts`, testes; `.env.example` (`PQE_ADMIN_PASSWORD`, `PQE_ADMIN_TOKEN_SECRET`, `GOOGLE_MONITORING_CREDENTIALS` — JSON da conta de serviço, `GOOGLE_CLOUD_PROJECT`).
- **Fazer:**
  - `login`: compara em tempo constante; `pqe_limite(hash ip, 'login', 5)` por 15 min; devolve token HMAC-SHA256 com expiração de 8 h.
  - `painel` GET (token): `pqe_resumo` + estado; POST `{ modoForcado: bool }` → `pqe_config_definir`.
  - `google` GET (token): lê Cloud Monitoring (`serviceruntime.googleapis.com/api/request_count`, `consumed_api`, do 1º do mês da cota até agora) para Routes, Maps JavaScript e Places; assina o JWT da conta de serviço com WebCrypto (sem dependência nova, se possível). Se só houver contagem de requisições, devolver também a estimativa em unidades arredondada para cima (documentar a conversão). POST `{ calibrar: true }` → `pqe_calibrar(unidades estimadas da Routes)`.
  - Sem token ou expirado → 401, sem dados.
- **Não fazer:** UI.

**Critérios de aceite:**

- [ ] **Comportamento (testes):** senha errada → 401; 6ª tentativa → 429; senha certa → token; token adulterado/expirado → 401 nos três endpoints; POST de modo forçado chama `pqe_config_definir`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --build`

---

### Etapa 7 — Rascunho visual do painel `/admin`

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** 2–6 · **Portão:** dono aprova o visual

**Objetivo:** visual do painel aprovado antes de construir.

**Especificação:**

- **Fazer:** skill `mock-canvas` com os tokens de `design-system/`. Telas: pedido de senha; painel com seção "Cota do Google" (barra unidades/cota/limite, estado com cor, economia do cache, interruptor "forçar modo aproximado", botão "conferir com o Google" com o resultado e "calibrar"); espaço reservado para seções futuras (telemetria). Mobile primeiro.
- **Não fazer:** código no repositório (o rascunho vive no canvas).

**Critérios de aceite:**

- [ ] Dono aprovou uma variação (registrar o link do canvas e a escolha no Diário).

---

### Etapa 8 — Painel `/admin` na tela, substituindo `/dev`

**Executor:** `opus` · **Depende de:** 6, 7 · **Paralelo com:** — · **Portão:** —

**Objetivo:** digitar `/admin` na busca abre o pedido de senha e depois o painel aprovado.

**Especificação:**

- **Ler:** `src/components/SearchBar.tsx`, `src/pages/Index.tsx`, `src/App.tsx`, rascunho aprovado (Diário da Etapa 7), `design-system/README.md`.
- **Alterar:** `SearchBar.tsx` (`/dev` → `/admin`; some todo o modo desenvolvedor), `Index.tsx` (sai `devModeEnabled`), novos componentes do painel; token em `sessionStorage`.
- **Fazer:** `frontend-design` com `args: design-system/README.md`. Painel em diálogo/página conforme o rascunho; usa as APIs da Etapa 6.

**Cenários de interface** — tag `@admin`:

1. Visitante digita `/admin` + Enter → vê pedido de senha; a busca não mostra sugestões de escola.
2. Senha errada (API interceptada 401) → mensagem de erro, sem painel.
3. Senha certa → painel mostra unidades do mês, estado e economia (respostas interceptadas).
4. Liga "forçar modo aproximado" → POST enviado com `modoForcado: true` e o estado mostra Aproximado.
5. "Conferir com o Google" → mostra os números devolvidos.
6. Digitar `/dev` → nada acontece (comportamento de busca normal).

**Critérios de aceite:**

- [ ] **Comportamento:** cenários 1–6 passam; `grep -r "devMode" src` sem resultados.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e admin` e `--build`.

---

### Etapa 9 — Configuração externa e prova real no preview da `dev`

**Executor:** `opus` · **Depende de:** 5, 8 · **Paralelo com:** — · **Portão:** dono executa os passos no Google Cloud e na Vercel

**Objetivo:** o caminho real funciona no preview da `dev`, calibrado, com as travas do Google configuradas.

**Especificação:**

- **Fazer:**
  - Escrever um passo a passo curto (no chat, para leigo) para o dono: criar chave de servidor só com Routes API (sem restrição de referenciador); ativar Routes API; criar conta de serviço com "Monitoring Viewer" e baixar o JSON; tirar "Distance Matrix API" das APIs permitidas da chave do navegador; teto diário ~3.300 elementos/dia (ou o equivalente por minuto) na Routes API; cadastrar na Vercel (Production + Preview) `GOOGLE_ROUTES_API_KEY`, `SUPABASE_SECRET_KEY`, `PQE_HASH_SECRET`, `PQE_ADMIN_PASSWORD`, `PQE_ADMIN_TOKEN_SECRET`, `GOOGLE_MONITORING_CREDENTIALS`, `GOOGLE_CLOUD_PROJECT`.
  - Depois que o dono confirmar e fizer push/deploy da `dev` (commit e push são do dono na máquina local): no preview, abrir `/admin`, "conferir com o Google", "calibrar"; definir uma casa → 1º cálculo vai ao Google (unidades sobem 67); repetir o mesmo endereço em outra aba anônima → acerto de cache (unidades não sobem).
- **Não fazer:** publicar na `main`.

**Critérios de aceite:**

- [ ] **Comportamento:** no preview, `pqe_resumo()` mostra +67 após o 1º cálculo e +0 e `acertos_cache` +1 após o 2º (conferir via `execute_sql`).
- [ ] **Comportamento:** a chave do navegador recusa Distance Matrix (conferido pelo dono no Console ou por erro esperado).

## Encerramento do plano

- [x] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [x] `CHANGELOG.md` — entrada única da feature em `[Unreleased]`, para leitor não técnico
- [x] `ref/DOC.md` (regra nova do Supabase: só lê `dados_gerais`, escreve só em `praqualescola` via `pqe_*`; variáveis de servidor; `api/`; `db/migrations/`; e2e sem Google) / `ref/PRD.md` (§2 privacidade e `/admin`; §3.3 servidor, cache compartilhado, modo aproximado, limite de 3 endereços novos/dia por aparelho; §3.3 ainda cita Distance Matrix em lotes de 25)
- [x] `.github/maintenance.yml` — revisar a tabela de preços/cota do Google (ex.: anual) e a remoção da chave `addressSetDate` antiga
- [x] Migrations aplicadas no Dados listadas no aviso final
- [x] Frontmatter → `status: concluido`; `git mv` deste arquivo para `ref/planos/concluidos/`

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->

### 2026-11-10 — Etapa 1 (`opus`)

- **Feito:** migration `pqe_cota` aplicada no Dados: schema `praqualescola` (celulas, distancias, uso_mensal, config, limites; RLS sem políticas) + funções `public.pqe_*` só para `service_role`.
- **Arquivos:** `db/migrations/20261110_pqe_cota.sql`
- **Desvios:** `pqe_buscar(p_celulas text[])` recebe todas as células de uma vez (o servidor escolhe a mais próxima). Assinaturas finais: `pqe_reservar(int,int)→bool`, `pqe_devolver(int)`, `pqe_buscar(text[])`, `pqe_gravar(text,float8,float8,jsonb)`, `pqe_contar_acerto()`, `pqe_limite(text,text,int)→bool`, `pqe_resumo()→jsonb`, `pqe_config_definir(text,jsonb)`, `pqe_calibrar(int)`.
- **Verificado:** reserva atômica, devolução, limite, anon/authenticated sem acesso, advisors (só INFO esperado; alerta de `public.rls_auto_enable` é pré-existente e falso positivo — função de event trigger).
- **Pendências:** o dono recusou duas vezes o SQL de limpeza dos dados de teste: restam célula `0_0` (inep fictício `x`) e linha zerada de `uso_mensal` do mês. Inofensivos (ids de célula reais nunca serão `0_0` perto de Pinda). Não tentar apagar de novo sem o dono pedir.

### 2026-11-10 — Etapa 2 (`opus`)

- **Feito:** `src/lib/cota.ts` com `celulaDe`, `celulasVizinhas`, `centroDaCelula`, `estadoDaCota`, `distanciaRetaKm`, `estimativaAproximada`, `mesDaCota` e constantes (`PASSO_LAT` 0,0018, `PASSO_LNG` 0,00195, `COTA_MENSAL`). Sem `@/` nem DOM.
- **Arquivos:** `src/lib/cota.ts`, `src/lib/cota.test.ts` (12 testes).
- **Desvios:** critério "400 m em células diferentes e vizinhas" lido como dois casos: 400 m → células diferentes (e não vizinhas, pois são ~2 células); um passo de grade → vizinha. `estimativaAproximada` arredonda km a 2 casas. `cota` é opcional em `estadoDaCota` (padrão 10.000).
- **Verificado:** vitest do arquivo (12/12) e portão verde.
- **Nota:** o arquivo do plano estava com acentuação corrompida (UTF-8 lido como cp1252); reconvertido.

### 2026-11-10 — Etapa 3 (`opus`)

- **Feito:** `e2e/fixtures/base.ts` (fixture automática `travaGoogle` em `context.route`): bloqueia Google e `/api/distancias|admin`; reprova serviço pago ou `/api/` sem `page.route` do teste. Todas as specs importam `test`/`expect` dele. Regra em `AGENTS.md` (Teste de interface) e `ref/DOC.md` §6.
- **Desvio (premissa errada do plano):** o app **depende** do script do mapa — `LoadScript` em `src/App.tsx` segura tudo em "Carregando...". Abortar o script quebrava os 16 e2e. Solução sem mudar o app: `playwright.config.ts` passa `VITE_GOOGLE_MAPS_API_KEY: "chave-ficticia"` (chave inválida não gasta cota) e a trava deixa passar só os arquivos de código do mapa (`maps/api/js?`, `maps-api-v3/api/js/`). O resto do Google é abortado.
- **Achado:** `e2e/distancias.spec.ts` chamava a Distance Matrix paga de verdade; agora aborta `DistanceMatrixService` explicitamente (app cai no aproximado). **Etapa 5: trocar isso por interceptação de `/api/distancias`.**
- **Verificado:** testes temporários (removidos): `fetch` a routes.googleapis.com e a `/api/distancias` sem interceptar reprovam com a mensagem da trava; `/api/distancias` interceptada passa. `npx playwright test` 16/16; portão verde.

### 2026-11-10 — Etapa 4 (`opus`)

- **Feito:** `api/distancias.ts` (edge, `POST {lat,lng}` → `{ estado, distancias: {[inep]: {distanceInKm, durationInMinutes, aproximado}} }`; 400 fora de Pinda, 405 sem POST, **503 só se não conseguir ler as escolas** — o app deve cair na estimativa local). Núcleo testável em `api/_lib/distancias.ts`; `api/_lib/{supabase,google,ip}.ts`. Routes API `TRAFFIC_UNAWARE` a partir do centro da célula.
- **Decisões:** limite por IP 30 idas ao Google/dia (janela `google:<dia UTC>`), cache sem limite; no estado aproximado o cache ainda é usado (só o Google não); Economia usa a vizinha mais próxima **que cubra todas** as escolas, senão a própria célula + Google; falha em `pqe_contar_acerto`/`pqe_gravar` não troca dados reais por estimativa. Supabase lido de `VITE_SUPABASE_URL`/`_PUBLISHABLE_KEY` no servidor; RPC só com header `apikey` (chave `sb_secret_`, sem `Authorization`) — **confirmar na Etapa 9**.
- **Fora do escopo previsto:** `TETO_MENSAL` exportado de `src/lib/cota.ts`; `tsconfig.app.json` passa a incluir `api` (antes `api/` não tinha checagem de tipos).
- **Verificado:** 15 testes (`api/_lib/distancias.test.ts`, `handler.test.ts`) cobrindo todos os critérios + coordenada exata nunca enviada, IP só como hash, Economia, escola com coordenada corrigida; portão `--build` verde. Testes ficam em `api/_lib/` (arquivo solto em `api/` viraria função na Vercel).
- **Não verificado:** empacotamento real na Vercel (import de `../../src/lib/cota`) e formato real da resposta do Google — Etapa 9.

### 2026-11-10 — Etapa 5 (`opus`)

- **Feito:** `useSchoolDistances` chama só `POST /api/distancias` (falha/resposta inválida → `estimativaAproximada` local); `aproximado` por escola no `localStorage`; aproximadas pedidas de novo 1×/sessão (`sessionStorage` `distancias-reais-repedidas`). `src/lib/distanceMatrix.ts` removido. Contador `enderecos-do-dia` em `utils.ts` (`enderecosRestantesHoje`, `registrarEnderecoNovo`, `LIMITE_ENDERECOS_POR_DIA` = 3) + `utils.test.ts`. `SeloAproximado.tsx` (par `info`) na lista, detalhe e prioridades; aviso `info` no modal e toast "Distâncias aproximadas". Sai a prop `devModeEnabled` do `HomeLocationInput` (o state em `Index.tsx` fica para a Etapa 8).
- **Achados fora do previsto:** (1) `SchoolDetailModal` e `PrioritiesList` chamavam a Distance Matrix a cada abertura — vazamento de cota; agora leem `distanciaSalva`. (2) `/lista` definia a casa sem calcular (distâncias da casa antiga, sem limite); `Lista.tsx` recebe as mesmas props do mapa. Formatadores `formatarDistancia`/`formatarDuracao` passaram a `distanceCalculator.ts`.
- **Decisões:** `onCalculateDistances` devolve `{ aproximado }` e nunca falha (sem toast de erro). Contador conta ao pedir à função (endereço não cacheado no aparelho), não depende da resposta. Campo bloqueado com limite atingido mesmo com casa definida ("Remover endereço" continua).
- **e2e:** Places simulado por Autocomplete falso (`addInitScript` reafirma `google.maps.places` a cada 20 ms; `window.__escolherLugar`). Chip da casa corta o endereço em 18 caracteres — seletor `/Minha Casa|Pindamon/`.
- **Verificado:** `@distancias` 6/6; e2e completo 20/20; portão `--build --e2e distancias` verde; `grep DistanceMatrix|canSetNewAddress src` = 0; capturas do selo e do aviso conferidas (padrão das pílulas existentes). `ref/DOC.md` §2–4 ajustado (chaves do aparelho, fluxo das distâncias).
- **Não verificado:** isenção do limite com sessão do `/admin` (Etapa 8).

### 2026-11-10 — Etapa 6 (`opus`)

- **Feito:** `api/_lib/admin.ts` (token `<expira ms>.<HMAC base64url>`, 8 h; senha comparada por SHA-256 em tempo constante; `autorizado` lê `Authorization: Bearer`; `rpcDoServidor`), `api/_lib/monitoring.ts` (JWT RS256 por WebCrypto → `oauth2.googleapis.com/token`, escopo `monitoring.read`; `request_count`/`consumed_api` agrupado por serviço desde `inicioDoMesDaCota`), `api/admin/{login,painel,google}.ts` (edge). `LIMIAR_ECONOMIA` exportado de `cota.ts`. `.env.example` e DOC §3/§5.
- **Respostas:** `login` POST `{senha}` → `{token, expiraEm}` (401/429/503). `painel` GET → `{resumo, estado, escolas, cota, economiaAPartirDe, teto}`; POST `{modoForcado: bool}` → mesmo corpo. `google` GET → `{uso: {desde, ate, requisicoes: {routes, mapas, places}}, unidadesRoutesEstimadas, calibrado, resumo}`; POST `{calibrar: true}` calibra. 401 `{erro: "Não autorizado"}` sem token válido.
- **Decisões:** toda tentativa de login conta no limite (janela `login:<bloco de 15 min>`), inclusive a certa; banco indisponível no login → 503 (fecha). Serviços: Routes `routes.googleapis.com`, mapa `maps-backend.googleapis.com`, Places `places-backend` + `places.googleapis.com`. Estimativa = requisições × escolas.
- **Verificado:** `api/_lib/admin.test.ts` 8/8 (todos os critérios + IP só como hash, mês da cota no Pacífico com horário de verão); portão `--build` verde.
- **Não verificado (Etapa 9):** nomes reais dos serviços no Monitoring, `alignmentPeriod` de um mês inteiro aceito pela API, resposta real do token OAuth.

### 2026-11-10 — Etapa 7 (`opus`)

- **Feito:** canvas https://claude.ai/artifact/8ZEJNuSFgmRDfbWN2WQMaZ (slug `3d2ff7aa-108f-44c9-8955-0b475c89da32`, versão `1794334888-7bf6`): `Senha.dc.html`, `Main.dc.html` (A "Medidor"), `PainelB.dc.html` (B "Semáforo").
- **Escolha do dono: B "Semáforo".** Referência para a Etapa 8 (ler `project/PainelB.dc.html` e `project/Senha.dc.html` do canvas com `read_file`):
  - Cabeçalho: coruja em quadrado Céu 44px + eyebrow "Administração" + "Painel"; botão fantasma "Sair".
  - Bloco do estado no topo: fundo/texto do par semântico (Normal `sucesso`, Economia `aviso`, Aproximado `erro`), eyebrow "Cota do Google · agora", nome do estado 36px bold (+ " (forçado)"), frase explicativa.
  - Cartão: barra em três faixas (80/15/5 da cota, fundos `sucesso-bg`/`aviso-bg`/`erro-bg`) com marcador vertical na cor do estado em `unidades/cota`; lista Usado no mês / Economia a partir de 8.000 / Limite (Google pausa) 9.500 / Cota grátis 10.000; bloco Céu com reaproveitados, idas ao Google, unidades poupadas (acertos × escolas, `sucesso-fg`); "A cota renova em 1º de <mês>".
  - Cartão do interruptor `role="switch"` "Forçar modo aproximado"; cartão "Conferir com o Google" (botão secundário → lista Routes/Mapa/Busca, "Nosso contador" × "Pelo Google (≈)", botão principal "Ajustar contador para N" → aviso sucesso); bloco Céu "Em breve" (telemetria).
  - Senha: cartão central com coruja 64px, "Área do administrador", campo com label, erro em par `erro` ("Senha incorreta." / "Muitas tentativas. Tente de novo em 15 minutos."), botão principal "Entrar", fantasma "Voltar ao mapa".

### 2026-11-10 — Etapa 8 (`opus`)

- **Feito:** `src/lib/admin.ts` (sessão em `sessionStorage` `pqe-admin` `{token, expiraEm}`; `entrarAdmin`, `lerPainel`, `definirModoForcado`, `conferirGoogle`, `calibrarContador`; 401 apaga a sessão), `src/components/PainelAdmin.tsx` (diálogo de tela cheia: senha + painel "Semáforo"). `SearchBar` troca `/dev` por `/admin` e renderiza o painel (vale no mapa e na lista); `Index.tsx` sem `devModeEnabled`.
- **Isenção:** `HomeLocationInput` não aplica o limite de 3/dia com sessão válida (`temSessaoAdmin`). O limite do servidor por IP (30 idas ao Google/dia) continua valendo para o admin.
- **Desvios do rascunho:** cabeçalho com "Fechar" (fecha e mantém a sessão, para o admin definir endereços sem limite) e "Sair do painel" no fim (encerra a sessão). "Ajustar contador para N" só aparece se a estimativa do Google for maior que o nosso contador (`pqe_calibrar` nunca diminui).
- **Verificado:** `e2e/admin.spec.ts` 6/6 (cenários 1–6) + teste de isenção em `distancias.spec.ts` (falha sem a mudança, passa com ela); `@distancias` 7/7; portão `--build --e2e admin` verde; `grep devMode src` = 0; capturas 390px (senha com erro, painel Aproximado forçado, rodapé) conferidas contra o canvas B.

### 2026-11-10 — Etapa 9 (`opus`)

- **Feito pelo dono:** Routes API e Cloud Monitoring API ativadas; chave de servidor só com Routes; cotas ComputeRouteMatrix 3.300/dia e 700/min; chave do navegador sem Distance Matrix; conta de serviço `monitoring-viewer@pra-qual-escola.iam.gserviceaccount.com`; 7 variáveis na Vercel (Production + Preview, Secret exceto `GOOGLE_CLOUD_PROJECT`); push da `dev`. Preview: https://praqualescola-git-dev-raulcabrals-projects.vercel.app/
- **Problema e causa:** "Conferir com o Google" deu 502 → token OAuth 200, Monitoring 403: o papel Monitoring Viewer não estava no **IAM do projeto**. Dono concedeu; reproduzido localmente (script fora do repo) → 200.
- **Confirmado na prática (pendências das Etapas 4 e 6):** empacotamento na Vercel com import de `src/lib/cota` funciona; RPC só com header `apikey` (`sb_secret_`) funciona; Routes devolve 67 escolas com metros e segundos (594 m a 21,8 km); serviços do Monitoring `maps-backend.googleapis.com` e `places-backend.googleapis.com`; `alignmentPeriod` de um mês inteiro aceito.
- **Critérios:** `pqe_resumo()` 0 → após o 1º endereço e a repetição em aba anônima: unidades 67, calculos_google 1, acertos_cache 1, célula `-12737_-23311` com 67 escolas. Chave do navegador sem Distance Matrix: confirmado pelo dono.
- **Nota:** o JSON da conta de serviço apareceu na conversa (seleção do editor); o dono decidiu não trocar a chave (só leitura de métricas). Não insistir.

### 2026-11-10 — Encerramento (`opus`)

- **Portão `--final`:** verde (lint, tipos, testes, build, e2e).
- **Docs:** `CHANGELOG.md` `[Unreleased]`; `ref/DOC.md` §3 (`db/migrations/`), §4 (schema `praqualescola`, `pqe_*`, estados da cota), §6 (testes de `api/`); `ref/PRD.md` §2 (`/admin` substitui `/dev`, privacidade do endereço) e §3.3 (servidor, cache compartilhado, três estados, estimativa, 3 endereços/dia).
- **Agenda:** `revisar-cota-google` (2027-11-01). `addressSetDate` já é coberta por `remover-recomeco-aparelho`.
- **Migrations:** `db/migrations/20261110_pqe_cota.sql` já aplicada no Dados na Etapa 1 — nada pendente em produção.
