-- ============================================================
-- Quest — migration 0044: physique_priority + mastery groups V-Taper (PR 8).
-- ------------------------------------------------------------
-- §10, §16, §39, §100. V-Taper Skill Tree:
--   S-tier default: lat, side_delts
--   A-tier default: upper_chest, back_thickness, rear_delt
--   B-tier default: chest_geral, core
--   C-tier default: biceps, triceps, legs
--
-- Novos grupos musculares (rodam via distribuicaoDoExercicio estendida
-- em src/lib/engine/mastery.ts):
--   upper_chest      (peito superior)
--   back_width       (dorsal — largura, ex. puxada/barra)
--   back_thickness   (dorsal — espessura, ex. remadas)
--   shoulders_side   (deltoide lateral)
--   shoulders_rear   (deltoide posterior + trapézio médio)
--
-- Preserva XP: cada user que já tem 'chest', 'back' ou 'shoulders' tem
-- o XP SPLITADO nas novas linhas (proporções do plano: 0.7/0.3, 0.5/0.5,
-- 0.7/0.3). Migração é idempotente: só roda se ainda não existir
-- upper_chest global.
-- ============================================================

create table if not exists public.physique_priority (
  user_id       uuid not null references auth.users(id) on delete cascade,
  muscle_group  text not null,
  tier          text not null check (tier in ('s', 'a', 'b', 'c')),
  ordem         smallint not null default 0,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, muscle_group)
);

alter table public.physique_priority enable row level security;

create policy physique_priority_select on public.physique_priority
  for select using (auth.uid() = user_id);
create policy physique_priority_insert on public.physique_priority
  for insert with check (auth.uid() = user_id);
create policy physique_priority_update on public.physique_priority
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy physique_priority_delete on public.physique_priority
  for delete using (auth.uid() = user_id);

create index if not exists idx_physique_priority_user_tier
  on public.physique_priority (user_id, tier, ordem);

-- ------------------------------------------------------------
-- Backfill 1: split de XP legado nos novos grupos musculares.
-- Idempotente pelo guard `not exists ... upper_chest`.
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from public.mastery_musculo where grupo = 'upper_chest'
  ) then
    -- chest → upper_chest (0.3 do XP original vira upper_chest,
    -- chest fica com 0.7). Preserva nível — engine relevela na
    -- primeira leitura se necessário.
    insert into public.mastery_musculo (user_id, grupo, xp, nivel, atualizado_em)
    select user_id, 'upper_chest', greatest(0, round(xp * 0.3)::int), nivel, now()
    from public.mastery_musculo where grupo = 'chest'
    on conflict (user_id, grupo) do nothing;
    update public.mastery_musculo
      set xp = greatest(0, round(xp * 0.7)::int), atualizado_em = now()
      where grupo = 'chest';

    -- back → back_width (0.5) + back_thickness (0.5).
    insert into public.mastery_musculo (user_id, grupo, xp, nivel, atualizado_em)
    select user_id, 'back_width', greatest(0, round(xp * 0.5)::int), nivel, now()
    from public.mastery_musculo where grupo = 'back'
    on conflict (user_id, grupo) do nothing;
    insert into public.mastery_musculo (user_id, grupo, xp, nivel, atualizado_em)
    select user_id, 'back_thickness', greatest(0, round(xp * 0.5)::int), nivel, now()
    from public.mastery_musculo where grupo = 'back'
    on conflict (user_id, grupo) do nothing;
    -- back legado zera — todo XP migrou pra width + thickness (não é 50%
    -- + 50% + original inteiro, seria duplicar).
    delete from public.mastery_musculo where grupo = 'back';

    -- shoulders → shoulders_side (0.7) + shoulders_rear (0.3).
    insert into public.mastery_musculo (user_id, grupo, xp, nivel, atualizado_em)
    select user_id, 'shoulders_side', greatest(0, round(xp * 0.7)::int), nivel, now()
    from public.mastery_musculo where grupo = 'shoulders'
    on conflict (user_id, grupo) do nothing;
    insert into public.mastery_musculo (user_id, grupo, xp, nivel, atualizado_em)
    select user_id, 'shoulders_rear', greatest(0, round(xp * 0.3)::int), nivel, now()
    from public.mastery_musculo where grupo = 'shoulders'
    on conflict (user_id, grupo) do nothing;
    delete from public.mastery_musculo where grupo = 'shoulders';
  end if;
end $$;

-- ------------------------------------------------------------
-- Backfill 2: seed default de priorities pra todo user que já tem
-- pelo menos 1 linha em mastery_musculo. Preserva se já editado.
-- ------------------------------------------------------------
insert into public.physique_priority (user_id, muscle_group, tier, ordem)
select distinct m.user_id, x.muscle_group, x.tier, x.ordem
from public.mastery_musculo m
cross join (values
  ('back_width',      's', 1),
  ('shoulders_side',  's', 2),
  ('upper_chest',     'a', 1),
  ('back_thickness',  'a', 2),
  ('shoulders_rear',  'a', 3),
  ('chest',           'b', 1),
  ('core',            'b', 2),
  ('biceps',          'c', 1),
  ('triceps',         'c', 2),
  ('lower',           'c', 3)
) as x(muscle_group, tier, ordem)
on conflict (user_id, muscle_group) do nothing;
