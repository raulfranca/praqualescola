/* ============================================================================
   SME Pinda — Design System Tokens
   "The Academic Curator" — earthy, editorial, no-line.
   Source of truth mirrors credenciamento/src/index.css (HSL).
   ============================================================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;1,14..32,400&family=Work+Sans:wght@400;500;600&display=swap');

:root {
  /* ── Brand colors ──────────────────────────────────────────────────────── */
  --primary:            #3e653e;  /* Forest Anchor — primary actions, brand */
  --primary-container:  #567e54;  /* Lighter forest — gradient endpoint */
  --olive:              #655f32;  /* Olive Scholar — supporting accent */
  --tertiary:           #854d3b;  /* Terracotta — alerts, destructive, pendente */

  /* ── Surface hierarchy (tonal layering, no lines) ──────────────────────── */
  --surface-container-lowest:  #ffffff;  /* Cards above page */
  --surface:                   #f9f9f9;  /* Page canvas */
  --surface-container-low:     #f3f3f3;  /* Subtle grouping, muted inputs */
  --surface-container-high:    #e8e8e8;  /* Prominent containers, sidebar accent */

  /* ── On-surface (text) ─────────────────────────────────────────────────── */
  --on-surface:          #1a1c1c;  /* fg1 — never pure black */
  --on-surface-variant:  #5b6060;  /* fg2 — muted-foreground */
  --on-surface-faint:    #8a8e8e;  /* fg3 — labels, captions */

  /* ── Ghost border (15% opacity) — last resort only ─────────────────────── */
  --ghost-border:        rgba(26, 28, 28, 0.15);
  --border-subtle:       #d8dadb;  /* hsl(180 2% 85%) — the input border token */

  /* ── Semantic state colors ─────────────────────────────────────────────── */
  --accent-aberto-bg:    #fef3c7;  /* amber-100 — chamado aberto row */
  --accent-aberto-fg:    #b45309;  /* amber-700 */
  --accent-aceito-bg:    rgba(62, 101, 62, 0.10);   /* primary @ 10% */
  --accent-aceito-fg:    var(--primary);
  --accent-pendente-bg:  rgba(133, 77, 59, 0.10);   /* tertiary @ 10% */
  --accent-pendente-fg:  var(--tertiary);
  --accent-recusado-bg:  rgba(133, 77, 59, 0.12);
  --accent-recusado-fg:  var(--tertiary);

  /* Period (manhã/tarde/noite) accent colors — only the icon is colored */
  --period-manha:  #f59e0b;  /* amber-500 */
  --period-tarde:  #fb923c;  /* orange-400 */
  --period-noite:  #818cf8;  /* indigo-400 */

  /* Região colors — earthy, harmonic with academic curator palette.
     Each região has a hue that maps to its character. Used as soft chips
     (color @ 15% bg, full-strength fg) on the Professores page and any
     escola listing where the região is the primary axis of grouping. */
  /* Earthy versions of the official edital colors (see Anexo VIII).
     Official: Centro=yellow, Oeste=royal-blue, Leste=green, Moreira=orange, Rural=lime-green.
     Earthy: desaturated, darker, harmonized with the academic-curator palette. */
  --regiao-centro:        #a08318;  /* earthy golden ochre (from bright yellow) */
  --regiao-zona-oeste:    #4a6d94;  /* steel slate blue (from royal blue) */
  --regiao-zona-leste:    #3d7a6e;  /* earthy teal-green (from vivid green, distinct from primary forest) */
  --regiao-moreira-cesar: #bf6130;  /* burnt rust (from orange) */
  --regiao-zona-rural:    #7c8438;  /* khaki olive (from lime/yellow-green) */

  /* ── Type families ─────────────────────────────────────────────────────── */
  --font-sans:   'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-label:  'Work Sans', system-ui, sans-serif;  /* for chart axes, eyebrow labels */
  --font-mono:   ui-monospace, 'SF Mono', Menlo, Consolas, monospace;

  /* ── Type scale (base 16) ──────────────────────────────────────────────── */
  --text-display-lg:   3.5rem;   /* 56px — hero stats, rare */
  --text-display-md:   2.75rem;  /* 44px */
  --text-display-sm:   2.25rem;  /* 36px — page titles (h2) */
  --text-headline:     1.25rem;  /* 20px — section titles (h3) */
  --text-title:        1.125rem; /* 18px — card titles, dialog titles */
  --text-body-lg:      1rem;     /* 16px — body */
  --text-body:         0.875rem; /* 14px — default UI text */
  --text-label:        0.75rem;  /* 12px — eyebrow labels, captions */
  --text-micro:        0.65rem;  /* 10.4px — scope label in sidebar */

  /* Line heights */
  --leading-tight:   1.1;
  --leading-snug:    1.25;
  --leading-normal:  1.5;
  --leading-relaxed: 1.6;

  /* Letter spacing */
  --tracking-tight:    -0.02em;  /* display headings */
  --tracking-normal:   0;
  --tracking-eyebrow:  0.18em;   /* "SECRETARIA MUNICIPAL DE EDUCAÇÃO" */
  --tracking-sidebar:  0.20em;   /* sidebar scope label */
  --tracking-wider:    0.05em;   /* uppercase form labels */

  /* Weights */
  --weight-regular:  400;
  --weight-medium:   500;
  --weight-semibold: 600;
  --weight-bold:     700;

  /* ── Spacing scale (8-unit, per DESIGN.md) ─────────────────────────────── */
  --space-1:  0.25rem;  /*  4px */
  --space-2:  0.5rem;   /*  8px */
  --space-3:  0.75rem;  /* 12px */
  --space-4:  1rem;     /* 16px */
  --space-5:  1.25rem;  /* 20px */
  --space-6:  1.5rem;   /* 24px */
  --space-8:  2rem;     /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px — "breathing rooms" between thematic sections */

  /* ── Radii ─────────────────────────────────────────────────────────────── */
  --radius-sm:  0.25rem;   /* 4px — small chips */
  --radius-md:  0.375rem;  /* 6px — buttons */
  --radius-lg:  0.5rem;    /* 8px — inputs, modals, base */
  --radius-xl:  0.75rem;   /* 12px — cards, tables */
  --radius-full: 9999px;   /* avatars, status dots */

  /* ── Elevation — Tonal Layering, NOT shadows ───────────────────────────── */
  /* Use these surfaces stacked to imply depth. */
  --shadow-ambient:  0 10px 30px rgba(26, 28, 28, 0.06);  /* table cards, modals */
  --shadow-floating: 0 10px 30px rgba(26, 28, 28, 0.10);  /* dropdowns, command palette */

  /* ── Gradient CTA (Forest → primary-container at 135°) ─────────────────── */
  --gradient-primary: linear-gradient(135deg, var(--primary), var(--primary-container));

  /* ── Layout ────────────────────────────────────────────────────────────── */
  --sidebar-width: 16rem;        /* 256px — fixed */
  --content-max:   72rem;        /* max-w-6xl — page content */

  /* ── Motion ────────────────────────────────────────────────────────────── */
  --duration-fast:   120ms; /* @kind other */
  --duration-base:   200ms; /* @kind other */
  --duration-slow:   320ms; /* @kind other */
  --ease-standard:   cubic-bezier(0.2, 0.0, 0.0, 1.0); /* @kind other */
  --ease-emphasized: cubic-bezier(0.2, 0.0, 0, 1); /* @kind other */
}

/* ============================================================================
   Semantic element styles
   ============================================================================ */

html, body {
  background: var(--surface);
  color: var(--on-surface);
  font-family: var(--font-sans);
  font-size: 16px;
  line-height: var(--leading-normal);
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

/* Page title (matches Agendamentos: "text-4xl font-bold tracking-tight") */
h1, .h1 {
  font-family: var(--font-sans);
  font-size: var(--text-display-sm);
  font-weight: var(--weight-bold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--on-surface);
  margin: 0;
}

/* Login title / dialog hero (matches "text-3xl font-semibold") */
h2, .h2 {
  font-family: var(--font-sans);
  font-size: 1.875rem;  /* 30px */
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-tight);
  line-height: var(--leading-tight);
  color: var(--on-surface);
  margin: 0;
}

/* Section title (matches "text-xl font-semibold") */
h3, .h3 {
  font-family: var(--font-sans);
  font-size: var(--text-headline);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  color: var(--on-surface);
  margin: 0;
}

/* Card / dialog title */
h4, .h4 {
  font-family: var(--font-sans);
  font-size: var(--text-title);
  font-weight: var(--weight-semibold);
  line-height: var(--leading-snug);
  color: var(--on-surface);
  margin: 0;
}

p, .body {
  font-family: var(--font-sans);
  font-size: var(--text-body);
  line-height: var(--leading-normal);
  color: var(--on-surface);
}

.body-lg {
  font-size: var(--text-body-lg);
  color: var(--on-surface-variant);
}

/* Eyebrow / form label — uppercase Work Sans, wide tracking */
.eyebrow,
.label-uppercase {
  font-family: var(--font-label);
  font-size: var(--text-label);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-wider);
  text-transform: uppercase;
  color: var(--on-surface-variant);
}

/* Scope label in sidebar — "DIRETOR" / "ADMIN SME" */
.eyebrow-tight {
  font-family: var(--font-label);
  font-size: var(--text-micro);
  font-weight: var(--weight-medium);
  letter-spacing: var(--tracking-sidebar);
  text-transform: uppercase;
  color: var(--on-surface-variant);
}

.caption {
  font-size: var(--text-label);
  color: var(--on-surface-variant);
  line-height: var(--leading-normal);
}

code, .mono {
  font-family: var(--font-mono);
  font-size: 0.85em;
}

/* ============================================================================
   Utilities
   ============================================================================ */

.surface-card {
  background: var(--surface-container-lowest);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-ambient);
}

.glass {
  background: hsla(0, 0%, 98%, 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.gradient-primary {
  background: var(--gradient-primary);
  color: #fff;
}

/* Ghost border — only for high-density tables where boundaries are essential */
.ghost-border { border: 1px solid var(--ghost-border); }
