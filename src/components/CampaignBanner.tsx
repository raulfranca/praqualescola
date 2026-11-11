import { useState, useEffect } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { CalendarDays } from "lucide-react";
import { useCampaign } from "@/contexts/CampaignContext";
import { useTourPendente } from "@/lib/tour";
import { avisoCampanhaAberto } from "@/lib/camadas";
import { fimPorExtenso } from "@/lib/campanha";
import { Button } from "@/components/ui/button";
import coruja from "../../design-system/assets/coruja.svg";

interface CampaignBannerProps {
  /** Aberto a pedido (toque no selo do mapa). */
  aberto?: boolean;
  onFechar?: () => void;
  onShowVacancies: () => void;
}

/** Aviso de abertura de vagas. Abre sozinho uma vez por campanha, depois do tour (com ou sem app instalado),
 *  e sempre que pedido pelo selo. */
export function CampaignBanner({ aberto = false, onFechar, onShowVacancies }: CampaignBannerProps) {
  const { campanha } = useCampaign();
  const [isDismissed, setIsDismissed] = useState(true);
  const tourEmAndamento = useTourPendente();
  const dismissKey = `dismissed_campaign_${campanha?.id}`;

  useEffect(() => {
    setIsDismissed(localStorage.getItem(dismissKey) === "true");
  }, [dismissKey]);

  const visivel = !!campanha && (aberto || (!isDismissed && !tourEmAndamento));

  useEffect(() => {
    avisoCampanhaAberto.definir(visivel);
    return () => avisoCampanhaAberto.definir(false);
  }, [visivel]);

  if (!campanha) return null;

  const fechar = () => {
    localStorage.setItem(dismissKey, "true");
    setIsDismissed(true);
    onFechar?.();
  };

  const verVagas = () => {
    fechar();
    onShowVacancies();
  };

  return (
    <DialogPrimitive.Root open={visivel} onOpenChange={(o) => !o && fechar()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-foreground/40 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className="fixed left-4 right-4 top-1/2 -translate-y-1/2 z-[61] mx-auto max-w-md bg-card rounded-2xl shadow-floating p-6 flex flex-col gap-[18px] focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <div className="flex items-center gap-3.5">
            <span className="h-14 w-14 flex-none rounded-[14px] bg-secondary flex items-center justify-center">
              <img src={coruja} alt="" aria-hidden="true" className="h-[42px] w-[42px]" />
            </span>
            <div className="flex flex-col gap-0.5">
              <span className="font-label text-xs font-semibold uppercase tracking-[0.05em] text-muted-foreground">Vagas abertas</span>
              <DialogPrimitive.Title className="text-[21px] font-bold leading-tight tracking-tight text-foreground">
                {campanha.nome}
              </DialogPrimitive.Title>
            </div>
          </div>

          {campanha.descricao ? (
            <DialogPrimitive.Description className="text-sm leading-relaxed text-muted-foreground">
              {campanha.descricao}
            </DialogPrimitive.Description>
          ) : (
            <DialogPrimitive.Description className="sr-only">Vagas abertas para {campanha.nome}</DialogPrimitive.Description>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-[10px] bg-sucesso-bg text-sucesso-fg px-3.5 py-3 flex flex-col gap-0.5">
              <strong className="text-[28px] leading-none tracking-tight">{campanha.escolas_com_vaga}</strong>
              <span className="text-xs font-semibold">{campanha.escolas_com_vaga === 1 ? "escola com vaga" : "escolas com vaga"}</span>
            </div>
            <div className="rounded-[10px] bg-secondary text-primary px-3.5 py-3 flex flex-col gap-0.5">
              <strong className="text-[28px] leading-none tracking-tight">{campanha.total_vagas}</strong>
              <span className="text-xs font-semibold">{campanha.total_vagas === 1 ? "vaga no total" : "vagas no total"}</span>
            </div>
          </div>

          <p className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <CalendarDays className="h-[18px] w-[18px] flex-none" strokeWidth={1.75} aria-hidden="true" />
            <span>
              Aberta até <strong className="text-foreground">{fimPorExtenso(campanha.fim)}</strong>
            </span>
          </p>

          <div className="flex flex-col gap-1">
            <Button
              onClick={verVagas}
              className="w-full h-12 bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold text-[15px]"
            >
              Ver escolas com vagas
            </Button>
            <Button
              onClick={fechar}
              variant="ghost"
              className="w-full h-11 text-primary font-semibold text-[15px] hover:bg-primary/10 hover:text-primary-strong"
            >
              Agora não
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
