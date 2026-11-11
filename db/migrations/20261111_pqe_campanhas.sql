-- Pra Qual Escola — campanhas (remoção, atribuição...) e vagas por escola.
-- Plano: ref/planos/2026-11-11-campanhas-no-banco.md
--
-- Mesmo padrão da cota (20261110_pqe_cota.sql): tabelas no schema `praqualescola` (não exposto na REST),
-- acesso só pelas funções `public.pqe_*`, executáveis apenas por `service_role`.
-- As campanhas e as vagas são carregadas pelo agente (db/campanhas/); o painel /admin só edita
-- nome, descrição, datas, o interruptor e o arquivamento.

create table praqualescola.campanhas (
  id             text primary key,                       -- slug, ex.: remocao-2027-1a-fase
  nome           text not null,
  descricao      text not null default '',
  inicio         timestamptz not null,
  fim            timestamptz not null,
  ligada         boolean not null default false,
  arquivada      boolean not null default false,
  fonte          text,                                   -- ex.: "Lista da Secretaria de 06/11/2026"
  criada_em      timestamptz not null default now(),
  atualizada_em  timestamptz not null default now(),
  check (fim > inicio)
);

-- Vagas de cada escola numa campanha, como vieram da fonte. Só número positivo é vaga;
-- zero ou negativo é "sem vaga" (guardado cru para conferência com o PDF).
create table praqualescola.campanha_vagas (
  campanha       text not null references praqualescola.campanhas (id) on delete cascade,
  codigo_inep    text not null,
  nome_na_fonte  text not null,
  vagas          integer not null,
  primary key (campanha, codigo_inep)
);

alter table praqualescola.campanhas      enable row level security;
alter table praqualescola.campanha_vagas enable row level security;

revoke all on praqualescola.campanhas, praqualescola.campanha_vagas from public, anon, authenticated;

-- ───────────────────────── Funções de acesso (public.pqe_*) ─────────────────────────

-- A campanha no ar: ligada, não arquivada e dentro das datas. Havendo mais de uma, vale a que
-- começou primeiro (empate: id). Devolve só as escolas com vaga (> 0). Nenhuma: null.
create or replace function public.pqe_campanha_no_ar()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'id',               c.id,
    'nome',             c.nome,
    'descricao',        c.descricao,
    'inicio',           c.inicio,
    'fim',              c.fim,
    'fonte',            c.fonte,
    'vagas',            coalesce(
                          (select jsonb_object_agg(v.codigo_inep, v.vagas)
                             from praqualescola.campanha_vagas v
                            where v.campanha = c.id and v.vagas > 0),
                          '{}'::jsonb),
    'escolas_com_vaga', (select count(*) from praqualescola.campanha_vagas v
                          where v.campanha = c.id and v.vagas > 0),
    'total_vagas',      (select coalesce(sum(v.vagas), 0) from praqualescola.campanha_vagas v
                          where v.campanha = c.id and v.vagas > 0)
  )
  from praqualescola.campanhas c
  where c.ligada
    and not c.arquivada
    and now() between c.inicio and c.fim
  order by c.inicio, c.id
  limit 1;
$$;

-- Todas as campanhas para o painel, da mais recente para a mais antiga, com o resumo das vagas.
create or replace function public.pqe_campanhas_admin()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',               c.id,
      'nome',             c.nome,
      'descricao',        c.descricao,
      'inicio',           c.inicio,
      'fim',              c.fim,
      'ligada',           c.ligada,
      'arquivada',        c.arquivada,
      'fonte',            c.fonte,
      'atualizada_em',    c.atualizada_em,
      'escolas_na_lista', (select count(*) from praqualescola.campanha_vagas v where v.campanha = c.id),
      'escolas_com_vaga', (select count(*) from praqualescola.campanha_vagas v
                            where v.campanha = c.id and v.vagas > 0),
      'total_vagas',      (select coalesce(sum(v.vagas), 0) from praqualescola.campanha_vagas v
                            where v.campanha = c.id and v.vagas > 0),
      'maiores',          coalesce(
                            (select jsonb_agg(jsonb_build_object(
                                      'nome_na_fonte', m.nome_na_fonte,
                                      'codigo_inep',   m.codigo_inep,
                                      'vagas',         m.vagas) order by m.vagas desc, m.nome_na_fonte)
                               from (select v.nome_na_fonte, v.codigo_inep, v.vagas
                                       from praqualescola.campanha_vagas v
                                      where v.campanha = c.id and v.vagas > 0
                                      order by v.vagas desc, v.nome_na_fonte
                                      limit 5) m),
                            '[]'::jsonb)
    ) order by c.inicio desc, c.id
  ), '[]'::jsonb)
  from praqualescola.campanhas c;
$$;

-- Edita o que o painel pode mudar. Mensagens em português: o painel as mostra como estão.
create or replace function public.pqe_campanha_atualizar(
  p_id text, p_nome text, p_descricao text, p_inicio timestamptz, p_fim timestamptz, p_ligada boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_nome is null or btrim(p_nome) = '' then
    raise exception 'O nome não pode ficar vazio.';
  end if;
  if p_inicio is null or p_fim is null or p_fim <= p_inicio then
    raise exception 'O fim precisa ser depois do início.';
  end if;
  if p_ligada is null then
    raise exception 'Informe se a campanha está ligada.';
  end if;

  update praqualescola.campanhas
     set nome = btrim(p_nome),
         descricao = coalesce(p_descricao, ''),
         inicio = p_inicio,
         fim = p_fim,
         ligada = p_ligada,
         atualizada_em = now()
   where id = p_id;

  if not found then
    raise exception 'Campanha não encontrada.';
  end if;
end;
$$;

-- Arquiva (só depois do fim) ou desarquiva (sempre).
create or replace function public.pqe_campanha_arquivar(p_id text, p_arquivada boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fim timestamptz;
begin
  select c.fim into v_fim from praqualescola.campanhas c where c.id = p_id;
  if not found then
    raise exception 'Campanha não encontrada.';
  end if;
  if p_arquivada and v_fim >= now() then
    raise exception 'Só dá para arquivar depois do fim da campanha.';
  end if;

  update praqualescola.campanhas
     set arquivada = coalesce(p_arquivada, false),
         atualizada_em = now()
   where id = p_id;
end;
$$;

-- Só o servidor (service_role) executa.
revoke execute on function
  public.pqe_campanha_no_ar(),
  public.pqe_campanhas_admin(),
  public.pqe_campanha_atualizar(text, text, text, timestamptz, timestamptz, boolean),
  public.pqe_campanha_arquivar(text, boolean)
from public, anon, authenticated;

grant execute on function
  public.pqe_campanha_no_ar(),
  public.pqe_campanhas_admin(),
  public.pqe_campanha_atualizar(text, text, text, timestamptz, timestamptz, boolean),
  public.pqe_campanha_arquivar(text, boolean)
to service_role;
