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
api/admin/             Painel: login (senha → token HMAC de 8 h), painel (resumo, modo forçado), google (Cloud Monitoring, calibrar)
api/_lib/              Núcleo testável das funções (arquivo solto em api/ vira função na Vercel)
public/version.json    Título e subtítulo do aviso de nova versão
src/main.tsx           Consulta /api/maintenance antes de montar o app; inicia o GA
src/App.tsx            Providers, LoadScript do Google Maps, rotas
src/pages/             Index (mapa), Lista, Favoritos, NotFound
src/components/        Componentes do app; ui/ = shadcn (só os usados)
src/contexts/          FilterContext (filtros compartilhados, em sessionStorage)
src/hooks/             Dados (useSchoolsData), casa, distâncias, favoritos, campanha, PWA
src/lib/               Lógica pura: escolasSupabase, recomeco, distanceCalculator, cota, schoolTags, utils
src/config/            campaign_config.ts (campanhas)
e2e/                   Testes de navegador (Playwright)
```

## 4. Dados

- **Escolas e turmas:** projeto Supabase "Dados" da SME (ref `fvyholoabfjjynrycvof`), schema `dados_gerais`, alimentado por um Apps Script da planilha "dados-gerais" da SME, que substitui as tabelas inteiras a cada publicação. **O app só lê; nunca escreve nem cria migration ali** (não há pasta `supabase/` neste repositório). Acesso pela API REST com `fetch` puro, sem `@supabase/supabase-js`: `src/lib/escolasSupabase.ts` faz dois GETs em paralelo (`buscarDadosEscolas`: `escolas?select=*&order=nome` e `turmas?select=…`), com os headers `apikey: <chave publishable>` e `Accept-Profile: dados_gerais`; a leitura é liberada por RLS "leitura publica" para `anon`. `montarEscolas` junta as duas listas no tipo `School` (`src/types/school.ts`):
  - `id` = `codigo_inep` (texto). É a chave de favoritos e distâncias.
  - Turmas do **maior `ano_letivo` presente**, contadas pela escola responsável (`codigo_inep`); multisseriada é quebrada pelo `nome_turma` ("Pré I/Pré II", "2º/3º ano") e conta em cada nível.
  - `active`, `note` (observação) e `hostedAt` (códigos INEP dos prédios onde funcionam turmas com `codigo_inep_local` ≠ responsável — hoje só o CAIC).
  - `useSchoolsData` chama os dois. Vagas de campanha não têm fonte: `vacancies` fica `undefined` até existir tabela própria (e `extension`, o antigo ramal, fica sempre `undefined`, sem leitor).
  - **Limite de linhas:** as turmas vêm num único GET (839 em 2027); o PostgREST corta em 1000 por padrão. Item na agenda de manutenção.
- **No aparelho (`localStorage`):** `school-favorites` (códigos INEP em ordem de prioridade), `home-location`, `school-distances` (distâncias atuais; cada escola com `aproximado` quando é estimativa em linha reta), `cachedDistances_<lat>_<lng>` (cache por endereço, 5 casas decimais), `enderecos-do-dia` (`{ data, quantidade }`: limite de 3 endereços novos por dia no aparelho, vira à meia-noite local; voltar a um endereço já no cache não conta), `app-version-seen`, `school-data-version`. A antiga `addressSetDate` não é mais escrita.
  - **Distâncias:** só `useSchoolDistances` calcula (pela função; sem ela, `estimativaAproximada` local). Detalhe da escola e prioridades leem o que está salvo (`distanciaSalva`), sem chamar nada. Distâncias aproximadas salvas são pedidas de novo uma vez por sessão (`sessionStorage` `distancias-reais-repedidas`).
  - **Cache de distâncias completado:** ao reutilizar um endereço, `useSchoolDistances` calcula só as escolas que faltam no cache (`escolasSemDistancia`) e grava nas duas chaves; escola nova no cadastro não fica de fora do filtro de distância.
  - **Recomeço único (troca planilha → Supabase, 2026-11):** `src/lib/recomeco.ts` (`recomecarAparelho`), chamado em `main.tsx` fora da manutenção, apaga favoritos, casa, distâncias e `addressSetDate` uma vez e grava `school-data-version = supabase`. Se havia algo, `AvisoRecomeco` explica uma vez. Remoção do código prevista na agenda de manutenção.
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

- **Unidade (Vitest):** `src/**/*.test.ts`, ambiente `node`. Cobrem a lógica pura de `src/lib/`.
- **Navegador (Playwright):** `e2e/`, servidor próprio na porta 8090. O servidor de teste usa chave do Google fictícia: o script do mapa carrega (o app espera por ele), mas o mapa não abre e nada gasta cota. Os testes não dependem do mapa. **Nunca tocam o Supabase real:** o servidor sobe com `VITE_SUPABASE_URL` fictícia e cada teste intercepta a API com `page.route` (`interceptarSupabase` em `e2e/fixtures/escolas.ts`, com um recorte de escolas e turmas reais); `marcarMigrado` evita o aviso de recomeço onde ele não é o assunto.
- **Trava da cota do Google:** toda spec importa `test`/`expect` de `e2e/fixtures/base.ts`. Uma fixture automática deixa passar só os arquivos de código do mapa e bloqueia o resto de `*.googleapis.com`/`*.gstatic.com` e `/api/distancias`/`/api/admin`; chamada a serviço pago (distâncias, rotas, Places) ou a `/api/` sem `page.route` no próprio teste reprova o teste.

## 7. Convenções e padrões

- Alias `@/` → `src/`.
- Visual: regras em `design-system/README.md`, valores em `design-system/tokens.css` (hex); o app usa a cópia em HSL de `src/index.css` via classes do Tailwind, e `src/lib/designTokens.test.ts` garante que as duas não divergem. Fontes Inter e Work Sans empacotadas via `@fontsource` (funcionam offline).
- Textos de interface em português; muitos comentários e logs de console herdados estão em inglês.
- **Logs:** `console.log`/`console.debug` servem só para depuração local; o build de produção os remove (`esbuild.pure` em `vite.config.ts`). `console.warn`/`console.error` vão para produção — use-os para o que precisa ser visto lá.
- **Segurança das dependências:** `npm audit` deve ficar sem alertas *high*/*critical*. Os *moderate* restantes estão em ferramentas de build/lint (não chegam ao navegador) ou registrados em `.github/maintenance.yml`.
- Nova campanha: acrescentar em `src/config/campaign_config.ts`. **Antes, as vagas precisam de fonte** (tabela no Supabase, plano à parte): sem ela a campanha só mostra o banner.
- Nova versão publicada: atualizar `public/version.json` (`version`, `title`, `subtitle`) junto com o `CHANGELOG.md`.

## 8. Estado de implementação

Todas as funcionalidades do PRD estão no ar (versão 2.0.0). Pontos conhecidos:

- Logs de depuração (`console.log` com emojis) espalhados pelos hooks — retirados do build de produção, mas ainda no código.
- `strict: false` no TypeScript: o typecheck pega pouco.
- O lint tem 6 avisos antigos (sem erros).
- O código do app sai num único arquivo JS de ~700 kB (~210 kB comprimido), acima do limite de aviso do Vite (500 kB). Não quebra nada; dividir em blocos (`manualChunks`) faria cada atualização baixar só o que mudou.
- `react-router-dom` 6 tem um alerta *moderate* (redirecionamento aberto via barra invertida em `<Link>`/`useNavigate`) corrigido só na v7. Não afeta o app hoje, que navega só para caminhos fixos; migrar para a v7 está na agenda de manutenção.
