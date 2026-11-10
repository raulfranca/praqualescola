---
status: concluido
revezamento: aguardando_usuario
criado: 2026-11-10
demanda: Aplicar o design system "Coruja e Mapa" em toda a interface e deixar em design-system/ só o que é atual
---

# Plano — Design system Coruja e Mapa no app

> **Demanda original:** Aplicar o novo design system (derivado do logotipo da coruja, `public/favicon.svg`) em
> toda a interface do app e atualizar o diretório `design-system/` para conter apenas o que é atual.
>
> **Contexto investigado:**
> - **Regras e valores:** `design-system/README.md` (regras de uso) e `design-system/tokens.css` (valores em hex,
>   nomes herdados do smepinda: `--primary`, `--surface*`, `--on-surface*`, `--nivel-*`, `--sucesso-*` etc.).
>   Canvas de referência: https://claude.ai/artifact/6bEELBi7G72pvwF13hWsYj (4 artboards: cores, tipografia,
>   componentes, app aplicado). `tokens.css` **não é importado** pelo app hoje.
> - **App hoje:** Tailwind 3.4 + shadcn. Cores em `src/index.css` como variáveis HSL do shadcn (`--primary: 195 85% 45%`,
>   azul-ciano antigo `#1ba3c6`) e consumidas em `tailwind.config.ts` como `hsl(var(--x))`, o que permite modificador
>   de opacidade (`bg-primary/10`). Tokens próprios: `favorite`, `orange`, `infantil`, `pre`, `fundamental`, `purple`.
> - **Colisão de nomes:** `--primary` existe nos dois sistemas com formatos diferentes (hex × triplet HSL). Decisão do
>   plano: `src/index.css` continua sendo o que o app carrega, com os valores do `tokens.css` convertidos para HSL nos
>   nomes do shadcn + tokens novos; um teste (`src/lib/designTokens.test.ts`) garante que os dois arquivos não divergem.
> - **Cores fixas no código:** `MapView.tsx` (marcadores: `#80CBC4`, `#D4A849`, `#3D7C85`, `#1ba3c6`, casa `#22c55e`,
>   rótulo `#3D7C85`), `MaintenancePage.tsx` (`#f0f7f9`, `#1ba3c6`), `index.html` e `vite.config.ts`
>   (`theme_color #1ba3c6`), `.marker-label` em `index.css`. Classes de paleta crua do Tailwind (`bg-blue-50`,
>   `text-green-800`, `bg-teal-500/15`…) em 14 arquivos, incluindo `src/lib/schoolTags.ts`.
> - **Fontes:** nenhuma carregada hoje (fonte do sistema). O design system pede Inter + Work Sans; como é PWA com uso
>   offline, carregar empacotado via `@fontsource` (não Google Fonts).
> - **Tema escuro:** o app não tem alternância de tema e o PRD não prevê. O plano define os tokens `.dark` no CSS
>   (para não perder o trabalho), **sem** criar botão de tema. Criar a alternância seria feature nova.
> - **Plano pausado:** `2026-11-10-escolas-do-supabase.md` mexe em `SchoolListCard`, `SchoolDetailModal`,
>   `PrioritiesList`, `SearchBar` e páginas. Ao retomá-lo, as classes novas deste plano valem.
> - **Testes:** só `e2e/fumaca.spec.ts` (`@fumaca`). O mapa depende da chave do Google Maps; no e2e conferimos estilos
>   calculados (cor, fonte) em elementos fora do mapa.

## ▶ Ponto de retomada

- **Atualizado:** 2026-11-10 — plano concluído
- **Plano concluído** — nada a fazer
- **Próxima ação:** nenhuma
- **Tocados e não verificados:** nenhum
- **Em execução:** nenhum subagente
- **Esperando o usuário:** nada (pendência externa: liberar o preview na chave de produção — ver Diário)

## Progresso

- [x] 1. Fundação: tokens, fontes e cor do app — `opus`
- [x] 2. Marcadores do mapa — `opus` *(depende de 1)*
- [x] 3. Moldura: cabeçalho, navegação, busca, avisos — `sonnet` *(depende de 1; paralelo com 2 e 4)*
- [x] 4. Escolas: etiquetas, cartões, detalhe, prioridades, filtros — `sonnet` *(depende de 1; paralelo com 2 e 3)*
- [x] 5. Limpeza do diretório design-system/ e documentação — `opus` *(depende de 2, 3, 4)*
- [x] 6. Revisão visual final — `opus` *(depende de 5)* · ⛔ portão: o usuário aprova as capturas

## Etapas

### Etapa 1 — Fundação: tokens, fontes e cor do app

**Executor:** `opus` · **Depende de:** — · **Paralelo com:** — · **Portão:** —

**Objetivo:** o app inteiro passa a usar a paleta da coruja através das variáveis do shadcn, com Inter/Work Sans, sem
ainda tocar componentes.

**Especificação:**

- **Contexto:** a paleta está em `design-system/tokens.css` (hex). O app lê `src/index.css` (HSL, nomes shadcn). Esta
  etapa traduz uma na outra e cria as classes Tailwind que as etapas 2–4 vão usar.
- **Ler:** `design-system/README.md`, `design-system/tokens.css`, `src/index.css`, `tailwind.config.ts`, `index.html`,
  `vite.config.ts` (manifest), `src/components/MaintenancePage.tsx`.
- **Alterar:** `src/index.css`, `tailwind.config.ts`, `src/main.tsx` (import das fontes), `package.json`,
  `index.html`, `vite.config.ts`, `src/components/MaintenancePage.tsx`; criar `src/lib/designTokens.test.ts`.
- **Fazer:**
  1. `src/index.css` `:root`: mapear shadcn → tokens. `background`=`--surface`, `foreground`=`--on-surface`,
     `card`/`popover`=`--surface-container-lowest`, `primary`=`--primary`, `secondary`=`--primary-soft` com fg
     `--primary`, `muted`=`--surface-container-low` com fg `--on-surface-variant`, `accent`=`--primary-soft`/`--primary`
     (o âmbar **não** é o `accent` do shadcn), `destructive`=`--erro-fg`, `border`/`input`=`--border-subtle`,
     `ring`=`--primary`, `--radius` = 0.5rem (`--radius-lg`). Tudo em triplet HSL.
  2. Tokens novos (HSL, com par fundo/texto onde houver): `favorite`(=`--accent` âmbar) + `favorite-strong`,
     `nivel-creche|pre|fundamental` (DEFAULT=fill, `bg`, `fg`), `sucesso|aviso|erro|info` (`bg`, `fg`),
     `surface-low`, `surface-high`, `on-surface-faint`. Registrar todos no `tailwind.config.ts` (`hsl(var(--x))`).
     Sombras `shadow-ambient` e `shadow-floating` (azul-noite) e `fontFamily.sans`=Inter, `fontFamily.label`=Work Sans.
  3. **Manter por enquanto** `infantil`, `pre`, `fundamental`, `orange`, `purple` apontando para os valores novos
     equivalentes (creche, pré, fundamental, poente, primary) para nada quebrar antes das etapas 2–4; a Etapa 5 remove.
  4. `.dark`: mesmos mapeamentos com os valores do bloco `.dark` do `tokens.css`. Sem botão de tema.
  5. Fontes: `npm i @fontsource-variable/inter @fontsource/work-sans`; importar em `src/main.tsx` (Inter variável;
     Work Sans 500 e 600). Conferir que o build do PWA empacota os woff2 (precache).
  6. `theme_color` → `#164292` em `index.html` e `vite.config.ts`; `background_color` → `#f6f9fd`.
  7. `MaintenancePage.tsx`: trocar os hex por classes de token.
  8. `.marker-label` em `index.css`: fundo `--surface-container-lowest`, sombra azul-noite, texto `--on-surface`.
  9. `src/lib/designTokens.test.ts`: lê os dois CSS, converte hex→HSL e confere que cada variável mapeada no item 1 e 2
     bate com o `tokens.css` (tolerância de arredondamento de 1 unidade), em `:root` e `.dark`.
- **Não fazer:** trocar classes dentro dos componentes (etapas 2–4); apagar `smepinda/` (etapa 5); criar
  alternância de tema.
- **Convenções:** invocar `frontend-design` com `args` = `design-system/README.md` antes de editar estilos.

**Cenários de interface** — tag `@design`:

1. Visitante abre `/` → o corpo da página usa a fonte Inter e o fundo é `#f6f9fd`.
2. Visitante abre `/` → um botão principal visível tem fundo azul coruja (`rgb(22, 66, 146)`) ou gradiente que começa nele.

**Critérios de aceite:**

- [ ] **Comportamento:** `npx vitest run src/lib/designTokens.test.ts` passa; alterar de propósito um valor em `index.css`
  faz o teste falhar (conferir uma vez e desfazer).
- [ ] **Comportamento:** `grep -rn "1ba3c6\|f0f7f9" index.html vite.config.ts src` não encontra nada.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e design` e `--build` (fontes no precache: `dist/` contém `*.woff2`).
- [ ] **Escopo:** nenhum componente além de `MaintenancePage.tsx` alterado.

---

### Etapa 2 — Marcadores do mapa

**Executor:** `opus` · **Depende de:** 1 · **Paralelo com:** 3, 4 · **Portão:** —

**Objetivo:** os marcadores seguem o README (seção *Níveis de ensino → Marcador do mapa*) e o artboard Componentes.

**Especificação:**

- **Ler:** `src/components/MapView.tsx` (função `createMarkerIcon` ~linha 200, marcador de casa ~linha 565, rótulo
  ~linha 557), `design-system/README.md`, `design-system/assets/coruja-branca.svg`.
- **Alterar:** `src/components/MapView.tsx`. Opcional: extrair as cores para `src/lib/mapColors.ts` se o Google Maps
  exigir hex (data-URI SVG não lê variável CSS) — as constantes saem do `tokens.css` e o `tokens.test.ts` da Etapa 1
  ganha uma asserção de que batem.
- **Fazer:**
  1. Círculo: preenchimento `--nivel-*`, contorno branco 2px, sombra azul-noite (não preta).
  2. Vários níveis: fatias com as três cores novas (manter a lógica de fatias existente).
  3. Favorito: estrela no nível da escola com anel âmbar `#f0b429` (substitui o brilho genérico).
  4. Casa: alfinete `--marcador-casa` (`#0f1d36`) com a coruja branca dentro (substitui a casinha verde `#22c55e`).
  5. Rótulo: texto `--on-surface`, Inter 12px.
- **Não fazer:** mudar tamanhos por zoom, área de clique ou comportamento.

**Cenários de interface** — tag `@design`: nenhum novo (o mapa precisa da chave do Google). Verificação visual na
Etapa 6.

**Critérios de aceite:**

- [ ] **Comportamento:** `grep -n "80CBC4\|D4A849\|3D7C85\|1ba3c6\|22c55e" src/components/MapView.tsx` vazio.
- [ ] **Comportamento:** se houver `src/lib/mapColors.ts`, o `tokens.test.ts` confere as constantes contra `tokens.css`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs`
- [ ] **Escopo:** só `MapView.tsx` (+ `mapColors.ts` e o teste).

---

### Etapa 3 — Moldura: cabeçalho, navegação, busca, avisos

**Executor:** `sonnet` · **Depende de:** 1 · **Paralelo com:** 2, 4 · **Portão:** —

**Objetivo:** tudo que emoldura as telas usa só tokens; nenhuma classe de paleta crua do Tailwind.

**Especificação:**

- **Alterar:** `Header.tsx`, `BottomNav.tsx`, `SideNav.tsx`, `SearchBar.tsx`, `CampaignBanner.tsx`,
  `InstallPromptBanner.tsx`, `IOSInstallBanner.tsx`, `UpdatePrompt.tsx`, `FilterToast.tsx`, `src/pages/NotFound.tsx`,
  `src/pages/Feedback.tsx` (todos em `src/components/` salvo as páginas).
- **Fazer:** trocar classes de paleta crua (`bg-blue-50`, `text-slate-600`, `border-blue-100`…) e `dark:` avulsos por
  tokens da Etapa 1, seguindo o README: aviso de campanha = `bg-info-bg text-info-fg` com a coruja pequena
  (`design-system/assets/coruja.svg`, copiar para `src/assets/` se precisar importar) à esquerda; barra inferior com
  ícone ativo `text-primary`; superfícies sem linha (camada tonal + `shadow-ambient`/`shadow-floating` sobre o mapa);
  título com `tracking-tight`; rótulo de caixa alta com `font-label`. Alvos de toque ≥ 44px. Ícones lucide com traço 1.75.
- **Não fazer:** mudar textos, comportamento ou estrutura; tocar arquivos das etapas 2 e 4.
- **Convenções:** invocar `frontend-design` com `args` = `design-system/README.md`. Obstáculo não previsto: parar e reportar.

**Cenários de interface** — tag `@design`:

3. Visitante abre `/` → o ícone ativo da barra inferior tem cor `rgb(22, 66, 146)` — **já coberto** em
   `e2e/design.spec.ts` na Etapa 1; esta etapa só precisa mantê-lo verde.

**Critérios de aceite:**

- [ ] **Comportamento:** `grep -nE "\b(bg|text|border|from|to)-(red|blue|green|yellow|amber|orange|gray|slate|teal|cyan|purple)-[0-9]" <arquivos da etapa>` vazio.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e design`
- [ ] **Escopo:** só os arquivos listados.

---

### Etapa 4 — Escolas: etiquetas, cartões, detalhe, prioridades, filtros

**Executor:** `sonnet` · **Depende de:** 1 · **Paralelo com:** 2, 3 · **Portão:** —

**Objetivo:** tudo que mostra escola usa as cores de nível e os pares de estado do design system.

**Especificação:**

- **Alterar:** `src/lib/schoolTags.ts`, `SchoolListCard.tsx`, `SchoolDetailModal.tsx`, `PrioritiesList.tsx`,
  `ActionChips.tsx`, `FilterDrawer.tsx`, `DistanceHistogram.tsx`, `HomeLocationInput.tsx`, `src/pages/Favoritos.tsx`,
  `src/pages/Lista.tsx`, `src/pages/Index.tsx` (só classes).
- **Fazer:** etiquetas de nível = `bg-nivel-X-bg text-nivel-X-fg` raio cheio `text-xs font-medium` (creche no lugar de
  teal, pré no lugar de amber, fundamental no lugar de cyan); vagas com/sem = pares `sucesso`/`erro`; avisos laranja =
  `aviso`; histograma e filtros: `purple` → `primary`; chip de filtro ativo `bg-secondary text-primary`, inativo
  `bg-muted text-muted-foreground`; favorito (estrela) em `text-favorite`; cartão `.surface-card` = `bg-card
  rounded-xl shadow-ambient` sem borda; distância e tempo em linha com `text-muted-foreground`.
- **Não fazer:** mudar dados, lógica, textos; mexer nos arquivos da Etapa 3 e no `MapView.tsx`.
- **Convenções:** como na Etapa 3. Obstáculo não previsto: parar e reportar.

**Cenários de interface** — tag `@design`:

4. Visitante abre `/lista` → a primeira etiqueta de nível visível tem fundo e texto das cores de nível (conferir
   `getComputedStyle` contra os valores do `tokens.css`).

**Critérios de aceite:**

- [ ] **Comportamento:** grep da Etapa 3 vazio nos arquivos desta etapa; `grep -rn "purple\|infantil\|\borange\b" src --include=*.tsx --include=*.ts` vazio fora de `components/ui`.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --e2e design`
- [ ] **Escopo:** só os arquivos listados.

---

### Etapa 5 — Limpeza do diretório design-system/ e documentação

**Executor:** `opus` · **Depende de:** 2, 3, 4 · **Paralelo com:** — · **Portão:** —

**Objetivo:** `design-system/` contém só o que vale hoje, e o README descreve o sistema como implementado.

**Especificação:**

- **Fazer:**
  1. `git rm -r design-system/smepinda/` (referência histórica; não é mais usada).
  2. `design-system/README.md`: tirar as menções ao smepinda; acrescentar a tabela "token → classe Tailwind" (ex.:
     `--nivel-creche-bg` → `bg-nivel-creche-bg`) e a regra de que `src/index.css` espelha o `tokens.css`, com o teste
     que garante. Registrar que o tema escuro existe nos tokens mas não tem alternância no app.
  3. `src/index.css` e `tailwind.config.ts`: remover tokens órfãos (`infantil`, `pre`, `fundamental` antigos, `orange`,
     `purple`, `sidebar-*` se `ui/sidebar.tsx` não for usado — conferir com grep antes).
  4. `design-system/assets/`: manter os três SVGs; remover qualquer arquivo sem uso.
  5. `ref/DOC.md` seção 7: uma linha sobre onde vivem as regras visuais e como as cores chegam ao app.
  6. `.claude/skills/mock-canvas/SKILL.md`: conferir que não aponta para nada removido.
- **Não fazer:** mudar valores de cor.

**Critérios de aceite:**

- [ ] **Comportamento:** `ls design-system` mostra só `README.md`, `tokens.css`, `assets/`; `grep -rni smepinda --exclude-dir=node_modules --exclude-dir=graphify-out --exclude-dir=ref .` vazio.
- [ ] **Portão:** `node .claude/scripts/portao.mjs --build`
- [ ] **Escopo:** sem mudança visual (e2e `@design` continua verde).

---

### Etapa 6 — Revisão visual final

**Executor:** `opus` · **Depende de:** 5 · **Paralelo com:** — · **Portão:** ⛔ usuário aprova as capturas

**Objetivo:** confirmar que o app aplicado bate com o canvas e corrigir desvios.

**Especificação:**

- Rodar `node .claude/scripts/portao.mjs --final`.
- Capturar (Playwright, 390×844 e 1280×800) mapa, lista, favoritos, detalhe da escola, filtros e página de feedback;
  conferir contra o README e o artboard "Aplicado ao app"; conferir contraste dos pares usados.
- Corrigir desvios pequenos inline; apresentar as capturas ao usuário com o link do canvas.

**Critérios de aceite:**

- [x] **Portão:** `node .claude/scripts/portao.mjs --final` verde.
- [x] **Usuário:** respondeu às capturas com ajustes (chips brancos, remover Contribua) e pediu para seguir.

## Encerramento do plano

- [x] Portão de fim de plano: `node .claude/scripts/portao.mjs --final`
- [x] `CHANGELOG.md` — `[Unreleased]`: *Alterado* (identidade visual, marcadores) e *Removido* (Contribua)
- [x] `ref/DOC.md` — conferido; acrescentadas as duas chaves do Google Maps
- [x] `.github/maintenance.yml` — nada previsto
- [x] Frontmatter → `status: concluido`; arquivo movido para `ref/planos/concluidos/` (não rastreado no git, então `Move-Item`)

## Diário de execução

<!-- HISTÓRICO: uma entrada por etapa, no máximo 10 linhas. Nunca apague entradas anteriores. -->

### 2026-11-10 — Etapa 1 (`opus`)

- **Feito:** `src/index.css` com a paleta da coruja em HSL (nomes shadcn + `faint`, `surface-high`, `primary-strong|container`, `favorite-strong`, `nivel-*`, `sucesso|aviso|erro|info-bg|fg`, sombras), `.dark` correspondente; Tailwind com essas cores, `shadow-ambient|floating`, `bg-gradient-primary`, `font-sans`(Inter Variable) e `font-label`(Work Sans); fontes via @fontsource (só subconjuntos latin no precache do PWA); theme_color `#164292`; MaintenancePage e `.marker-label` em tokens.
- **Arquivos:** src/index.css, tailwind.config.ts, src/main.tsx, package.json(+lock), index.html, vite.config.ts, src/components/MaintenancePage.tsx, src/lib/designTokens.test.ts, e2e/design.spec.ts.
- **Desvios:** teste de paridade ficou em `src/lib/designTokens.test.ts` (convenção do repo: testes ao lado do código; `src/test/` não existe). O HSL arredondado gera diferença de até 1 por canal RGB, por isso o e2e compara com tolerância 2. Cenário 3 já coberto aqui.
- **Evidência:** 83 asserções de paridade; quebrar `--primary` de propósito fez o teste falhar. Portão `--e2e design` e `--build` verdes; 13 woff2 em dist, latin no sw.js.
- **Pendências:** `#1ba3c6` ainda em MapView.tsx (Etapa 2). Nomes antigos (`infantil`, `orange`, `purple`…) já apontam para valores novos; Etapa 5 remove.

### 2026-11-10 — Etapa 2 (`opus`)

- **Feito:** marcadores com cores `--nivel-*`, contorno branco 2px e sombra azul-noite; favorito = estrela do nível com anel âmbar (substituiu o brilho); casa = alfinete azul-noite com a coruja branca; rótulo em `--on-surface`/Inter 12px.
- **Arquivos:** src/components/MapView.tsx, src/lib/mapColors.ts (novo), src/lib/designTokens.test.ts.
- **Desvios:** `mapColors.ts` criado (data-URI não lê variável CSS); a coruja vem de `design-system/assets/coruja-branca.svg?raw` — **a Etapa 5 não pode apagar `design-system/assets/`**.
- **Evidência:** grep dos hex antigos vazio; 91 testes de paridade (8 novos de `mapColors`); portão + `--build` verdes; render de rascunho do alfinete e da estrela conferido a olho (mapa real só na Etapa 6).

### 2026-11-10 — Etapa 3 (`opus`, previsto `sonnet`)

- **Feito:** aviso de campanha em `info-bg/fg` com a coruja (`design-system/assets/coruja.svg`) e botão principal em gradiente; barras/busca/avisos sem borda, `shadow-floating`; ícones com traço 1.75; alvos ≥ 44px (abas do Header, itens da busca, X dos avisos de instalação); rótulo da barra inferior 10px→12px; NotFound/Feedback/FilterToast em tokens; modo dev da busca em `destructive`.
- **Arquivos:** Header, BottomNav, SideNav, SearchBar, CampaignBanner, InstallPromptBanner, IOSInstallBanner, UpdatePrompt, FilterToast, pages/NotFound, pages/Feedback.
- **Desvios:** feito inline (volume pequeno não compensava delegar). SideNav manteve rótulo 10px (coluna de 48px não comporta 12px) — revisar na Etapa 6. **Lição:** reescrever arquivo com `Get-Content` sem `-Encoding UTF8` corrompe acentos — usar Edit ou `[IO.File]` com UTF8.
- **Evidência:** grep do critério vazio; portão `--e2e design` e `--build` verdes.

### 2026-11-10 — Etapa 4 (`opus`, previsto `sonnet`)

- **Feito:** etiquetas de nível em `nivel-*-bg/fg` com raio cheio; vagas em `sucesso`/`erro`; distância e tempo em `text-muted-foreground` (eram laranja, não são aviso); estrela e botão de favorito em `favorite`; cartão de prioridade `bg-card rounded-xl shadow-ambient` sem borda; dica em `bg-secondary`; chips do mapa: ativo `bg-secondary text-primary`, inativo `bg-card text-muted-foreground`, `shadow-floating`; `purple` → `primary` no filtro e histograma; aviso de campanha de Favoritos em `info`.
- **Arquivos:** schoolTags.ts, SchoolListCard, SchoolDetailModal, PrioritiesList, ActionChips, FilterDrawer, DistanceHistogram, pages/Favoritos, e2e/design.spec.ts (cenário 4). HomeLocationInput, Lista e Index não precisaram de mudança.
- **Desvios:** feito inline (volume pequeno). O grep `infantil` do critério casa campos de dados (`infantil1`) — conferido só para classes. Chips inativos do mapa ficaram `bg-card` (não `bg-muted`) por flutuarem sobre o mapa — revisar na Etapa 6.
- **Evidência:** grep de paleta crua vazio nos arquivos da etapa; sem `purple`/`orange` como classe; portão `--e2e design` verde (3 cenários).

### 2026-11-10 — Etapa 5 (`opus`)

- **Feito:** `design-system/smepinda/` removido; tokens órfãos (`orange`, `infantil`, `pre`, `fundamental`, `purple`, `sidebar-*`) fora de `src/index.css` e `tailwind.config.ts`; README com "Como as cores chegam ao app", tabela token → classe, regra do espelho + teste, tema escuro sem alternância, imports dos SVGs; `tokens.css` sem menção ao smepinda (só comentários); DOC seção 7 com uma linha.
- **Arquivos:** design-system/README.md, design-system/tokens.css, src/index.css, tailwind.config.ts, ref/DOC.md.
- **Desvios:** `ui/sidebar.tsx` não é usado, mas ficou (código morto do shadcn; agora sem tokens). `mock-canvas/SKILL.md` não precisou mudar. `icone-app.svg` mantido (só documentado).
- **Lição:** regex de remoção sem âncora de início de linha casou `pre:`/`fundamental:` dentro de `nivel` e quebrou o config — o build pegou; restaurado.
- **Evidência:** `ls design-system` = README.md, tokens.css, assets; `git grep smepinda` fora de ref vazio; portão `--build --e2e design` verde.

### 2026-11-10 — Etapa 6 (`opus`)

- **Feito:** capturas 390×844 e 1280×800 (lista, detalhe, filtros, favoritos, mapa com favoritas); contraste de todos os pares ≥ 5,3:1. Corrigidos: botão "Mostrar N escolas" (era `bg-foreground`) → gradiente; "Limpar tudo" → fantasma; SideNav 10px → 12px; sombra dos chips cortada pela fileira com rolagem (faixa visível sobre o mapa) → margens negativas + padding com `pointer-events-none`.
- **Pedidos do usuário:** chips inativos ficam `bg-card`; "Contribua" removido (navs, rota, `pages/Feedback.tsx`, PRD §3.9 renumerado, DOC) + e2e `@design` do menu.
- **Chave do Maps:** usuário criou chave de desenvolvimento só para localhost (no `.env`, ignorado). Preview `git-dev` ainda dá `RefererNotAllowedMapError`: falta liberar `https://praqualescola-git-dev-raulcabrals-projects.vercel.app/*` na chave de produção. Documentado no DOC.
- **Lição:** `space-y-*` do Tailwind define margin-top **e** margin-bottom dos filhos e vence classes de margem do filho — usar `!`.
- **Evidência:** mapa real renderizado localmente com marcadores e estrelas; portão `--final` verde.
