import { ChevronRight } from "lucide-react";
import { useCampaign } from "@/contexts/CampaignContext";
import { fimCurto } from "@/lib/campanha";
import { conviteInstalarVisivel } from "@/lib/camadas";
import coruja from "../../design-system/assets/coruja.svg";

/** Selo flutuante no mapa, acima da barra de navegação, enquanto há vagas abertas. Tocar reabre o aviso.
 *  Sem app instalado, o convite para instalar vem antes: o selo aparece quando ele fecha. */
export function SeloCampanha({ onAbrir }: { onAbrir: () => void }) {
  const { campanha } = useCampaign();
  const conviteNaTela = conviteInstalarVisivel.useValor();
  if (!campanha || conviteNaTela) return null;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="fixed left-1/2 -translate-x-1/2 bottom-[calc(6.5rem+env(safe-area-inset-bottom))] md:bottom-8 z-40 inline-flex items-center gap-2 h-10 pl-1.5 pr-3 max-w-[calc(100%-2rem)] rounded-full shadow-floating bg-info-bg text-info-fg text-sm whitespace-nowrap"
    >
      <img src={coruja} alt="" aria-hidden="true" className="h-7 w-7 flex-none" />
      <span className="truncate">
        <strong className="font-semibold">{campanha.nome}</strong> · até {fimCurto(campanha.fim)}
      </span>
      <ChevronRight className="h-4 w-4 flex-none" strokeWidth={2} aria-hidden="true" />
    </button>
  );
}
