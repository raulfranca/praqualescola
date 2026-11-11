import { useSyncExternalStore } from "react";

// Tour de primeira visita: aparece uma vez por aparelho. Concluir, pular ou fechar grava a marca.
// Enquanto ele está pendente, os outros avisos (instalar, campanha, nova versão) esperam.

const CHAVE = "tour-visto";
const ouvintes = new Set<() => void>();

export function tourPendente(): boolean {
  return localStorage.getItem(CHAVE) !== "1";
}

export function concluirTour(): void {
  localStorage.setItem(CHAVE, "1");
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void) {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

export function useTourPendente(): boolean {
  return useSyncExternalStore(assinar, tourPendente);
}
