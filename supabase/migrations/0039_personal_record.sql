-- ============================================================
-- Quest — migration 0039: personal_record (PR 3, §54-57).
-- ------------------------------------------------------------
-- Sistema de PRs multidimensional. Um PR de puxada (carga) NÃO colide
-- com um PR de prancha (tempo) porque a chave lógica é
-- (exercise_slug OR nome, metric_type, tipo).
--
-- Tipos de PR (§56):
--   'carga'      — maior peso movido (weight_reps, bw_weighted)
--   'reps'       — mais reps (bw_reps, weight_reps)
--   'volume'     — peso × reps (weight_reps)
--   'tempo'      — mais segundos (time, duration)
--   'distancia'  — mais metros (distance)
--
-- `deposed_by_id` = quando um PR novo é registrado que supera este,
-- aponta pro sucessor (linked list). Permite histórico completo.
--
-- Backfill: extrai treino_series.is_pr=true existente e cria uma
-- linha de personal_record por série marcada como PR. Idempotente
-- via unique (user_id, nome, metric_type, tipo, batido_em).
-- ============================================================

create table if not exists public.personal_record (
  id                bigserial primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  exercise_slug     text references public.exercise_definition(slug) on delete set null,
  nome              text not null,
  metric_type       text not null
    check (metric_type in (
      'weight_reps', 'bw_reps', 'bw_assisted', 'bw_weighted',
      'time', 'distance', 'duration', 'interval', 'custom'
    )),
  tipo              text not null
    check (tipo in ('carga', 'reps', 'volume', 'tempo', 'distancia')),
  valor             numeric(10,2) not null,
  reps_no_top       smallint,
  peso_no_top       numeric(6,2),
  seconds_no_top    integer,
  batido_em         timestamptz not null default now(),
  serie_id          uuid references public.treino_series(id) on delete set null,
  deposed_by_id     bigint references public.personal_record(id) on delete set null,
  criado_em         timestamptz not null default now(),
  unique (user_id, nome, metric_type, tipo, batido_em)
);

alter table public.personal_record enable row level security;

create policy personal_record_select on public.personal_record
  for select using (auth.uid() = user_id);
create policy personal_record_insert on public.personal_record
  for insert with check (auth.uid() = user_id);
create policy personal_record_update on public.personal_record
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy personal_record_delete on public.personal_record
  for delete using (auth.uid() = user_id);

create index if not exists idx_personal_record_user_exercicio
  on public.personal_record (user_id, nome, tipo, batido_em desc);

create index if not exists idx_personal_record_user_metric
  on public.personal_record (user_id, metric_type, batido_em desc);

-- ------------------------------------------------------------
-- Backfill: cada série com is_pr=true em treino_series vira uma
-- linha em personal_record. Preserva histórico. Só peso × reps
-- gera PR (linhas antigas nunca foram time/distance).
--
-- - tipo='carga' pra cada PR de peso
-- - tipo='volume' quando a série tem peso E reps (peso × reps)
-- - deposed_by_id fica null nesta primeira geração; o engine
--   preenche depois via reprocessamento (fora do escopo do PR3).
-- ------------------------------------------------------------

-- PRs de carga (peso máximo)
insert into public.personal_record
  (user_id, exercise_slug, nome, metric_type, tipo, valor,
   reps_no_top, peso_no_top, seconds_no_top, batido_em, serie_id)
select
  ts.user_id,
  null,                        -- exercise_slug: PR8 vai reconciliar via nome match
  ts.nome,
  coalesce(ts.metric_type, 'weight_reps'),
  'carga',
  ts.peso,
  ts.reps,
  ts.peso,
  ts.seconds,
  ts.ts,
  ts.id
from public.treino_series ts
where ts.is_pr = true
  and ts.peso is not null
on conflict (user_id, nome, metric_type, tipo, batido_em) do nothing;

-- PRs de volume (peso × reps) — só quando ambos existem.
insert into public.personal_record
  (user_id, exercise_slug, nome, metric_type, tipo, valor,
   reps_no_top, peso_no_top, seconds_no_top, batido_em, serie_id)
select
  ts.user_id,
  null,
  ts.nome,
  coalesce(ts.metric_type, 'weight_reps'),
  'volume',
  (ts.peso * ts.reps),
  ts.reps,
  ts.peso,
  ts.seconds,
  ts.ts,
  ts.id
from public.treino_series ts
where ts.is_pr = true
  and ts.peso is not null
  and ts.reps is not null
on conflict (user_id, nome, metric_type, tipo, batido_em) do nothing;
