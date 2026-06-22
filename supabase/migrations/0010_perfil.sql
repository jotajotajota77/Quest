-- ============================================================
-- Quest — migration 0010: descrição de perfil (base das dicas de treino)
-- ------------------------------------------------------------
-- Texto livre onde o usuário descreve objetivo, nível, limitações e contexto.
-- As dicas de treino (e a Análise IA) se personalizam a partir daqui.
-- ============================================================

create table if not exists public.perfil (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  descricao     text,
  atualizado_em timestamptz not null default now()
);

alter table public.perfil enable row level security;
create policy perfil_select on public.perfil for select using (auth.uid() = user_id);
create policy perfil_insert on public.perfil for insert with check (auth.uid() = user_id);
create policy perfil_update on public.perfil for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
