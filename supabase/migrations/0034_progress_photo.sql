-- ============================================================
-- Quest — migration 0034: progress_photo (PR1).
-- ------------------------------------------------------------
-- Metadata de fotos de progresso (§9). O binário fica em Storage
-- (bucket privado `progress-photos` — crie manualmente com policy de
-- user_id). Esta tabela só guarda o path + contexto pra comparador
-- ANTES × AGORA.
-- ============================================================

create table if not exists public.progress_photo (
  id            bigserial primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  taken_at      timestamptz not null default now(),
  angle         text not null check (angle in (
    'front', 'side', 'back', 'relaxed', 'flexed', 'lat_spread', 'side_chest'
  )),
  storage_path  text not null,                 -- ex: 'progress-photos/<user_id>/<uuid>.jpg'
  thumb_path    text,
  weight_kg     numeric(5,2),
  waist_cm      numeric(4,1),
  bf_est_pct    numeric(4,1),
  note          text,
  phase_id      bigint references public.physique_phase(id) on delete set null,
  criado_em     timestamptz not null default now()
);

alter table public.progress_photo enable row level security;
create policy progress_photo_select on public.progress_photo
  for select using (auth.uid() = user_id);
create policy progress_photo_insert on public.progress_photo
  for insert with check (auth.uid() = user_id);
create policy progress_photo_update on public.progress_photo
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy progress_photo_delete on public.progress_photo
  for delete using (auth.uid() = user_id);

create index if not exists idx_progress_photo_user_time
  on public.progress_photo (user_id, taken_at desc);

create index if not exists idx_progress_photo_user_angle
  on public.progress_photo (user_id, angle, taken_at desc);
