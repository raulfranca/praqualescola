import { cn } from "@/lib/utils";

/** Selo de distância/tempo estimados em linha reta (sem o Google). */
export function SeloAproximado({ className }: { className?: string }) {
  return (
    <span
      title="Estimativa em linha reta. Será atualizada com a rota real quando possível."
      className={cn(
        "inline-flex items-center text-xs px-2 py-0.5 rounded-full font-medium shrink-0 whitespace-nowrap bg-info-bg text-info-fg",
        className
      )}
    >
      aproximado
    </span>
  );
}
