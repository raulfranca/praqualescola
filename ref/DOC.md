# Documentação Técnica — Pra Qual Escola

> Estado atual do sistema, para qualquer agente entender o projeto sem ler todo o código. O que o sistema deve fazer está em `ref/PRD.md`.

## 1. Visão geral

SPA (aplicação de página única) em React, empacotada como PWA, sem back-end próprio além de uma função de borda na Vercel. Escolas e turmas vêm do Supabase "Dados" da Secretaria de Educação (só leitura); o estado pessoal fica no `localStorage` do navegador.

## 2. Stack e dependências

- **Vite 6 + React 18 + TypeScript** (`strict: false`), roteamento com `react-router-dom` 6. Testes com Vitest 4 e Playwright.
- **UI:** Tailwind 3 + shadcn/ui (`src/components/ui/`, gerados pelo CLI do shadcn; não editar à mão sem motivo). **Só ficam os componentes em uso**: precisando de outro, adicione pelo CLI (`npx shadcn@latest add <nome>`, configuração em `components.json`), que traz junto a dependência do Radix.
- **Dependências enxutas:** nada instalado "para um dia usar". Para achar arquivos, exportações e pacotes sem uso: `npx knip` (ignore `.claude/`, `api/` e `design-system/tokens.css`, que são usados fora do grafo de imports do app).
- **Mapa:** `@react-google-maps/api` (Maps JavaScript, Places). Distâncias **nunca** saem do navegador para o Google: o app chama `POST /api/distancias` (Routes API no servidor, com cache compartilhado).
- **PWA:** `vite-plugin-pwa` (Workbox), `registerType: "prompt"`.
- **Medição:** `react-ga4` e `@vercel/analytics`.
- **Gerenciador de pacotes:** **npm** (`package-lock.json`). O projeto não usa Bun.

## 3. Estrutura de diretórios

```
api/maintenance.ts     Função de borda da Vercel: lê o Edge Config (modo manutenção)
api/distancias.ts      Função de borda: distâncias pela Routes API, com cache e cota (núcleo em api/_lib/)
api/campanha.ts        Campanha no ar com as vagas (GET público, cache de 60 s na borda; falha → {campanha:null})
api/admin/             Painel: login (senha → token HMAC de 8 h), painel (resumo, modo forçado), google (Cloud Monitoring, calibrar), campanhas (listar, editar, arquivar)
api/_lib/              Núcleo testável das funções (arquivo solto em api/ vira função na Vercel)
db/migrations/         SQL do schema praqualescola, aplicado à mão no Supabase "Dados" (não é pasta supabase/)
db/campanhas/          Carga de cada campanha (CSV + SQL) e o passo a passo (README.md); PDFs de origem em ref/documentos/<ano>/
public/version.json    Título e subtítulo do aviso de nova versão
src/main.tsx           Consulta /api/maintenance antes de montar o app; inicia o GA
src/App.tsx            Providers, LoadScript do Google Maps, rotas
src/pages/             Index (mapa), Lista, Favoritos, NotFound
src/components/        Componentes do app; ui/ = shadcn (só os usados)
src/contexts/          FilterContext (filtros, em sessionStorage), CampaignContext (campanha no ar, useCampaign)
src/hooks/             Dados (useSchoolsData), casa, distâncias, favoritos, PWA
src/lib/               Lógica pura: escolasSupabase, recomeco, distanceCalculator, cota, campanha, camadas, marcadorEscola, schoolTags, utils
src/components/admin/  Aba Campanhas do painel e peças comuns do painel
e2e/                   Testes de navegador (Playwright)
```

## 4. Dados

- **Escolas e turmas:** projeto Supabase "Dados" da SME (ref `fvyholoabfjjynrycvof`), schema `dados_gerais`, alimentado por um Apps Script da planilha "dados-gerais" da SME, que substitui as tabelas inteiras a cada publicação. **O app só lê `dados_gerais`; nunca escreve nem cria migration ali** (não há pasta `supabase/` neste repositório). Acesso pela API REST com `fetch` puro, sem `@supabase/supabase-js`: `src/lib/escolasSupabase.ts` faz dois GETs em paralelo (`buscarDadosEscolas`: `escolas?select=*&order=nome` e `turmas?select=…`), com os headers `apikey: <chave publishable>` e `Accept-Profile: dados_gerais`; a leitura é liberada por RLS "leitura publica" para `anon`. `montarEscolas` junta as duas listas no tipo `School` (`src/types/school.ts`):
  - `id` = `codigo_inep` (texto). É a chave de favoritos e distâncias.
  - Turmas do **maior `ano_letivo` presente**, contadas pela escola responsável (`codigo_inep`); multisseriada é quebrada pelo `nome_turma` ("Pré I/Pré II", "2º/3º ano") e conta em cada nível.
  - `active` e `hostedAt` (códigos INEP dos prédios onde funcionam turmas com `codigo_inep_local` ≠ responsável — hoje só o CAIC).
  - `useSchoolsData` chama os dois e aplica as vagas da campanha no ar (`aplicarVagas`): `vacancies` só existe com campanha no ar (`extension`, o antigo ramal, fica sempre `undefined`, sem leitor).
  - **Limite de linhas:** as turmas vêm num único GET (839 em 2027); o PostgREST corta em 1000 por padrão. Item na agenda de manutenção.
- **Cota do Google (escrita do app):** tudo que o app grava no banco fica no schema **`praqualescola`** (não exposto na API REST; RLS sem políticas): `celulas` e `distancias` (cache compartilhado por célula de ~200 m), `uso_mensal` (unidades, idas ao Google, acertos de cache), `config` (modo forçado, calibração) e `limites` (contadores por hash de IP). O acesso é só pelas funções **`public.pqe_*`** (`security definer`, `EXECUTE` só para `service_role`), chamadas pelas funções de `api/` com `SUPABASE_SECRET_KEY` via `/rest/v1/rpc/pqe_*` (só header `apikey`). Nome novo no banco leva `praqualescola` ou `pqe_`. Migrations em `db/migrations/`, aplicadas pelo dono no Supabase. Estados da cota e grade de células em `src/lib/cota.ts` (Normal < 8.000 unidades; Economia reaproveita célula vizinha; Aproximado a partir de 9.500 ou forçado: só cache e linha reta × 1,3).
- **Campanhas e vagas** (`db/migrations/20261111_pqe_campanhas.sql`): `praqualescola.campanhas` (id texto, nome, descrição, início/fim `timestamptz`, `ligada`, `arquivada`) e `praqualescola.campanha_vagas` (campanha, `codigo_inep`, `vagas` cru; só positivo é vaga). Funções: `pqe_campanha_no_ar()` (datas **e** ligada **e** não arquivada; com duas, a de início mais cedo; devolve as vagas), `pqe_campanhas_admin()`, `pqe_campanha_atualizar(...)`, `pqe_campanha_arquivar(id, arquivada)` (só depois do fim; mensagens de erro em português, mostradas pelo painel). No app: `CampaignContext` faz uma busca a `/api/campanha` por abertura (erro → sem campanha); tipos e regras em `src/lib/campanha.ts` (espelho de `api/_lib/campanhas.ts`, porque `src/` não importa de `api/`). Datas do painel em horário de Brasília (`…-03:00`). Carga de campanha nova: `db/campanhas/README.md`.
- **No aparelho (`localStorage`):** `school-favorites` (códigos INEP em ordem de prioridade), `home-location`, `school-distances` (distâncias atuais; cada escola com `aproximado` quando é estimativa em linha reta), `cachedDistances_<lat>_<lng>` (cache por endereço, 5 casas decimais), `enderecos-do-dia` (`{ data, quantidade }`: limite de 3 endereços novos por dia no aparelho, vira à meia-noite local; voltar a um endereço já no cache não conta), `app-version-seen`, `school-data-version`, `tour-visto`, `dismissed_campaign_<id>`. A antiga `addressSetDate` não é mais escrita.
  - **Distâncias:** só `useSchoolDistances` calcula (pela função; sem ela, `estimativaAproximada` local). Detalhe da escola e prioridades leem o que está salvo (`distanciaSalva`), sem chamar nada. Distâncias aproximadas salvas são pedidas de novo uma vez por sessão (`sessionStorage` `distancias-reais-repedidas`).
  - **Cache de distâncias completado:** ao reutilizar um endereço, `useSchoolDistances` calcula só as escolas que faltam no cache (`escolasSemDistancia`) e grava nas duas chaves; escola nova no cadastro não fica de fora do filtro de distância.
  - **Recomeço único (troca planilha → Supabase, 2026-11):** `src/lib/recomeco.ts` (`recomecarAparelho`), chamado em `main.tsx` fora da manutenção, apaga favoritos, casa, distâncias e `addressSetDate` uma vez e grava `school-data-version = supabase`. Sem aviso na tela. Remoção do código prevista na agenda de manutenção.
  - **Tour de primeira visita:** `src/components/Tour.tsx`, montado na tela do mapa, ilumina os elementos marcados com `data-tour="<alvo>"` (a barra inferior e a lateral levam o mesmo alvo; vale o visível); etapa sem alvo, como a abertura, fica no centro da tela. `src/lib/tour.ts` guarda `tour-visto` e avisa quem depende dele: enquanto o tour está pendente, o convite para instalar, o aviso de campanha e o aviso de nova versão não aparecem. O de nova versão só aparece com o app instalado (`appInstalado` em `usePWAInstallPrompt.ts`).
  - **Ordem das camadas na abertura:** `src/lib/camadas.ts` tem sinais (`useSyncExternalStore`) entre componentes: `avisoCampanhaAberto` (o convite para instalar espera o aviso de campanha fechar). Aviso dispensado: `localStorage` `dismissed_campaign_<id>`.
- **Na sessão (`sessionStorage`):** `escola-filters-session`.

## 5. Infraestrutura e ambientes

- **Hospedagem:** Vercel. Todo push na `main` é publicado automaticamente. A `dev` é integração; publicar é mesclar `dev` na `main` (`git-deploy` na máquina, `publicar.yml` na nuvem).
- **Variáveis de ambiente** (modelo em `.env.example`; o `.env` não vai para o git):
  - `VITE_GOOGLE_MAPS_API_KEY`: chave do Google Maps. É pública por natureza (vai no JavaScript do navegador); a proteção é a **restrição por referenciador** no Google Cloud Console. São **duas chaves**: a de produção (na Vercel, Production e Preview) aceita só o domínio de produção e o preview da branch `dev` (`https://praqualescola-git-dev-raulcabrals-projects.vercel.app/*`); a de desenvolvimento fica só no `.env` local, aceita `http://localhost:8080/*` e `http://127.0.0.1:8090/*` e nunca vai para a Vercel nem para o git.
  - `VITE_GA_TRACKING_ID`: ID do Google Analytics 4.
  - `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`: endereço e chave *publishable* do Supabase "Dados" da SME. A chave é pública por natureza; a proteção é o RLS de só leitura. Sem elas o app abre sem escolas.
  - **Só no servidor** (nunca com `VITE_`): `GOOGLE_ROUTES_API_KEY`, `SUPABASE_SECRET_KEY` (executa as funções `pqe_*`), `PQE_HASH_SECRET` (hash do IP), `PQE_ADMIN_PASSWORD` e `PQE_ADMIN_TOKEN_SECRET` (painel `/admin`), `GOOGLE_MONITORING_CREDENTIALS` (JSON de conta de serviço com "Monitoring Viewer") e `GOOGLE_CLOUD_PROJECT`. Sem as do painel, `/api/admin/*` responde 503. O Monitoring só dá contagem de requisições: a calibração estima unidades da Routes como requisições × escolas (teto, arredonda para cima) e `pqe_calibrar` nunca diminui o contador.
  - Em produção, todas ficam em *Vercel > Settings > Environment Variables*.
- **Modo manutenção:** Edge Config da Vercel com `isUnderMaintenance`, `title`, `message`. Localmente (`vite`) a rota `/api/maintenance` não existe e o app abre normalmente.
- **Cache do PWA:** `version.json` em NetworkFirst (1 min); Google Maps em CacheFirst (1 ano); API REST do Supabase em NetworkFirst (`escolas-supabase`, 5 s de espera pela rede), que permite abrir sem conexão com as escolas da última visita.

## 6. Testes

Como rodar: `node .claude/scripts/portao.mjs`. Comandos em `.claude/loop.json`.

- **Unidade (Vitest):** `src/**/*.test.ts` e `api/**/*.test.ts`, ambiente `node`. Cobrem a lógica pura de `src/lib/` e o núcleo das funções em `api/_lib/` (banco e Google simulados).
- **Navegador (Playwright):** `e2e/`, servidor próprio na porta 8090. O servidor de teste usa chave do Google fictícia: o script do mapa carrega (o app espera por ele), mas o mapa não abre e nada gasta cota. Os testes não dependem do mapa. **Nunca tocam o Supabase real:** o servidor sobe com `VITE_SUPABASE_URL` fictícia e cada teste intercepta a API com `page.route` (`interceptarSupabase` em `e2e/fixtures/escolas.ts`, com um recorte de escolas e turmas reais); `marcarMigrado` evita o recomeço onde ele não é o assunto. Os testes começam com o tour de primeira visita já visto (fixture em `e2e/fixtures/base.ts`); a spec do tour desliga isso com `test.use({ tourVisto: false })`.
- **Trava da cota do Google:** toda spec importa `test`/`expect` de `e2e/fixtures/base.ts`. Uma fixture automática deixa passar só os arquivos de código do mapa e bloqueia o resto de `*.googleapis.com`/`*.gstatic.com` e `/api/distancias`/`/api/admin`; chamada a serviço pago (distâncias, rotas, Places) ou a `/api/` sem `page.route` no próprio teste reprova o teste. `/api/campanha` sem interceptação responde `{campanha:null}`; para testar com campanha no ar, `e2e/fixtures/campanha.ts`.

## 7. Convenções e padrões

- Alias `@/` → `src/`.
- Visual: regras em `design-system/README.md`, valores em `design-system/tokens.css` (hex); o app usa a cópia em HSL de `src/index.css` via classes do Tailwind, e `src/lib/designTokens.test.ts` garante que as duas não divergem. Fontes Inter e Work Sans empacotadas via `@fontsource` (funcionam offline).
- Textos de interface em português; muitos comentários e logs de console herdados estão em inglês.
- **Logs:** `console.log`/`console.debug` servem só para depuração local; o build de produção os remove (`esbuild.pure` em `vite.config.ts`). `console.warn`/`console.error` vão para produção — use-os para o que precisa ser visto lá.
- **Segurança das dependências:** `npm audit` deve ficar sem alertas *high*/*critical*. Os *moderate* restantes estão em ferramentas de build/lint (não chegam ao navegador) ou registrados em `.github/maintenance.yml`.
- Nova campanha: o agente carrega no banco pelo passo a passo de `db/campanhas/README.md` (nasce desligada); o dono liga pelo painel `/admin`. Sem publicar o app. "Campanha" nunca aparece em texto que o professor vê.
- Nova versão publicada: atualizar `public/version.json` (`version`, `title`, `subtitle`) junto com o `CHANGELOG.md`.

## 8. Estado de implementação

Todas as funcionalidades do PRD estão no ar (versão 2.0.0). Pontos conhecidos:

- Logs de depuração (`console.log` com emojis) espalhados pelos hooks — retirados do build de produção, mas ainda no código.
- `strict: false` no TypeScript: o typecheck pega pouco.
- O lint tem 6 avisos antigos (sem erros).
- O código do app sai num único arquivo JS de ~700 kB (~210 kB comprimido), acima do limite de aviso do Vite (500 kB). Não quebra nada; dividir em blocos (`manualChunks`) faria cada atualização baixar só o que mudou.
- `react-router-dom` 6 tem um alerta *moderate* (redirecionamento aberto via barra invertida em `<Link>`/`useNavigate`) corrigido só na v7. Não afeta o app hoje, que navega só para caminhos fixos; migrar para a v7 está na agenda de manutenção.
