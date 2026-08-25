-- ============================================================
-- Quest — migration 0033: daily_checkin + weekly_checkin (PR1).
-- ------------------------------------------------------------
-- Daily <60s (§40): peso opcional, sono, fome, energia, dor, humor.
-- Weekly (§41): peso médio, cintura (3 medidas → média), verdict do
-- physique engine (a lógica do engine entra no PR 4 — aqui só o
-- container de dados).
-- ============================================================

create table if not exists public.daily_checkin (
  id                bigserial primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  data              date not null default (now()::date),
  peso_kg           numeric(5,2),
  sono_h            numeric(3,1),
  sono_qualidade    smallint check (sono_qualidade between 1 and 5),
  fome              smallint check (fome between 0 and 10),
  energia           smallint check (energia between 0 and 10),
  dor               smallint check (dor between 0 and 10),
  stress            smallint check (stress between 0 and 10),
  treino_previsto   boolean not null default false,
  tkd_previsto      boolean not null default false,
  danca_prevista    boolean not null default false,
  humor             text check (humor in ('otimo', 'normal', 'cansado', 'destruido')),
  nota              text,
  criado_em         timestamptz not null default now(),
  -- 1 check-in por dia por usuário. Update sobrescreve.
  unique (user_id, data)
);

alter table public.daily_checkin enable row level security;
create policy daily_checkin_select on public.daily_checkin
  for select using (auth.uid() = user_id);
create policy daily_checkin_insert on public.daily_checkin
  for insert with check (auth.uid() = user_id);
create policy daily_checkin_update on public.daily_checkin
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy daily_checkin_delete on public.daily_checkin
  for delete using (auth.uid() = user_id);

create index if not exists idx_daily_checkin_user_data
  on public.daily_checkin (user_id, data desc);

-- ------------------------------------------------------------
-- weekly_checkin
-- ------------------------------------------------------------
create table if not exists public.weekly_checkin (
  id                   bigserial primary key,
  user_id              uuid not null references auth.users(id) on delete cascade,
  semana_iso           text not null,          -- ex '2026-W32'
  peso_medio_kg        numeric(5,2),
  peso_delta_pct       numeric(5,2),           -- vs semana anterior
  cintura_medida_1     numeric(4,1),
  cintura_medida_2     numeric(4,1),
  cintura_medida_3     numeric(4,1),
  cintura_media_cm     numeric(4,1)
    generated always as (
      case when cintura_medida_1 is not null
             and cintura_medida_2 is not null
             and cintura_medida_3 is not null
           then round((cintura_medida_1 + cintura_medida_2 + cintura_medida_3) / 3.0, 1)
           else null
      end
    ) stored,
  cintura_delta_cm     numeric(4,1),
  treino_sessoes       smallint,
  prs_batidos          smallint,
  proteina_pct         smallint check (proteina_pct is null or (proteina_pct between 0 and 200)),
  calorias_pct         smallint check (calorias_pct is null or (calorias_pct between 0 and 200)),
  sono_h_medio         numeric(3,1),
  fome_media           numeric(3,1),
  tkd_sessoes          smallint,
  danca_sessoes        smallint,
  foto_ids             bigint[] not null default '{}'::bigint[],
  verdict              text check (verdict in (
                         'keep_course', 'small_adjustment',
                         'recovery', 'phase_review'
                       )),
  verdict_justificativa text,
  verdict_aceito_em    timestamptz,
  phase_id             bigint references public.physique_phase(id) on delete set null,
  criado_em            timestamptz not null default now(),
  unique (user_id, semana_iso)
);

alter table public.weekly_checkin enable row level security;
create policy weekly_checkin_select on public.weekly_checkin
  for select using (auth.uid() = user_id);
create policy weekly_checkin_insert on public.weekly_checkin
  for insert with check (auth.uid() = user_id);
create policy weekly_checkin_update on public.weekly_checkin
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy weekly_checkin_delete on public.weekly_checkin
  for delete using (auth.uid() = user_id);

create index if not exists idx_weekly_checkin_user_semana
  on public.weekly_checkin (user_id, semana_iso desc);
