-- ============================================================
-- Quest — migration 0045: travel_period (PR 10, §23, §50, §95).
-- ------------------------------------------------------------
-- Períodos de viagem. Enquanto ativo, /nutri usa config alternativa
-- (proteína piso, logging simplificado, quests reduzidas).
--
-- Um período ativo por usuário (unique parcial). `reentry_ate` é a
-- data em que os targets voltam ao padrão gradualmente pós-viagem.
-- ============================================================

create table if not exists public.travel_period (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  iniciado_em   date not null default (now()::date),
  termina_em    date,
  reentry_ate   date,
  config        jsonb not null default '{}'::jsonb,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now()
);

alter table public.travel_period enable row level security;

create policy travel_period_select on public.travel_period
  for select using (auth.uid() = user_id);
create policy travel_period_insert on public.travel_period
  for insert with check (auth.uid() = user_id);
create policy travel_period_update on public.travel_period
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy travel_period_delete on public.travel_period
  for delete using (auth.uid() = user_id);

create unique index if not exists uniq_travel_period_ativo
  on public.travel_period (user_id)
  where ativo = true;

create index if not exists idx_travel_period_user_iniciado
  on public.travel_period (user_id, iniciado_em desc);
