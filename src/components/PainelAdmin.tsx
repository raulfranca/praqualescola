import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  ErroAdmin,
  calibrarContador,
  conferirGoogle,
  definirModoForcado,
  encerrarSessaoAdmin,
  entrarAdmin,
  lerPainel,
  temSessaoAdmin,
  type ConferenciaGoogle,
  type Painel,
} from "@/lib/admin";
import type { EstadoCota } from "@/lib/cota";
import coruja from "../../design-system/assets/coruja.svg";

const EYEBROW = "font-label text-xs font-medium uppercase tracking-wider";
const BOTAO_PRINCIPAL = "h-11 w-full bg-gradient-primary hover:bg-primary-strong text-primary-foreground font-semibold";
const BOTAO_SECUNDARIO = "h-11 w-full bg-secondary text-primary hover:bg-secondary/80 font-semibold";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

const ESTADOS: Record<EstadoCota, { nome: string; texto: string; caixa: string; marcador: string }> = {
  normal: {
    nome: "Normal",
    texto: "Distâncias reais, calculadas pelo Google. Endereços repetidos reaproveitam o cálculo.",
    caixa: "bg-sucesso-bg text-sucesso-fg",
    marcador: "bg-sucesso-fg",
  },
  economia: {
    nome: "Economia",
    texto: "Endereços próximos usam o cálculo do vizinho para poupar a cota.",
    caixa: "bg-aviso-bg text-aviso-fg",
    marcador: "bg-aviso-fg",
  },
  aproximado: {
    nome: "Aproximado",
    texto: "Google pausado até a cota renovar. Distâncias novas são estimadas.",
    caixa: "bg-erro-bg text-erro-fg",
    marcador: "bg-erro-fg",
  },
};

const numero = (n: number) => n.toLocaleString("pt-BR");

function Linha({ rotulo, valor, destaque }: { rotulo: string; valor: ReactNode; destaque?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className={destaque ? "font-medium text-sucesso-fg" : "text-muted-foreground"}>{rotulo}</span>
      <span className={cn("font-semibold", destaque && "text-sucesso-fg")}>{valor}</span>
    </div>
  );
}

function Cartao({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("flex flex-col gap-4 rounded-xl bg-card p-5 shadow-ambient", className)}>{children}</section>;
}

function Erro({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="w-full rounded-lg bg-erro-bg p-3 text-sm text-erro-fg">
      {children}
    </p>
  );
}

/** Pedido de senha. A senha é conferida no servidor. */
function Senha({ onEntrar, onVoltar }: { onEntrar: () => void; onVoltar: () => void }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await entrarAdmin(senha);
      onEntrar();
    } catch (falha) {
      const status = falha instanceof ErroAdmin ? falha.status : 0;
      setErro(
        status === 401
          ? "Senha incorreta."
          : status === 429
            ? "Muitas tentativas. Tente de novo em 15 minutos."
            : "Não foi possível entrar agora. Tente de novo.",
      );
      setSenha("");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-4">
      <form onSubmit={enviar} className="flex w-full max-w-sm flex-col items-center gap-4 rounded-xl bg-card p-6 text-center shadow-ambient">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <img src={coruja} alt="" aria-hidden="true" className="h-11 w-11" />
        </div>
        <DialogTitle className="text-xl font-semibold">Área do administrador</DialogTitle>
        <DialogDescription className="sr-only">Digite a senha para abrir o painel.</DialogDescription>
        <div className="flex w-full flex-col gap-2 text-left">
          <label htmlFor="senha-admin" className="text-sm font-medium">
            Senha
          </label>
          <Input
            id="senha-admin"
            type="password"
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="h-11 rounded-lg"
          />
        </div>
        {erro && <Erro>{erro}</Erro>}
        <Button type="submit" disabled={!senha || enviando} className={BOTAO_PRINCIPAL}>
          {enviando ? "Entrando..." : "Entrar"}
        </Button>
        <Button type="button" variant="ghost" onClick={onVoltar} className="h-11 w-full font-semibold text-primary">
          Voltar ao mapa
        </Button>
      </form>
    </div>
  );
}

/** Barra em três faixas (normal, economia, limite) com o marcador do uso atual. */
function BarraCota({ painel, marcador }: { painel: Painel; marcador: string }) {
  const { cota, economiaAPartirDe, teto } = painel;
  const colunas = `${economiaAPartirDe}fr ${teto - economiaAPartirDe}fr ${cota - teto}fr`;
  const posicao = Math.min(100, (painel.resumo.unidades / cota) * 100);
  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-[14px] grid h-3 gap-0.5 overflow-hidden rounded-full" style={{ gridTemplateColumns: colunas }}>
          <div className="bg-sucesso-bg" />
          <div className="bg-aviso-bg" />
          <div className="bg-erro-bg" />
        </div>
        <div className="absolute top-0 flex h-10 w-5 -translate-x-1/2 items-center justify-center" style={{ left: `${posicao}%` }}>
          <div className={cn("h-9 w-1.5 rounded-full ring-2 ring-card", marcador)} />
        </div>
      </div>
      <div className="grid text-xs text-muted-foreground" style={{ gridTemplateColumns: colunas }}>
        <span>Normal</span>
        <span>Economia</span>
        <span />
      </div>
    </div>
  );
}

function ConferirGoogle({ unidades, onCalibrado }: { unidades: number; onCalibrado: () => void }) {
  const [resultado, setResultado] = useState<ConferenciaGoogle | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const executar = async (acao: () => Promise<ConferenciaGoogle>) => {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await acao();
      setResultado(resposta);
      if (resposta.calibrado) onCalibrado();
    } catch {
      setErro("Não foi possível ler o uso no Google agora.");
    } finally {
      setCarregando(false);
    }
  };

  const estimativa = resultado?.unidadesRoutesEstimadas ?? 0;
  return (
    <Cartao className="gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Conferir com o Google</h2>
        <p className="text-sm leading-snug text-muted-foreground">
          Compara o nosso contador com o que o Google registrou. Os números do Google chegam com algumas horas de atraso.
        </p>
      </div>
      {!resultado && (
        <Button onClick={() => executar(conferirGoogle)} disabled={carregando} className={BOTAO_SECUNDARIO}>
          {carregando ? "Conferindo..." : "Conferir com o Google"}
        </Button>
      )}
      {resultado && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 rounded-lg bg-secondary p-3 text-sm">
            <Linha rotulo="Distâncias (Routes)" valor={`${numero(resultado.uso.requisicoes.routes)} pedidos`} />
            <Linha rotulo="Mapa carregado" valor={`${numero(resultado.uso.requisicoes.mapas)} vezes`} />
            <Linha rotulo="Busca de endereço" valor={`${numero(resultado.uso.requisicoes.places)} buscas`} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Nosso contador</span>
              <span className="text-xl font-semibold">{numero(resultado.resumo.unidades)}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Pelo Google (≈)</span>
              <span className="text-xl font-semibold">{numero(estimativa)}</span>
            </div>
          </div>
          {resultado.calibrado ? (
            <p role="status" className="rounded-lg bg-sucesso-bg p-3 text-sm text-sucesso-fg">
              Contador ajustado para {numero(resultado.resumo.unidades)}.
            </p>
          ) : (
            estimativa > unidades && (
              <Button onClick={() => executar(calibrarContador)} disabled={carregando} className={BOTAO_PRINCIPAL}>
                Ajustar contador para {numero(estimativa)}
              </Button>
            )
          )}
        </div>
      )}
      {erro && <Erro>{erro}</Erro>}
    </Cartao>
  );
}

function ConteudoPainel({ painel, onPainel, onFechar, onSair }: {
  painel: Painel;
  onPainel: (p: Painel) => void;
  onFechar: () => void;
  onSair: () => void;
}) {
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const { resumo, estado, escolas } = painel;
  const visual = ESTADOS[estado];
  const forcado = resumo.modo_forcado;
  const mes = Number(resumo.mes.slice(5, 7)) - 1;

  const alternarModo = async (ligar: boolean) => {
    setSalvando(true);
    setErro(null);
    try {
      onPainel(await definirModoForcado(ligar));
    } catch (falha) {
      if (falha instanceof ErroAdmin && falha.status === 401) return onSair();
      setErro("Não foi possível mudar o modo agora.");
    } finally {
      setSalvando(false);
    }
  };

  const recarregar = async () => {
    try {
      onPainel(await lerPainel());
    } catch {
      /* o número da conferência já aparece no cartão dela */
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 p-4 pb-8">
      <header className="flex items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary">
            <img src={coruja} alt="" aria-hidden="true" className="h-[30px] w-[30px]" />
          </div>
          <div className="flex flex-col">
            <span className={cn(EYEBROW, "text-muted-foreground")}>Administração</span>
            <DialogTitle className="text-xl font-semibold leading-tight">Painel</DialogTitle>
          </div>
        </div>
        <Button variant="ghost" onClick={onFechar} className="h-11 px-3 font-semibold text-primary">
          Fechar
        </Button>
      </header>
      <DialogDescription className="sr-only">Consumo da cota do Google e controles do modo aproximado.</DialogDescription>

      <section className={cn("flex flex-col gap-2 rounded-xl p-5", visual.caixa)} aria-live="polite">
        <span className={cn(EYEBROW, "font-semibold")}>Cota do Google · agora</span>
        <span data-testid="estado-cota" className="text-4xl font-bold leading-tight tracking-tight">
          {visual.nome}
          {forcado && " (forçado)"}
        </span>
        <p className="text-sm leading-normal">
          {forcado ? "Você ligou o modo aproximado. O Google não é chamado até você desligar." : visual.texto}
        </p>
      </section>

      <Cartao>
        <BarraCota painel={painel} marcador={visual.marcador} />
        <div className="flex flex-col gap-2.5 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Usado em {MESES[mes]}</span>
            <span data-testid="unidades-mes" className="text-xl font-bold">{numero(resumo.unidades)}</span>
          </div>
          <Linha rotulo="Economia a partir de" valor={numero(painel.economiaAPartirDe)} />
          <Linha rotulo="Limite (Google pausa)" valor={numero(painel.teto)} />
          <Linha rotulo="Cota grátis" valor={numero(painel.cota)} />
        </div>
        <div className="flex flex-col gap-1.5 rounded-lg bg-secondary p-3 text-sm">
          <Linha rotulo="Cálculos reaproveitados" valor={numero(resumo.acertos_cache)} />
          <Linha rotulo="Idas ao Google" valor={numero(resumo.calculos_google)} />
          <Linha rotulo="Unidades poupadas" valor={numero(resumo.acertos_cache * escolas)} destaque />
        </div>
        <span className="text-xs text-muted-foreground">A cota renova em 1º de {MESES[(mes + 1) % 12]}.</span>
      </Cartao>

      <Cartao className="flex-row items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="modo-forcado" className="text-base font-semibold">
            Forçar modo aproximado
          </label>
          <span className="text-sm leading-snug text-muted-foreground">
            Para de chamar o Google agora. Distâncias novas viram estimativa.
          </span>
        </div>
        <Switch
          id="modo-forcado"
          checked={forcado}
          disabled={salvando}
          onCheckedChange={alternarModo}
          className="h-8 w-[52px] [&>span]:h-6 [&>span]:w-6 [&>span]:data-[state=checked]:translate-x-5"
        />
      </Cartao>
      {erro && <Erro>{erro}</Erro>}

      <ConferirGoogle unidades={resumo.unidades} onCalibrado={recarregar} />

      <section className="flex flex-col gap-1 rounded-xl bg-secondary p-5">
        <span className={cn(EYEBROW, "text-muted-foreground")}>Em breve</span>
        <span className="text-sm text-muted-foreground">Uso do aplicativo: visitas, endereços definidos, escolas mais vistas.</span>
      </section>

      <Button variant="ghost" onClick={onSair} className="h-11 font-semibold text-primary">
        Sair do painel
      </Button>
    </div>
  );
}

/** Painel /admin: senha e, com sessão válida, o consumo da cota do Google. */
export function PainelAdmin({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const [logado, setLogado] = useState(() => temSessaoAdmin());
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const sair = useCallback(() => {
    encerrarSessaoAdmin();
    setLogado(false);
    setPainel(null);
  }, []);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setPainel(await lerPainel());
    } catch (falha) {
      if (falha instanceof ErroAdmin && falha.status === 401) sair();
      else setErro("Não foi possível carregar o painel.");
    }
  }, [sair]);

  useEffect(() => {
    if (aberto && logado) void carregar();
  }, [aberto, logado, carregar]);

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && onFechar()}>
      <DialogContent className="block h-[100dvh] max-h-none w-full max-w-none overflow-y-auto rounded-none border-0 bg-background p-0 sm:rounded-none [&>button.absolute]:hidden">
        {!logado ? (
          <Senha onEntrar={() => setLogado(true)} onVoltar={onFechar} />
        ) : painel ? (
          <ConteudoPainel
            painel={painel}
            onPainel={setPainel}
            onFechar={onFechar}
            onSair={() => {
              sair();
              onFechar();
            }}
          />
        ) : (
          <div className="flex min-h-full flex-col items-center justify-center gap-4 p-4">
            <DialogTitle className="sr-only">Painel</DialogTitle>
            <DialogDescription className="sr-only">Carregando o painel.</DialogDescription>
            {erro ? (
              <>
                <Erro>{erro}</Erro>
                <Button onClick={carregar} className={cn(BOTAO_SECUNDARIO, "max-w-xs")}>
                  Tentar de novo
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground">Carregando painel...</p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
