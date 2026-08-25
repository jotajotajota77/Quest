-- ============================================================
-- Quest — migration 0031: physique_phase (Adaptive Physique RPG PR1).
-- ------------------------------------------------------------
-- Substitui o "cutting único até 09/09" hardcoded em `meta` por uma
-- linha do tempo persistente de fases (CUT / MAINTENANCE / BUILD /
-- SPECIALIZATION / MINI_CUT / RECOVERY / TRAVEL / CUSTOM).
--
-- `meta` continua vivo (não quebra a home atual); a fase ativa vira
-- fonte da verdade para kcal/protein/target_rate. Fase inicial CUT
-- herda o cutting em curso via seed abaixo (started_at=2026-08-10,
-- kcal=1900, protein=135) — o usuário pode editar depois.
-- ============================================================

create table if not exists public.physique_phase (
  id                       bigserial primary key,
  user_id                  uuid not null references auth.users(id) on delete cascade,
  type                     text not null check (type in (
    'cut', 'maintenance', 'build', 'specialization',
    'mini_cut', 'recovery', 'travel', 'custom'
  )),
  status                   text not null default 'ativa' check (status in ('ativa', 'concluida', 'abandonada')),
  started_at               date not null default (now()::date),
  ended_at                 date,
  calorie_target           integer,                        -- alvo diário (opcional)
  calorie_range_min        integer,
  calorie_range_max        integer,
  calorie_target_min_floor integer,                        -- piso de segurança (§72). Default = TMB × 1.1.
  protein_target           integer,                        -- g/dia
  protein_range_min        integer,
  protein_range_max        integer,
  target_rate              numeric(4,2),                   -- % peso/semana esperado (ex 0.60 = 0.6%)
  target_weight_optional   numeric(5,2),                   -- checkpoint apenas (§4)
  target_waist_optional    numeric(4,1),
  target_bf_optional       numeric(4,1),
  goal_description         text,
  decision_notes           text,
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now()
);

alter table public.physique_phase enable row level security;
create policy physique_phase_select on public.physique_phase
  for select using (auth.uid() = user_id);
create policy physique_phase_insert on public.physique_phase
  for insert with check (auth.uid() = user_id);
create policy physique_phase_update on public.physique_phase
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy physique_phase_delete on public.physique_phase
  for delete using (auth.uid() = user_id);

create index if not exists idx_physique_phase_user_start
  on public.physique_phase (user_id, started_at desc);

-- Apenas UMA fase ativa por usuário. `status='ativa'` é único.
create unique index if not exists uniq_physique_phase_ativa
  on public.physique_phase (user_id)
  where status = 'ativa';

-- ------------------------------------------------------------
-- phase_transition — log de propostas de transição do engine (§44).
-- ------------------------------------------------------------
create table if not exists public.phase_transition (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  proposto_em   timestamptz not null default now(),
  from_phase_id bigint references public.physique_phase(id) on delete set null,
  to_type       text not null check (to_type in (
    'cut', 'maintenance', 'build', 'specialization',
    'mini_cut', 'recovery', 'travel', 'custom'
  )),
  signals       jsonb not null default '{}'::jsonb,
  reason        text,
  confidence    numeric(3,2) check (confidence >= 0 and confidence <= 1),
  estado        text not null default 'pendente'
                check (estado in ('pendente', 'aceito', 'adiado', 'ignorado', 'expirado')),
  decidido_em   timestamptz
);

alter table public.phase_transition enable row level security;
create policy phase_transition_select on public.phase_transition
  for select using (auth.uid() = user_id);
create policy phase_transition_insert on public.phase_transition
  for insert with check (auth.uid() = user_id);
create policy phase_transition_update on public.phase_transition
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy phase_transition_delete on public.phase_transition
  for delete using (auth.uid() = user_id);

create index if not exists idx_phase_transition_user
  on public.phase_transition (user_id, proposto_em desc);
