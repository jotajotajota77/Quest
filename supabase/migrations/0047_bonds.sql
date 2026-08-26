-- ============================================================
-- Quest — migration 0047: personagem_bond (PR 11, §91).
-- ------------------------------------------------------------
-- Bond desbloqueia cosmetics e frases, NUNCA eficácia (§91).
-- Ganha XP por log no domínio do mestre.
--
-- Um bond por (user_id, personagem_slug). Nível cresce com XP.
-- Curva: nivel 1→2 = 100 XP, 2→3 = 250, 3→4 = 500, ... (log-ish).
-- ============================================================

create table if not exists public.personagem_bond (
  user_id         uuid not null references auth.users(id) on delete cascade,
  personagem_slug text not null,
  xp              integer not null default 0 check (xp >= 0),
  nivel           integer not null default 1 check (nivel >= 1),
  atualizado_em   timestamptz not null default now(),
  primary key (user_id, personagem_slug)
);

alter table public.personagem_bond enable row level security;

create policy personagem_bond_select on public.personagem_bond
  for select using (auth.uid() = user_id);
create policy personagem_bond_insert on public.personagem_bond
  for insert with check (auth.uid() = user_id);
create policy personagem_bond_update on public.personagem_bond
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy personagem_bond_delete on public.personagem_bond
  for delete using (auth.uid() = user_id);

create index if not exists idx_personagem_bond_user
  on public.personagem_bond (user_id, xp desc);
