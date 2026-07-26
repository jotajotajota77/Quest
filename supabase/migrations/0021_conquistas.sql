-- ============================================================
-- Quest — migration 0021: conquistas (badges permanentes).
-- ------------------------------------------------------------
-- Cada conquista desbloqueada é uma linha (user_id, conquista_id, ts).
-- Persistente e permanente — nunca reseta com histórico ou finalizar dia.
-- Regras de desbloqueio ficam em lib/conquistas.ts (client-side puro).
-- ============================================================

create table if not exists public.conquistas_unlocked (
  user_id       uuid not null references auth.users(id) on delete cascade,
  conquista_id  text not null,
  desbloqueada_em timestamptz not null default now(),
  primary key (user_id, conquista_id)
);

create index if not exists idx_conquistas_user_ts
  on public.conquistas_unlocked (user_id, desbloqueada_em desc);

alter table public.conquistas_unlocked enable row level security;

create policy conquistas_select on public.conquistas_unlocked
  for select using (auth.uid() = user_id);
create policy conquistas_insert on public.conquistas_unlocked
  for insert with check (auth.uid() = user_id);
create policy conquistas_delete on public.conquistas_unlocked
  for delete using (auth.uid() = user_id);
