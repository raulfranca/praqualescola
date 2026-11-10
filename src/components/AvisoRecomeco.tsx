import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import coruja from "../../design-system/assets/coruja.svg";

/** Aviso único de que favoritos e endereço foram apagados na troca para o cadastro da SME. */
export function AvisoRecomeco({ mostrar }: { mostrar: boolean }) {
  const [aberto, setAberto] = useState(mostrar);

  return (
    <Dialog open={aberto} onOpenChange={setAberto}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm rounded-xl p-6 [&>button.absolute]:hidden">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-info-bg p-3">
            <img src={coruja} alt="" aria-hidden="true" className="h-10 w-10" />
          </div>
          <DialogTitle className="text-lg font-semibold">O app foi atualizado</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Agora as escolas vêm do cadastro oficial da Secretaria de Educação. Para começar, defina de
            novo o endereço de casa e marque suas escolas favoritas.
          </DialogDescription>
          <Button
            onClick={() => setAberto(false)}
            className="w-full h-11 bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold"
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
