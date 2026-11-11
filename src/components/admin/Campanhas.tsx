// Aba "Campanhas" do painel /admin: ligar/desligar, editar nome e datas, arquivar.
// As vagas são só leitura: quem as carrega é o agente, a partir do PDF da Secretaria.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BOTAO_PRINCIPAL,
  BOTAO_SECUNDARIO,
  Cartao,
  EYEBROW,
  Erro,
  InterruptorGrande,
  Linha,
  numero,
} from "@/components/admin/pecas";
import {
  ErroAdmin,
  arquivarCampanha,
  editarCampanha,
  lerCampanhas,
  type CampanhaAdmin,
  type EdicaoCampanha,
  type EstadoCampanha,
} from "@/lib/admin";
import { dataHoraCurta, deCampoBrasilia, paraCampoBrasilia } from "@/lib/campanha";
import { cn } from "@/lib/utils";

const ESTADOS: Record<EstadoCampanha, { nome: string; classe: string }> = {
  no_ar: { nome: "No ar", classe: "bg-sucesso-bg text-sucesso-fg" },
  agendada: { nome: "Agendada", classe: "bg-secondary text-primary" },
  desligada: { nome: "Desligada", classe: "bg-muted text-muted-foreground" },
  encerrada: { nome: "Encerrada", classe: "bg-muted text-muted-foreground" },
};

function Etiqueta({ estado }: { estado: EstadoCampanha }) {
  const e = ESTADOS[estado];
  return (
    <span data-testid="estado-campanha" className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-semibold", e.classe)}>
      {e.nome}
    </span>
  );
}

const edicaoDe = (c: CampanhaAdmin): EdicaoCampanha => ({
  id: c.id,
  nome: c.nome,
  descricao: c.descricao,
  inicio: c.inicio,
  fim: c.fim,
  ligada: c.ligada,
});

/** Mensagem do servidor (já em português) ou genérica; 401 é tratado antes. */
const mensagemDe = (falha: unknown) =>
  falha instanceof ErroAdmin && falha.status === 400 ? falha.message : "Não foi possível salvar agora. Tente de novo.";

function CartaoCampanha({ campanha, ocupado, onLigar, onEditar, onArquivar }: {
  campanha: CampanhaAdmin;
  ocupado: boolean;
  onLigar: (ligada: boolean) => void;
  onEditar: () => void;
  onArquivar: () => void;
}) {
  const c = campanha;
  const idInterruptor = `ligada-${c.id}`;
  return (
    <Cartao className="gap-3">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-semibold leading-snug">{c.nome}</h2>
        <Etiqueta estado={c.estado} />
      </div>
      <div className="flex flex-col gap-1.5 text-sm">
        <Linha rotulo="Início" valor={dataHoraCurta(c.inicio)} />
        <Linha rotulo="Fim" valor={dataHoraCurta(c.fim)} />
        <Linha rotulo="Escolas com vaga" valor={`${numero(c.escolas_com_vaga)} de ${numero(c.escolas_na_lista)}`} />
        <Linha rotulo="Vagas" valor={numero(c.total_vagas)} />
      </div>
      <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-3">
        <label htmlFor={idInterruptor} className="text-sm font-semibold">
          Campanha ligada
        </label>
        <InterruptorGrande id={idInterruptor} checked={c.ligada} disabled={ocupado} onCheckedChange={onLigar} />
      </div>
      <div className="flex gap-2">
        <Button onClick={onEditar} disabled={ocupado} className={BOTAO_SECUNDARIO}>
          Editar
        </Button>
        {c.estado === "encerrada" && (
          <Button onClick={onArquivar} disabled={ocupado} variant="ghost" className="h-11 w-full font-semibold text-primary">
            Arquivar
          </Button>
        )}
      </div>
    </Cartao>
  );
}

function EditarCampanha({ campanha, onSalvar, onCancelar }: {
  campanha: CampanhaAdmin;
  onSalvar: (edicao: EdicaoCampanha) => Promise<string | null>;
  onCancelar: () => void;
}) {
  const [nome, setNome] = useState(campanha.nome);
  const [descricao, setDescricao] = useState(campanha.descricao);
  const [inicio, setInicio] = useState(paraCampoBrasilia(campanha.inicio));
  const [fim, setFim] = useState(paraCampoBrasilia(campanha.fim));
  const [ligada, setLigada] = useState(campanha.ligada);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const isoInicio = deCampoBrasilia(inicio);
    const isoFim = deCampoBrasilia(fim);
    if (!nome.trim()) return setErro("O nome não pode ficar vazio.");
    if (!isoInicio) return setErro("Data de início inválida.");
    if (!isoFim) return setErro("Data de fim inválida.");
    if (Date.parse(isoFim) <= Date.parse(isoInicio)) return setErro("O fim precisa ser depois do início.");
    setSalvando(true);
    setErro(null);
    const falha = await onSalvar({ id: campanha.id, nome: nome.trim(), descricao: descricao.trim(), inicio: isoInicio, fim: isoFim, ligada });
    setSalvando(false);
    if (falha) setErro(falha);
  };

  const campo = "flex flex-col gap-2 text-sm font-medium";
  return (
    <form onSubmit={enviar} className="flex flex-col gap-4" aria-label="Editar campanha">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Editar campanha</h2>
        <Etiqueta estado={campanha.estado} />
      </div>
      <Cartao className="gap-4">
        <label className={campo}>
          Nome
          <Input value={nome} onChange={(e) => setNome(e.target.value)} className="h-11 rounded-lg font-normal" />
        </label>
        <label className={campo}>
          Descrição
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className={campo}>
            Início
            <Input type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className="h-11 rounded-lg font-normal" />
          </label>
          <label className={campo}>
            Fim
            <Input type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} className="h-11 rounded-lg font-normal" />
          </label>
        </div>
        <span className="-mt-2 text-xs text-muted-foreground">Horário de Brasília.</span>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-secondary p-3">
          <label htmlFor="editar-ligada" className="text-sm font-semibold">
            Campanha ligada
          </label>
          <InterruptorGrande id="editar-ligada" checked={ligada} onCheckedChange={setLigada} />
        </div>
      </Cartao>

      <Cartao className="gap-3">
        <span className={cn(EYEBROW, "text-muted-foreground")}>Vagas · só leitura</span>
        <div className="flex flex-col gap-1.5 text-sm">
          <Linha rotulo="Escolas na lista" valor={numero(campanha.escolas_na_lista)} />
          <Linha rotulo="Escolas com vaga" valor={numero(campanha.escolas_com_vaga)} />
          <Linha rotulo="Vagas" valor={numero(campanha.total_vagas)} />
        </div>
        {campanha.maiores.length > 0 && (
          <ul className="flex flex-col gap-1.5 rounded-lg bg-secondary p-3 text-sm">
            {campanha.maiores.map((m) => (
              <li key={m.codigo_inep}>
                <Linha rotulo={m.nome_na_fonte} valor={numero(m.vagas)} />
              </li>
            ))}
          </ul>
        )}
        {campanha.fonte && <span className="text-xs text-muted-foreground">Fonte: {campanha.fonte}</span>}
      </Cartao>

      {erro && <Erro>{erro}</Erro>}
      <Button type="submit" disabled={salvando} className={BOTAO_PRINCIPAL}>
        {salvando ? "Salvando..." : "Salvar"}
      </Button>
      <Button type="button" variant="ghost" onClick={onCancelar} className="h-11 font-semibold text-primary">
        Cancelar
      </Button>
    </form>
  );
}

/** Conteúdo da aba Campanhas. `onSair` volta à senha quando a sessão vence. */
export function Campanhas({ onSair }: { onSair: () => void }) {
  const [campanhas, setCampanhas] = useState<CampanhaAdmin[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setCampanhas((await lerCampanhas()).campanhas);
    } catch (falha) {
      if (falha instanceof ErroAdmin && falha.status === 401) return onSair();
      setErro("Não foi possível carregar as campanhas.");
    }
  }, [onSair]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  /** Executa uma mudança; devolve a mensagem de erro (ou null se deu certo). */
  const mudar = async (acao: () => ReturnType<typeof lerCampanhas>): Promise<string | null> => {
    setOcupado(true);
    setErro(null);
    try {
      setCampanhas((await acao()).campanhas);
      return null;
    } catch (falha) {
      if (falha instanceof ErroAdmin && falha.status === 401) {
        onSair();
        return null;
      }
      return mensagemDe(falha);
    } finally {
      setOcupado(false);
    }
  };

  const mudarNaLista = async (acao: () => ReturnType<typeof lerCampanhas>) => {
    const falha = await mudar(acao);
    if (falha) setErro(falha);
  };

  if (!campanhas) {
    return erro ? (
      <div className="flex flex-col gap-3">
        <Erro>{erro}</Erro>
        <Button onClick={carregar} className={BOTAO_SECUNDARIO}>
          Tentar de novo
        </Button>
      </div>
    ) : (
      <p className="py-6 text-center text-muted-foreground">Carregando campanhas...</p>
    );
  }

  const emEdicao = campanhas.find((c) => c.id === editando);
  if (emEdicao) {
    return (
      <EditarCampanha
        campanha={emEdicao}
        onCancelar={() => setEditando(null)}
        onSalvar={async (edicao) => {
          const falha = await mudar(() => editarCampanha(edicao));
          if (!falha) setEditando(null);
          return falha;
        }}
      />
    );
  }

  const ativas = campanhas.filter((c) => !c.arquivada);
  const arquivadas = campanhas.filter((c) => c.arquivada);
  const noAr = ativas.filter((c) => c.estado === "no_ar").length;

  return (
    <>
      {noAr > 1 && (
        <p role="status" className="rounded-lg bg-aviso-bg p-3 text-sm text-aviso-fg">
          Há {noAr} campanhas no ar ao mesmo tempo. O aplicativo mostra a que começou primeiro.
        </p>
      )}
      {erro && <Erro>{erro}</Erro>}

      {ativas.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhuma campanha.</p>}
      {ativas.map((c) => (
        <CartaoCampanha
          key={c.id}
          campanha={c}
          ocupado={ocupado}
          onLigar={(ligada) => mudarNaLista(() => editarCampanha({ ...edicaoDe(c), ligada }))}
          onEditar={() => setEditando(c.id)}
          onArquivar={() => mudarNaLista(() => arquivarCampanha(c.id, true))}
        />
      ))}

      {arquivadas.length > 0 && (
        <details className="group rounded-xl bg-card p-5 shadow-ambient">
          <summary className="cursor-pointer text-sm font-semibold text-primary">Arquivadas ({arquivadas.length})</summary>
          <ul className="mt-3 flex flex-col gap-2">
            {arquivadas.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{c.nome}</span>
                <Button
                  variant="ghost"
                  disabled={ocupado}
                  onClick={() => mudarNaLista(() => arquivarCampanha(c.id, false))}
                  className="h-10 px-3 font-semibold text-primary"
                  aria-label={`Desarquivar ${c.nome}`}
                >
                  Desarquivar
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <p className="text-xs leading-snug text-muted-foreground">
        Campanhas novas e as vagas são carregadas pelo agente, a partir do PDF da Secretaria.
      </p>
    </>
  );
}
