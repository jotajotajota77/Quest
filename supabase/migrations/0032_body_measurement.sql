-- ============================================================
-- Quest — migration 0032: body_measurement (PR1).
-- ------------------------------------------------------------
-- Centraliza medidas corporais (peso, cintura, peito, braço, coxa,
-- quadril, pescoço, BF%) em uma tabela genérica indexada por kind.
--
-- Substitui gradualmente o uso de `corpo_real.peso` — mas mantém a
-- tabela antiga viva por 1 ciclo pra não quebrar as leituras
-- existentes. A migração NÃO apaga `corpo_real`.
--
-- Backfill: copia todas as linhas de corpo_real com peso not null pra
-- body_measurement como (kind='weight'). Idempotente via ON CONFLICT.
-- ============================================================

create table if not exists public.body_measurement (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  taken_at      timestamptz not null default now(),
  kind          text not null check (kind in (
    'weight', 'waist', 'chest', 'arm', 'thigh', 'hip', 'neck',
    'bf_pct', 'shoulder', 'forearm', 'calf'
  )),
  value_numeric numeric(6,2) not null,
  unit          text not null default 'kg'
                check (unit in ('kg', 'cm', 'pct', 'lb', 'in')),
  method        text
                check (method is null or method in (
                  'bioimpedance', 'caliper', 'tape', 'scale',
                  'photo_estimate', 'self_report'
                )),
  note          text,
  phase_id      bigint references public.physique_phase(id) on delete set null,
  criado_em     timestamptz not null default now(),
  -- Impede duplicata exata de mesma medida no mesmo instante.
  unique (user_id, kind, taken_at)
);

alter table public.body_measurement enable row level security;
create policy body_measurement_select on public.body_measurement
  for select using (auth.uid() = user_id);
create policy body_measurement_insert on public.body_measurement
  for insert with check (auth.uid() = user_id);
create policy body_measurement_update on public.body_measurement
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy body_measurement_delete on public.body_measurement
  for delete using (auth.uid() = user_id);

create index if not exists idx_body_measurement_user_kind_time
  on public.body_measurement (user_id, kind, taken_at desc);

create index if not exists idx_body_measurement_user_time
  on public.body_measurement (user_id, taken_at desc);

-- ------------------------------------------------------------
-- Backfill de corpo_real → body_measurement (peso apenas).
-- ------------------------------------------------------------
-- corpo_real.peso pode ser null; só migra linhas com peso.
-- Nao insere duplicata (unique key user_id + kind + taken_at).
insert into public.body_measurement (user_id, taken_at, kind, value_numeric, unit, method, note)
select
  user_id,
  ts,
  'weight',
  peso,
  'kg',
  'scale',
  case when descricao is not null and length(descricao) > 0
       then 'migrado de corpo_real: ' || descricao
       else 'migrado de corpo_real'
  end
from public.corpo_real
where peso is not null
on conflict (user_id, kind, taken_at) do nothing;

-- Backfill de cintura (se existir dentro do jsonb `medidas.cintura`).
insert into public.body_measurement (user_id, taken_at, kind, value_numeric, unit, method, note)
select
  user_id,
  ts,
  'waist',
  (medidas->>'cintura')::numeric,
  'cm',
  'tape',
  'migrado de corpo_real.medidas'
from public.corpo_real
where medidas ? 'cintura'
  and (medidas->>'cintura') ~ '^[0-9]+(\.[0-9]+)?$'
on conflict (user_id, kind, taken_at) do nothing;

-- Backfill de bf_pct (via composicao.gordura_pct).
insert into public.body_measurement (user_id, taken_at, kind, value_numeric, unit, method, note)
select
  user_id,
  ts,
  'bf_pct',
  (composicao->>'gordura_pct')::numeric,
  'pct',
  'bioimpedance',
  'migrado de corpo_real.composicao'
from public.corpo_real
where composicao ? 'gordura_pct'
  and (composicao->>'gordura_pct') ~ '^[0-9]+(\.[0-9]+)?$'
on conflict (user_id, kind, taken_at) do nothing;
