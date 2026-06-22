-- ============================================================
-- Quest — migration 0008: sessões completas de treino por dia (v4)
-- ------------------------------------------------------------
-- Uma SESSÃO = o treino do dia para um split. As séries já vivem em
-- treino_series; esta tabela é o invólucro "sessão do dia" com encerramento.
-- O reforço continua na camada universal (concluir a sessão dispara o log de
-- treino → Força + hit-confirm). Aqui só marcamos a sessão como finalizada.
-- ============================================================

create table if not exists public.treino_sessoes (
  user_id     uuid not null references auth.users(id) on delete cascade,
  data        date not null,
  split       text not null,
  finalizada  boolean not null default false,
  atualizado_em timestamptz not null default now(),
  primary key (user_id, data, split)
);

alter table public.treino_sessoes enable row level security;
create policy treino_sessoes_select on public.treino_sessoes for select using (auth.uid() = user_id);
create policy treino_sessoes_insert on public.treino_sessoes for insert with check (auth.uid() = user_id);
create policy treino_sessoes_update on public.treino_sessoes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy treino_sessoes_delete on public.treino_sessoes for delete using (auth.uid() = user_id);
