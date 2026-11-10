# Design system — Pra Qual Escola

Regras visuais do projeto. Leia antes de qualquer edição de interface. Os valores estão em `tokens.css`.

**"Coruja e Mapa".** Toda cor nasce do logotipo (`public/favicon.svg`): a coruja **Azul Coruja `#164292`** sobre o **Céu `#ebf2fa`**.

## Como as cores chegam ao app

`tokens.css` é a referência, em hex, e é o que a skill `mock-canvas` lê. O app **não** o importa: `src/index.css` repete os mesmos valores em HSL, nos nomes do shadcn, e `tailwind.config.ts` os expõe como classes (`hsl(var(--x))`, o que permite opacidade: `bg-primary/10`). O teste `src/lib/designTokens.test.ts` falha se os dois arquivos divergirem; as cores dos marcadores do mapa ficam em `src/lib/mapColors.ts` (SVG em data-URI não lê variável CSS), cobertas pelo mesmo teste. **Mudou uma cor? Altere `tokens.css`, `src/index.css` e, se for de marcador, `mapColors.ts`.**

| Token (`tokens.css`) | Classe Tailwind |
|---|---|
| `--primary` / `--on-primary` | `bg-primary` / `text-primary-foreground` |
| `--primary-strong` / `--primary-container` | `bg-primary-strong` / `bg-primary-container` |
| `--primary-soft` (Céu) | `bg-secondary`, `bg-accent` |
| `--surface` / `--on-surface` | `bg-background` / `text-foreground` |
| `--surface-container-lowest` | `bg-card`, `bg-popover` |
| `--surface-container-low` / `--on-surface-variant` | `bg-muted` / `text-muted-foreground` |
| `--surface-container-high` / `--on-surface-faint` | `bg-surface-high` / `text-faint` |
| `--border-subtle` | `border-border`, `border-input` |
| `--accent` / `--accent-strong` (âmbar) | `text-favorite`, `fill-favorite` / `bg-favorite-strong` |
| `--nivel-X`, `--nivel-X-bg`, `--nivel-X-fg` (X = `creche`, `pre`, `fundamental`) | `bg-nivel-X`, `bg-nivel-X-bg`, `text-nivel-X-fg` |
| `--sucesso-*`, `--aviso-*`, `--erro-*`, `--info-*` | `bg-sucesso-bg text-sucesso-fg` (idem para os demais) |
| `--destructive` | `bg-destructive` |
| `--shadow-ambient` / `--shadow-floating` | `shadow-ambient` / `shadow-floating` |
| `--gradient-primary` | `bg-gradient-primary` |
| `--font-sans` / `--font-label` | `font-sans` (Inter) / `font-label` (Work Sans) |

`.surface-card` no app = `bg-card rounded-xl shadow-ambient`. Classes de paleta crua do Tailwind (`bg-blue-50`, `text-green-800`…) não se usam fora de `src/components/ui/`.

## Voz e vocabulário

Fala com professor, de igual para igual. Frases curtas, verbo no imperativo nos botões ("Calcular distâncias", "Como chegar?", "Favoritar"). Palavras da rede: *remoção*, *sede*, *atribuição*, *vagas*, *creche*, *pré-escola*, *fundamental*. Evite jargão técnico ("geolocalização", "API", "cache") e exclamações.

## Cores

| Papel | Token | Uso |
|---|---|---|
| Marca | `--primary` | Botão principal, link, ícone ativo da barra inferior, nível fundamental |
| Hover | `--primary-strong` | Estado pressionado do que é `--primary` |
| Céu | `--primary-soft` / `--surface-container-low` | Chip ativo, item selecionado, campos, fundo do ícone |
| Âmbar | `--accent` | **Só** favorito (estrela, anel do marcador). Nunca texto sobre claro; como texto use `--accent-strong` |
| Página | `--surface` | Fundo de toda tela |
| Cartão | `--surface-container-lowest` | Cartões e folhas, com `--shadow-ambient` |
| Texto | `--on-surface` → `--on-surface-variant` → `--on-surface-faint` | Principal, secundário, legenda |

- **Um azul, um âmbar.** A interface é monocromática em azul; o âmbar aparece pouco e sempre quer dizer "favorito". Se um segundo acento parecer necessário, use um estado semântico.
- **Sem linhas.** Separe por camada tonal (página → cartão → Céu). Borda só em campo de formulário (`--border-subtle`) ou tabela densa (`--ghost-border`).
- **Sombra azul-noite**, nunca cinza: `--shadow-ambient` em cartões, `--shadow-floating` no que flutua sobre o mapa.
- **Estados** (`--sucesso-*`, `--aviso-*`, `--erro-*`, `--info-*`): sempre o par fundo suave + texto forte. Todos passam 4.5:1.
- **Tema escuro** (`.dark`): "a coruja à noite". Azul-noite no fundo, Azul Coruja clareado (`#9dbcf2`) como primário. Os tokens existem nos dois arquivos, mas o app **não tem alternância de tema**: criá-la é funcionalidade nova.

### Níveis de ensino

Água (creche) · Poente (pré) · Coruja (fundamental). Os três diferem em matiz **e** luminosidade, para quem não distingue cores.

- **Marcador do mapa:** círculo preenchido com `--nivel-*`, contorno branco de 2px. Escola com mais de um nível divide o círculo em fatias. Favorito vira estrela com anel `--marcador-favorito`. A casa é um alfinete `--marcador-casa` com a coruja branca.
- **Etiqueta:** `--nivel-*-bg` + `--nivel-*-fg`, raio cheio, `--text-label`.

## Tipografia

Inter para tudo; Work Sans só em rótulo de caixa alta (`.eyebrow`) e eixo de gráfico. Escala em `--text-*`. Título de página 36px bold com `--tracking-tight`; texto de interface 14px; nada abaixo de 12px exceto `--text-micro` em selo.

## Layout

- O app é celular primeiro: largura de referência 390px, barra inferior de `--bottom-nav-h`, alvos de toque ≥ 44px.
- Espaçamento em múltiplos de 8 (`--space-*`); 16px de margem lateral no celular, 24px no computador.
- Conteúdo de lista até `--content-max`; o mapa ocupa a tela inteira e os controles flutuam sobre ele.

## Componentes

- **Botão principal:** `--gradient-primary`, texto branco, `--radius-md`, 44px de altura. **Secundário:** fundo `--primary-soft`, texto `--primary`. **Fantasma:** só texto `--primary`.
- **Campo:** fundo `--surface-container-lowest`, borda `--border-subtle`, `--radius-lg`; foco com anel `--primary` de 2px.
- **Cartão de escola:** `.surface-card`, `--radius-xl`, nome em `--text-title`, bairro em `--on-surface-variant`, etiquetas de nível, distância e tempo em linha.
- **Chip de filtro:** raio cheio; ativo em `--primary-soft`/`--primary`, inativo em `--surface-container-low`/`--on-surface-variant`.
- **Aviso de campanha:** faixa `--info-bg`/`--info-fg` com a coruja pequena à esquerda.
- **Ícones:** traço, 1.75px, `currentColor`. Nada de emoji.

## Assets

Logos e marcas ficam em `design-system/assets/`:

- `coruja.svg` — coruja em Azul Coruja, fundo transparente.
- `coruja-branca.svg` — coruja branca, para fundo escuro ou sobre `--primary`.
- `icone-app.svg` — o ícone do app: coruja sobre Céu, cantos `--radius-icon`.

`coruja.svg` (aviso de campanha) e `coruja-branca.svg` (alfinete da casa no mapa) são importados pelo código: não renomeie sem ajustar os imports.
