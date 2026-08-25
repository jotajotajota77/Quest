-- ============================================================
-- Quest — migration 0040: physique_engine + nutrition_target (PR 4).
-- ------------------------------------------------------------
-- Engine determinístico (§42, §88) grava aqui suas decisões. Regras
-- estão em src/lib/physique/engine.ts — esta migração só cria os
-- containers.
--
-- physique_engine_decision:
--   Uma linha por avaliação. `signals jsonb` guarda os inputs que
--   levaram à decisão (peso 7d, cintura delta, sono etc). `aceito`
--   registra a resposta do usuário (pendente/aceito/adiado/ignorado).
--
-- nutrition_target:
--   Alvos calóricos + proteína pra fase ativa. Uma linha ativa por
--   usuário (unique index parcial). Substitui o "1800 kcal hardcode"
--   quando /nutri virar consumidor no PR5.
-- ============================================================

create table if not exists public.physique_engine_decision (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  phase_id      bigint references public.physique_phase(id) on delete set null,
  criado_em     timestamptz not null default now(),
  decision      text not null
    check (decision in (
      'keep_course',
      'small_adjustment',
      'recovery',
      'phase_review',
      'watch',
      'recovery_check'
    )),
  signals       jsonb not null default '{}'::jsonb,
  reason        text,
  confidence    numeric(3,2) check (confidence >= 0 and confidence <= 1),
  aceito        text not null default 'pendente'
    check (aceito in ('pendente', 'aceito', 'adiado', 'ignorado', 'expirado')),
  decidido_em   timestamptz
);

alter table public.physique_engine_decision enable row level security;

create policy physique_engine_decision_select on public.physique_engine_decision
  for select using (auth.uid() = user_id);
create policy physique_engine_decision_insert on public.physique_engine_decision
  for insert with check (auth.uid() = user_id);
create policy physique_engine_decision_update on public.physique_engine_decision
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy physique_engine_decision_delete on public.physique_engine_decision
  for delete using (auth.uid() = user_id);

create index if not exists idx_physique_engine_decision_user_criado
  on public.physique_engine_decision (user_id, criado_em desc);

-- ------------------------------------------------------------
-- nutrition_target
-- ------------------------------------------------------------

create table if not exists public.nutrition_target (
  id                  bigserial primary key,
  user_id             uuid not null references auth.users(id) on delete cascade,
  phase_id            bigint references public.physique_phase(id) on delete set null,
  iniciado_em         timestamptz not null default now(),
  encerrado_em        timestamptz,
  kcal                integer not null,
  kcal_range_min      integer not null,
  kcal_range_max      integer not null,
  protein_g           integer not null,
  protein_range_min   integer,
  protein_range_max   integer,
  carb_g              integer,
  fat_g_min           integer,
  ativo               boolean not null default true,
  origem              text
    check (origem is null or origem in ('inicial', 'engine', 'manual', 'phase_change')),
  criado_em           timestamptz not null default now()
);

alter table public.nutrition_target enable row level security;

create policy nutrition_target_select on public.nutrition_target
  for select using (auth.uid() = user_id);
create policy nutrition_target_insert on public.nutrition_target
  for insert with check (auth.uid() = user_id);
create policy nutrition_target_update on public.nutrition_target
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy nutrition_target_delete on public.nutrition_target
  for delete using (auth.uid() = user_id);

create index if not exists idx_nutrition_target_user_ativo
  on public.nutrition_target (user_id, ativo);

-- Só UM target ativo por usuário. Trocar target = desativar o anterior +
-- inserir o novo. Preserva histórico.
create unique index if not exists uniq_nutrition_target_ativo
  on public.nutrition_target (user_id)
  where ativo = true;
