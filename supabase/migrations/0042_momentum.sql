-- ============================================================
-- Quest — migration 0042: momentum_snapshot (PR 7, §31-33).
-- ------------------------------------------------------------
-- Snapshot diário do momentum (janela 14 dias).
-- Fórmula D.4 vive em src/lib/physique/momentum.ts. Aqui só o container.
--
-- Uma linha por (user, data). Reenvio do daily_checkin recalcula
-- (upsert via unique).
--
-- CRÍTICO §27, §60: NÃO inclui "peso perdido" nem "kcal cortadas".
-- Uma falha isolada NÃO zera. É medida de aderência, não punição.
-- ============================================================

create table if not exists public.momentum_snapshot (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  data          date not null default (now()::date),
  janela_dias   smallint not null default 14,
  score         numeric(5,2) not null check (score >= 0 and score <= 100),
  componentes   jsonb not null default '{}'::jsonb,
  adherence_pct numeric(5,2) check (adherence_pct is null or (adherence_pct between 0 and 100)),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, data)
);

alter table public.momentum_snapshot enable row level security;

create policy momentum_snapshot_select on public.momentum_snapshot
  for select using (auth.uid() = user_id);
create policy momentum_snapshot_insert on public.momentum_snapshot
  for insert with check (auth.uid() = user_id);
create policy momentum_snapshot_update on public.momentum_snapshot
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy momentum_snapshot_delete on public.momentum_snapshot
  for delete using (auth.uid() = user_id);

create index if not exists idx_momentum_snapshot_user_data
  on public.momentum_snapshot (user_id, data desc);
