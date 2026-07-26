-- ============================================================
-- Quest — migration 0020: logs_danca
-- ------------------------------------------------------------
-- Registro dedicado de sessões de dança: qual música/coreografia foi feita
-- (nome livre + link opcional do Spotify), quanto tempo aproximado, com data.
-- Fica separado da tabela `logs` porque a mecânica é diferente (nome livre
-- de música, não é comportamento com XP direto no motor central) — e assim
-- não polui o histórico geral.
-- ============================================================

create table if not exists public.logs_danca (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ts            timestamptz not null default now(),
  musica        text not null,          -- nome livre da música/coreografia
  spotify_url   text,                   -- link opcional do Spotify
  duracao_min   integer,                -- duração aproximada em minutos
  nota          text                    -- comentário livre opcional
);

create index if not exists idx_logs_danca_user_ts
  on public.logs_danca (user_id, ts desc);

alter table public.logs_danca enable row level security;

create policy logs_danca_select on public.logs_danca
  for select using (auth.uid() = user_id);
create policy logs_danca_insert on public.logs_danca
  for insert with check (auth.uid() = user_id);
create policy logs_danca_update on public.logs_danca
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy logs_danca_delete on public.logs_danca
  for delete using (auth.uid() = user_id);
