-- ============================================================
-- Quest — migration 0023: logs_tkd (registro de sessão TKD).
-- ------------------------------------------------------------
-- O que foi feito na aula do sabum (kicks, poomsae, sparring, etc.) —
-- registro livre por sessão, com duração e notas opcionais.
-- ============================================================

create table if not exists public.logs_tkd (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ts            timestamptz not null default now(),
  descricao     text not null,
  duracao_min   integer,
  notas         text
);

create index if not exists idx_logs_tkd_user_ts
  on public.logs_tkd (user_id, ts desc);

alter table public.logs_tkd enable row level security;

create policy logs_tkd_select on public.logs_tkd
  for select using (auth.uid() = user_id);
create policy logs_tkd_insert on public.logs_tkd
  for insert with check (auth.uid() = user_id);
create policy logs_tkd_delete on public.logs_tkd
  for delete using (auth.uid() = user_id);
