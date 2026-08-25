-- ============================================================
-- Quest — migration 0038: training_program (PR 3).
-- ------------------------------------------------------------
-- Instância personalizada de um template pro usuário. Só uma ativa por
-- vez (unique index parcial em ativo=true). `ajustes` guarda overrides
-- em jsonb (ex.: {"skip_day":[3], "add_exercise":{"seg":["ab-wheel"]}}).
--
-- Não substitui `treino_exercicios` (per-user plano) ainda — os dois
-- coexistem por 1 ciclo. Nas telas do PR3, o programa ativo é fonte
-- da verdade pra "template do dia"; treino_exercicios continua
-- funcionando pra registro avulso.
-- ============================================================

create table if not exists public.training_program (
  id                bigserial primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  template_slug     text not null references public.training_template(slug),
  iniciado_em       date not null default (now()::date),
  encerrado_em      date,
  ativo             boolean not null default true,
  ajustes           jsonb not null default '{}'::jsonb,
  criado_em         timestamptz not null default now(),
  atualizado_em     timestamptz not null default now()
);

alter table public.training_program enable row level security;

create policy training_program_select on public.training_program
  for select using (auth.uid() = user_id);
create policy training_program_insert on public.training_program
  for insert with check (auth.uid() = user_id);
create policy training_program_update on public.training_program
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy training_program_delete on public.training_program
  for delete using (auth.uid() = user_id);

create index if not exists idx_training_program_user_ativo
  on public.training_program (user_id, ativo);

-- Só UM programa ativo por usuário. Como fase — mudou de template,
-- desativa o anterior.
create unique index if not exists uniq_training_program_ativo
  on public.training_program (user_id)
  where ativo = true;
