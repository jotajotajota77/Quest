-- ============================================================
-- Quest — migration 0022: logs_aquecimento (registro de warm-up + alongamento)
-- ------------------------------------------------------------
-- Registra o que foi feito no aquecimento e no alongamento (antes/depois do
-- treino). Vira histórico agregado no /treino.
-- ============================================================

create table if not exists public.logs_aquecimento (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ts            timestamptz not null default now(),
  tipo          text not null check (tipo in ('aquecimento', 'alongamento')),
  descricao     text not null,
  duracao_min   integer
);

create index if not exists idx_logs_aquecimento_user_ts
  on public.logs_aquecimento (user_id, ts desc);

alter table public.logs_aquecimento enable row level security;

create policy logs_aquec_select on public.logs_aquecimento
  for select using (auth.uid() = user_id);
create policy logs_aquec_insert on public.logs_aquecimento
  for insert with check (auth.uid() = user_id);
create policy logs_aquec_delete on public.logs_aquecimento
  for delete using (auth.uid() = user_id);
