import { useEffect, useLayoutEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { concluirTour, useTourPendente } from "@/lib/tour";

interface Etapa {
  /** Valor de `data-tour` do elemento iluminado. */
  alvo: string;
  titulo: string;
  texto: ReactNode;
}

const NIVEIS = [
  { cor: "bg-nivel-creche", nome: "Creche" },
  { cor: "bg-nivel-pre", nome: "Pré-escola" },
  { cor: "bg-nivel-fundamental", nome: "Fundamental" },
];

const ETAPAS: Etapa[] = [
  {
    alvo: "mapa",
    titulo: "As cores mostram as turmas",
    texto: (
      <>
        <span className="flex flex-wrap gap-x-4 gap-y-1 mb-2">
          {NIVEIS.map((nivel) => (
            <span key={nivel.nome} className="inline-flex items-center gap-1.5 font-medium text-foreground">
              <span className={`w-3 h-3 rounded-full ${nivel.cor}`} aria-hidden="true" />
              {nivel.nome}
            </span>
          ))}
        </span>
        Cada escola aparece no mapa com a cor do que ela atende. Ícone com mais de uma cor atende mais de um
        segmento.
      </>
    ),
  },
  {
    alvo: "busca",
    titulo: "Busque uma escola",
    texto: "Digite o nome, o endereço ou o bairro. O mapa destaca as escolas encontradas; toque em uma para ver os detalhes.",
  },
  {
    alvo: "casa",
    titulo: "Minha Casa",
    texto: "Informe seu endereço. O app calcula a distância e o tempo de carro até cada escola.",
  },
  {
    alvo: "filtros",
    titulo: "Filtros",
    texto: "Mostre só as escolas até certa distância da sua casa, de um segmento ou de uma administração: prefeitura ou terceirizada.",
  },
  {
    alvo: "lista",
    titulo: "Lista",
    texto: "Veja as escolas em lista e ordene por nome, distância ou tempo. Os filtros valem aqui também.",
  },
  {
    alvo: "favoritos",
    titulo: "Favoritos",
    texto: (
      <>
        No detalhe de uma escola, toque na estrela{" "}
        <Star className="inline w-4 h-4 align-text-bottom text-favorite fill-favorite" aria-hidden="true" /> para
        favoritar. Aqui você arrasta as favoritas e monta sua lista de prioridades para a atribuição.
      </>
    ),
  },
];

const MARGEM = 16;

function medir(alvo: string): DOMRect | null {
  // Lista e Favoritos existem duas vezes (barra inferior e lateral): vale o que está visível.
  const visivel = Array.from(document.querySelectorAll(`[data-tour="${alvo}"]`)).find(
    (el) => el.getClientRects().length > 0
  );
  if (!visivel) return null;
  visivel.scrollIntoView({ block: "nearest", inline: "nearest" });
  return visivel.getBoundingClientRect();
}

function posicaoDoBalao(alvo: string, r: DOMRect | null, largura: number): CSSProperties {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (!r) return { left: (vw - largura) / 2, top: vh / 3 };
  const limitar = (x: number) => Math.max(MARGEM, Math.min(x, vw - largura - MARGEM));
  // O mapa ocupa a tela: o balão fica dentro dele, embaixo.
  if (alvo === "mapa") return { left: limitar(r.left + MARGEM), bottom: vh - r.bottom + MARGEM };
  // Barra lateral do computador: o balão abre ao lado.
  if (vw >= 768 && r.left < 64) return { left: r.right + MARGEM, top: r.top };
  if (r.top + r.height / 2 < vh / 2) return { left: limitar(r.left), top: r.bottom + MARGEM };
  return { left: limitar(r.left), bottom: vh - r.top + MARGEM };
}

/** Tour de primeira visita, sobre a tela do mapa. Aparece uma vez por aparelho. */
export function Tour() {
  const pendente = useTourPendente();
  const [indice, setIndice] = useState(0);
  const [retangulo, setRetangulo] = useState<DOMRect | null>(null);
  const etapa = ETAPAS[indice];
  const ultima = indice === ETAPAS.length - 1;

  useLayoutEffect(() => {
    if (!pendente) return;
    const atualizar = () => setRetangulo(medir(etapa.alvo));
    atualizar();
    window.addEventListener("resize", atualizar);
    return () => window.removeEventListener("resize", atualizar);
  }, [pendente, etapa.alvo]);

  useEffect(() => {
    if (!pendente) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") concluirTour();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [pendente]);

  if (!pendente) return null;

  const largura = Math.min(360, window.innerWidth - 2 * MARGEM);
  const folga = etapa.alvo === "mapa" ? 0 : 6;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Holofote: a sombra enorme escurece tudo, menos o alvo. Sem alvo, escurece a tela toda. */}
      {retangulo ? (
        <div
          className="fixed pointer-events-none shadow-[0_0_0_200vmax_hsl(var(--foreground)/0.6)] transition-all duration-300 motion-reduce:transition-none"
          style={{
            left: retangulo.left - folga,
            top: retangulo.top - folga,
            width: retangulo.width + 2 * folga,
            height: retangulo.height + 2 * folga,
            borderRadius: folga ? 22 : 0,
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-foreground/60" />
      )}

      <div
        key={indice}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-titulo"
        className="fixed bg-card rounded-xl shadow-floating p-4 animate-in fade-in-0 zoom-in-95 duration-200 motion-reduce:animate-none"
        style={{ width: largura, ...posicaoDoBalao(etapa.alvo, retangulo, largura) }}
      >
        <div className="flex items-center justify-between -mt-2 -mr-2">
          <span className="font-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {indice + 1} de {ETAPAS.length}
          </span>
          <Button variant="ghost" onClick={concluirTour} className="h-11 px-3 text-sm text-muted-foreground">
            Pular
          </Button>
        </div>

        <h2 id="tour-titulo" className="text-lg font-semibold text-foreground">
          {etapa.titulo}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{etapa.texto}</p>

        <div className="flex gap-2 mt-4">
          {indice > 0 && (
            <Button
              variant="ghost"
              onClick={() => setIndice(indice - 1)}
              className="h-11 px-4 text-primary hover:bg-primary/10 hover:text-primary-strong"
            >
              Voltar
            </Button>
          )}
          <Button
            autoFocus
            onClick={() => (ultima ? concluirTour() : setIndice(indice + 1))}
            className="flex-1 h-11 bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold"
          >
            {ultima ? "Começar" : "Próximo"}
          </Button>
        </div>
      </div>
    </div>
  );
}
