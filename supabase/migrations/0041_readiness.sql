-- ============================================================
-- Quest — migration 0041: readiness_snapshot (PR 6, §17, §24).
-- ------------------------------------------------------------
-- Snapshot diário do readiness. Calculado no daily_checkin.
--
-- Fórmula D.3 (sono + fome + dor + performance + carga_semana + fadiga)
-- vive em src/lib/physique/readiness.ts. Aqui só o container.
--
-- Um snapshot por (user, data). Reenvio do daily_checkin recalcula
-- (upsert via unique).
-- ============================================================

create table if not exists public.readiness_snapshot (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  data          date not null default (now()::date),
  score         smallint not null check (score between 0 and 100),
  componentes   jsonb not null default '{}'::jsonb,
  veredicto     text not null
    check (veredicto in ('ready', 'caution', 'recovery_advised')),
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (user_id, data)
);

alter table public.readiness_snapshot enable row level security;

create policy readiness_snapshot_select on public.readiness_snapshot
  for select using (auth.uid() = user_id);
create policy readiness_snapshot_insert on public.readiness_snapshot
  for insert with check (auth.uid() = user_id);
create policy readiness_snapshot_update on public.readiness_snapshot
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy readiness_snapshot_delete on public.readiness_snapshot
  for delete using (auth.uid() = user_id);

create index if not exists idx_readiness_snapshot_user_data
  on public.readiness_snapshot (user_id, data desc);
