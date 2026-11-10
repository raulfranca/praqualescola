import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ENDERECOS_DO_DIA_KEY = "enderecos-do-dia";
/** Endereços novos que um aparelho pode definir por dia (a cota do Google é pequena). */
export const LIMITE_ENDERECOS_POR_DIA = 3;

/** Data local "AAAA-MM-DD": o contador vira à meia-noite do aparelho. */
function diaLocal(agora: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${p(agora.getMonth() + 1)}-${p(agora.getDate())}`;
}

function enderecosHoje(agora: Date): number {
  try {
    const salvo = JSON.parse(localStorage.getItem(ENDERECOS_DO_DIA_KEY) ?? "null");
    return salvo?.data === diaLocal(agora) ? Number(salvo.quantidade) || 0 : 0;
  } catch {
    return 0;
  }
}

/** Quantos endereços novos o aparelho ainda pode definir hoje. */
export function enderecosRestantesHoje(agora: Date = new Date()): number {
  return Math.max(0, LIMITE_ENDERECOS_POR_DIA - enderecosHoje(agora));
}

/** Conta um endereço novo definido hoje (voltar a um endereço já calculado no aparelho não conta). */
export function registrarEnderecoNovo(agora: Date = new Date()): void {
  localStorage.setItem(
    ENDERECOS_DO_DIA_KEY,
    JSON.stringify({ data: diaLocal(agora), quantidade: enderecosHoje(agora) + 1 }),
  );
}
