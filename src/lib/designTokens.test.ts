import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mapColors } from "./mapColors";

// design-system/tokens.css guarda as cores em hex; src/index.css repete os mesmos valores em HSL,
// nos nomes do shadcn. Este teste garante que os dois não divergem.

const raiz = resolve(__dirname, "../..");
const tokensCss = readFileSync(resolve(raiz, "design-system/tokens.css"), "utf-8");
const appCss = readFileSync(resolve(raiz, "src/index.css"), "utf-8");

function bloco(css: string, seletor: ":root" | ".dark"): Record<string, string> {
  const inicio = css.search(new RegExp(`^\\s*${seletor.replace(".", "\\.")}\\s*\\{`, "m"));
  if (inicio < 0) throw new Error(`bloco ${seletor} não encontrado`);
  const fim = css.indexOf("}", inicio);
  const vars: Record<string, string> = {};
  for (const m of css.slice(inicio, fim).matchAll(/--([\w-]+):\s*([^;]+);/g)) vars[m[1]] = m[2].trim();
  return vars;
}

function hexParaHsl(hex: string): [number, number, number] {
  const n = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h *= 60;
  }
  return [h, s * 100, l * 100];
}

function lerHsl(triplet: string): [number, number, number] {
  const [h, s, l] = triplet.split(/\s+/).map((v) => parseFloat(v));
  return [h, s, l];
}

// nome em src/index.css → nome em design-system/tokens.css
const mapa: Record<string, string> = {
  background: "surface",
  foreground: "on-surface",
  card: "surface-container-lowest",
  "card-foreground": "on-surface",
  popover: "surface-container-lowest",
  "popover-foreground": "on-surface",
  primary: "primary",
  "primary-foreground": "on-primary",
  "primary-strong": "primary-strong",
  "primary-container": "primary-container",
  secondary: "primary-soft",
  "secondary-foreground": "primary",
  muted: "surface-container-low",
  "muted-foreground": "on-surface-variant",
  faint: "on-surface-faint",
  accent: "primary-soft",
  "accent-foreground": "primary",
  "surface-high": "surface-container-high",
  destructive: "destructive",
  border: "border-subtle",
  input: "border-subtle",
  ring: "primary",
  favorite: "accent",
  "favorite-strong": "accent-strong",
  "nivel-creche": "nivel-creche",
  "nivel-creche-bg": "nivel-creche-bg",
  "nivel-creche-fg": "nivel-creche-fg",
  "nivel-pre": "nivel-pre",
  "nivel-pre-bg": "nivel-pre-bg",
  "nivel-pre-fg": "nivel-pre-fg",
  "nivel-fundamental": "nivel-fundamental",
  "nivel-fundamental-bg": "nivel-fundamental-bg",
  "nivel-fundamental-fg": "nivel-fundamental-fg",
  "sucesso-bg": "sucesso-bg",
  "sucesso-fg": "sucesso-fg",
  "aviso-bg": "aviso-bg",
  "aviso-fg": "aviso-fg",
  "erro-bg": "erro-bg",
  "erro-fg": "erro-fg",
  "info-bg": "info-bg",
  "info-fg": "info-fg",
};

const casos = (["light", "dark"] as const).flatMap((tema) =>
  Object.entries(mapa).map(([app, token]) => ({ tema, app, token })),
);

describe("cores do app espelham design-system/tokens.css", () => {
  const tokens = { light: bloco(tokensCss, ":root"), dark: { ...bloco(tokensCss, ":root"), ...bloco(tokensCss, ".dark") } };
  const app = { light: bloco(appCss, ":root"), dark: { ...bloco(appCss, ":root"), ...bloco(appCss, ".dark") } };

  it.each(casos)("$tema: --$app = --$token", ({ tema, app: nomeApp, token }) => {
    const hex = tokens[tema][token];
    const hsl = app[tema][nomeApp];
    expect(hex, `--${token} ausente em tokens.css`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(hsl, `--${nomeApp} ausente em index.css`).toBeDefined();
    const [h1, s1, l1] = hexParaHsl(hex);
    const [h2, s2, l2] = lerHsl(hsl);
    if (s1 > 0) expect(Math.abs(h1 - h2)).toBeLessThanOrEqual(1);
    expect(Math.abs(s1 - s2)).toBeLessThanOrEqual(1);
    expect(Math.abs(l1 - l2)).toBeLessThanOrEqual(1);
  });

  it.each(Object.entries(mapColors))("marcadores do mapa: %s = tokens.css", (nome, hex) => {
    expect(hex.toLowerCase()).toBe(tokens.light[nome]?.toLowerCase());
  });

  it("sombras são as mesmas", () => {
    for (const nome of ["shadow-ambient", "shadow-floating"]) {
      expect(app.light[nome]).toBe(tokens.light[nome]);
    }
  });
});
