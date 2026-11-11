// Peças visuais compartilhadas pelas abas do painel /admin.
import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

export const EYEBROW = "font-label text-xs font-medium uppercase tracking-wider";
export const BOTAO_PRINCIPAL = "h-11 w-full bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold";
export const BOTAO_SECUNDARIO = "h-11 w-full bg-secondary text-primary hover:bg-secondary/80 font-semibold";

export const numero = (n: number) => n.toLocaleString("pt-BR");

export function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: ReactNode; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={destaque ? "font-medium text-sucesso-fg" : "text-muted-foreground"}>{rotulo}</span>
      <span className={cn("font-semibold", destaque && "text-sucesso-fg")}>{valor}</span>
    </div>
  );
}

export function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("flex flex-col gap-4 rounded-xl bg-card p-5 shadow-ambient", className)}>{children}</section>;
}

export function Erro({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="w-full rounded-lg bg-erro-bg p-3 text-sm text-erro-fg">
      {children}
    </p>
  );
}

/** O interruptor grande do painel. */
export function InterruptorGrande(props: {
  id: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (ligado: boolean) => void;
}) {
  return (
    <Switch {...props} className="h-8 w-[52px] shrink-0 [&>span]:h-6 [&>span]:w-6 [&>span]:data-[state=checked]:translate-x-5" />
  );
}
