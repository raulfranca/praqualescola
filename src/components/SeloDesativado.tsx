import { cn } from "@/lib/utils";

/** Selo de escola inativa no cadastro da SME (o prédio do CAIC). */
export function SeloDesativado({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap bg-aviso-bg text-aviso-fg",
        className
      )}
    >
      Prédio desativado
    </span>
  );
}
