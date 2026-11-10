// Cores dos marcadores do mapa. O Google Maps recebe o ícone como SVG em data-URI, que não lê
// variáveis CSS; por isso os valores ficam aqui em hex, copiados de design-system/tokens.css (:root).
// src/lib/designTokens.test.ts garante que não divergem.

export const mapColors = {
  "nivel-creche": "#3aa597",
  "nivel-pre": "#dc6f43",
  "nivel-fundamental": "#164292",
  primary: "#164292",
  "marcador-casa": "#0f1d36",
  "marcador-favorito": "#f0b429",
  "marcador-contorno": "#ffffff",
  "on-surface": "#0f1d36",
};
