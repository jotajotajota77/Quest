-- ============================================================
-- Quest — migration 0005: protocolo diário + finalizar o dia (v4)
-- ------------------------------------------------------------
-- Protocolo = quick-log de TRACKING na home: núcleo (os 4 comportamentos, que
-- já alimentam atributo/tier via logs) + trackers leves (água/sono/passos/
-- álcool) que alimentam só o %/streak do protocolo, NÃO os 4 atributos.
-- ============================================================

create table if not exists public.protocolo_diario (
  user_id        uuid not null references auth.users(id) on delete cascade,
  data           date not null,
  trackers_leves jsonb not null default '{}'::jsonb, -- {agua_count,sono_ok,passos_ok,sem_alcool}
  atualizado_em  timestamptz not null default now(),
  primary key (user_id, data)
);

alter table public.dias
  add column if not exists finalizado boolean not null default false;

alter table public.protocolo_diario enable row level security;
create policy protocolo_diario_select on public.protocolo_diario
  for select using (auth.uid() = user_id);
create policy protocolo_diario_insert on public.protocolo_diario
  for insert with check (auth.uid() = user_id);
create policy protocolo_diario_update on public.protocolo_diario
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy protocolo_diario_delete on public.protocolo_diario
  for delete using (auth.uid() = user_id);
