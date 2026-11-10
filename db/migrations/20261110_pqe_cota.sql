-- Pra Qual Escola — controle da cota do Google (fase 1).
-- Desenho: ref/specs/2026-11-10-cota-google-design.md
--
-- Tudo do app fica no schema `praqualescola`, separado de `dados_gerais` (da SME).
-- O schema NÃO é exposto na API REST. O acesso é só pelas funções `public.pqe_*`,
-- executáveis apenas por `service_role` (a função de servidor na Vercel, com a chave secreta).
-- Nada aqui guarda endereço, IP em claro ou identificador de aparelho.

create schema if not exists praqualescola;
revoke all on schema praqualescola from public, anon, authenticated;

-- Mês da cota do Google: renova no dia 1º, meia-noite do horário do Pacífico.
create or replace function praqualescola.mes_atual()
returns text
language sql
stable
set search_path = ''
as $$
  select to_char(now() at time zone 'America/Los_Angeles', 'YYYY-MM');
$$;

-- Célula de ~200 m da grade (a casa exata nunca chega aqui).
create table praqualescola.celulas (
  id          text primary key,              -- "<i>_<j>" da grade
  centro_lat  double precision not null,
  centro_lng  double precision not null,
  criada_em   timestamptz not null default now()
);

-- Distância real (Google) do centro de uma célula até uma escola.
create table praqualescola.distancias (
  celula        text not null references praqualescola.celulas (id) on delete cascade,
  codigo_inep   text not null,
  metros        integer not null check (metros >= 0),
  segundos      integer not null check (segundos >= 0),
  escola_lat    double precision not null,   -- coordenadas da escola usadas no cálculo
  escola_lng    double precision not null,
  calculado_em  timestamptz not null default now(),
  primary key (celula, codigo_inep)
);

-- Contador do mês da cota.
create table praqualescola.uso_mensal (
  mes              text primary key,          -- AAAA-MM (America/Los_Angeles)
  unidades         integer not null default 0 check (unidades >= 0),
  acertos_cache    integer not null default 0 check (acertos_cache >= 0),
  calculos_google  integer not null default 0 check (calculos_google >= 0),
  calibrado_em     timestamptz
);

-- Configuração ajustável pelo painel (ex.: modo_forcado).
create table praqualescola.config (
  chave          text primary key,
  valor          jsonb not null,
  atualizado_em  timestamptz not null default now()
);

-- Limites de uso por hash (IP com segredo) e janela de tempo.
create table praqualescola.limites (
  hash           text not null,
  janela         text not null,
  contagem       integer not null default 0,
  atualizado_em  timestamptz not null default now(),
  primary key (hash, janela)
);

alter table praqualescola.celulas    enable row level security;
alter table praqualescola.distancias enable row level security;
alter table praqualescola.uso_mensal enable row level security;
alter table praqualescola.config     enable row level security;
alter table praqualescola.limites    enable row level security;

revoke all on all tables in schema praqualescola from public, anon, authenticated;
revoke all on function praqualescola.mes_atual() from public, anon, authenticated;

-- ───────────────────────── Funções de acesso (public.pqe_*) ─────────────────────────

-- Reserva unidades no mês, só se não passar do limite. Atômica: picos simultâneos não estouram.
create or replace function public.pqe_reservar(p_unidades integer, p_limite integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mes text := praqualescola.mes_atual();
begin
  if p_unidades is null or p_unidades <= 0 then
    raise exception 'p_unidades deve ser positivo';
  end if;
  insert into praqualescola.uso_mensal (mes) values (v_mes) on conflict (mes) do nothing;
  update praqualescola.uso_mensal
     set unidades = unidades + p_unidades,
         calculos_google = calculos_google + 1
   where mes = v_mes
     and unidades + p_unidades <= p_limite;
  return found;
end;
$$;

-- Estorna uma reserva quando o Google falha.
create or replace function public.pqe_devolver(p_unidades integer)
returns void
language sql
security definer
set search_path = ''
as $$
  update praqualescola.uso_mensal
     set unidades = greatest(unidades - p_unidades, 0),
         calculos_google = greatest(calculos_google - 1, 0)
   where mes = praqualescola.mes_atual();
$$;

-- Distâncias guardadas para as células pedidas (a da casa e, no modo Economia, as vizinhas).
create or replace function public.pqe_buscar(p_celulas text[])
returns table (
  celula text, codigo_inep text, metros integer, segundos integer,
  escola_lat double precision, escola_lng double precision
)
language sql
stable
security definer
set search_path = ''
as $$
  select d.celula, d.codigo_inep, d.metros, d.segundos, d.escola_lat, d.escola_lng
    from praqualescola.distancias d
   where d.celula = any (p_celulas);
$$;

-- Grava (ou atualiza) distâncias reais de uma célula.
-- p_linhas: [{ "codigo_inep", "metros", "segundos", "escola_lat", "escola_lng" }, ...]
create or replace function public.pqe_gravar(
  p_celula text, p_centro_lat double precision, p_centro_lng double precision, p_linhas jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into praqualescola.celulas (id, centro_lat, centro_lng)
  values (p_celula, p_centro_lat, p_centro_lng)
  on conflict (id) do nothing;

  insert into praqualescola.distancias (celula, codigo_inep, metros, segundos, escola_lat, escola_lng)
  select p_celula, x.codigo_inep, x.metros, x.segundos, x.escola_lat, x.escola_lng
    from jsonb_to_recordset(p_linhas)
         as x (codigo_inep text, metros integer, segundos integer,
               escola_lat double precision, escola_lng double precision)
  on conflict (celula, codigo_inep) do update
     set metros = excluded.metros,
         segundos = excluded.segundos,
         escola_lat = excluded.escola_lat,
         escola_lng = excluded.escola_lng,
         calculado_em = now();
end;
$$;

-- Conta uma resposta servida inteira pelo cache (para medir a economia).
create or replace function public.pqe_contar_acerto()
returns void
language sql
security definer
set search_path = ''
as $$
  insert into praqualescola.uso_mensal (mes, acertos_cache)
  values (praqualescola.mes_atual(), 1)
  on conflict (mes) do update
     set acertos_cache = praqualescola.uso_mensal.acertos_cache + 1;
$$;

-- Soma 1 uso na janela e diz se ainda está dentro do máximo. Limpa janelas velhas.
create or replace function public.pqe_limite(p_hash text, p_janela text, p_maximo integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contagem integer;
begin
  delete from praqualescola.limites where atualizado_em < now() - interval '2 days';
  insert into praqualescola.limites (hash, janela, contagem)
  values (p_hash, p_janela, 1)
  on conflict (hash, janela) do update
     set contagem = praqualescola.limites.contagem + 1,
         atualizado_em = now()
  returning contagem into v_contagem;
  return v_contagem <= p_maximo;
end;
$$;

-- Resumo para a função de distâncias e para o painel.
create or replace function public.pqe_resumo()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'mes',             m.mes,
    'unidades',        coalesce(u.unidades, 0),
    'acertos_cache',   coalesce(u.acertos_cache, 0),
    'calculos_google', coalesce(u.calculos_google, 0),
    'calibrado_em',    u.calibrado_em,
    'modo_forcado',    coalesce((select c.valor from praqualescola.config c where c.chave = 'modo_forcado'), 'false'::jsonb),
    'celulas',         (select count(*) from praqualescola.celulas)
  )
  from (select praqualescola.mes_atual() as mes) m
  left join praqualescola.uso_mensal u on u.mes = m.mes;
$$;

-- Define uma configuração (ex.: modo_forcado = true).
create or replace function public.pqe_config_definir(p_chave text, p_valor jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into praqualescola.config (chave, valor) values (p_chave, p_valor)
  on conflict (chave) do update set valor = excluded.valor, atualizado_em = now();
$$;

-- Calibra o contador com o gasto lido no Google. Nunca diminui: na dúvida, conta a mais.
create or replace function public.pqe_calibrar(p_unidades integer)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into praqualescola.uso_mensal (mes, unidades, calibrado_em)
  values (praqualescola.mes_atual(), greatest(p_unidades, 0), now())
  on conflict (mes) do update
     set unidades = greatest(praqualescola.uso_mensal.unidades, excluded.unidades),
         calibrado_em = now();
$$;

-- Só o servidor (service_role) executa.
revoke execute on function
  public.pqe_reservar(integer, integer),
  public.pqe_devolver(integer),
  public.pqe_buscar(text[]),
  public.pqe_gravar(text, double precision, double precision, jsonb),
  public.pqe_contar_acerto(),
  public.pqe_limite(text, text, integer),
  public.pqe_resumo(),
  public.pqe_config_definir(text, jsonb),
  public.pqe_calibrar(integer)
from public, anon, authenticated;

grant execute on function
  public.pqe_reservar(integer, integer),
  public.pqe_devolver(integer),
  public.pqe_buscar(text[]),
  public.pqe_gravar(text, double precision, double precision, jsonb),
  public.pqe_contar_acerto(),
  public.pqe_limite(text, text, integer),
  public.pqe_resumo(),
  public.pqe_config_definir(text, jsonb),
  public.pqe_calibrar(integer)
to service_role;
