import { useSyncExternalStore } from "react";

// Ordem das camadas na abertura: tour (src/lib/tour.ts) → aviso de abertura da campanha → convite para
// instalar (só sem app instalado) → selo da campanha. Estes sinais deixam cada camada esperar a anterior.

function criarSinal() {
  let valor = false;
  const ouvintes = new Set<() => void>();
  const ler = () => valor;
  const definir = (novo: boolean) => {
    if (novo === valor) return;
    valor = novo;
    ouvintes.forEach((avisar) => avisar());
  };
  const assinar = (avisar: () => void) => {
    ouvintes.add(avisar);
    return () => {
      ouvintes.delete(avisar);
    };
  };
  const useValor = () => useSyncExternalStore(assinar, ler);
  return { ler, definir, useValor };
}

/** O aviso de abertura da campanha está na tela. O convite para instalar espera ele fechar. */
export const avisoCampanhaAberto = criarSinal();

/** O convite para instalar está na tela. O selo da campanha espera ele fechar. */
export const conviteInstalarVisivel = criarSinal();
