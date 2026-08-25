-- ============================================================
-- Quest — migration 0043: quest_definition + quest_instance (PR 7).
-- ------------------------------------------------------------
-- Sistema v2 de quests com tiers (daily/weekly/arc/season) e filtro
-- contextual (readiness ruim → recovery quests, welcome_back quando
-- volta depois de 2+ dias sem log).
--
-- Preserva `quests` (v1) intacto por 1 ciclo — as duas coexistem.
-- Migração explícita de quests → quest_instance NÃO acontece agora
-- (tabelas modelam coisas diferentes: v1 é per-day daily, v2 é per-user
-- + tier + contexto). Se necessário no PR11+, faz-se via view.
--
-- quest_definition: catálogo global (slug pk). RLS select público.
-- quest_instance:   per-user, ligado a phase, estado.
-- ============================================================

create table if not exists public.quest_definition (
  slug              text primary key,
  nome              text not null,
  descricao         text,
  tier              text not null check (tier in ('daily', 'weekly', 'arc', 'season')),
  criterio          jsonb not null default '{}'::jsonb,
  reforcador        jsonb not null default '{}'::jsonb,
  contexto_gatilho  jsonb not null default '{}'::jsonb,
  ativo             boolean not null default true,
  criado_em         timestamptz not null default now()
);

alter table public.quest_definition enable row level security;

drop policy if exists quest_definition_select on public.quest_definition;
create policy quest_definition_select on public.quest_definition
  for select using (auth.role() = 'authenticated');

create table if not exists public.quest_instance (
  id                bigserial primary key,
  user_id           uuid not null references auth.users(id) on delete cascade,
  slug              text not null references public.quest_definition(slug),
  tier              text not null check (tier in ('daily', 'weekly', 'arc', 'season')),
  gerada_em         timestamptz not null default now(),
  vence_em          timestamptz,
  estado            text not null default 'ativa'
    check (estado in ('ativa', 'completa', 'expirada', 'abandonada')),
  progresso         jsonb not null default '{}'::jsonb,
  ligada_phase_id   bigint references public.physique_phase(id) on delete set null,
  completa_em       timestamptz,
  criado_em         timestamptz not null default now()
);

alter table public.quest_instance enable row level security;

create policy quest_instance_select on public.quest_instance
  for select using (auth.uid() = user_id);
create policy quest_instance_insert on public.quest_instance
  for insert with check (auth.uid() = user_id);
create policy quest_instance_update on public.quest_instance
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy quest_instance_delete on public.quest_instance
  for delete using (auth.uid() = user_id);

create index if not exists idx_quest_instance_user_estado
  on public.quest_instance (user_id, estado, tier);

create index if not exists idx_quest_instance_user_gerada
  on public.quest_instance (user_id, gerada_em desc);

-- Idempotência de geração: não repete a mesma quest ativa por usuário.
create unique index if not exists uniq_quest_instance_ativa
  on public.quest_instance (user_id, slug)
  where estado = 'ativa';

-- ------------------------------------------------------------
-- Seed: catálogo inicial de quests v2. Alinhado ao spec (§26, §32).
-- Reforçador jsonb = { xp?, shards?, photocard_slug? }.
-- Contexto gatilho jsonb = { readiness_max? , dias_sem_log_min?,
--                            phase_type?, fase_dias_min? }.
-- ------------------------------------------------------------
insert into public.quest_definition
  (slug, nome, descricao, tier, criterio, reforcador, contexto_gatilho) values
  ('daily_checkin',
   'Check-in do dia',
   'Registre o check-in diário. <60s.',
   'daily',
   '{"acao": "daily_checkin"}'::jsonb,
   '{"xp": 15}'::jsonb,
   '{}'::jsonb),
  ('daily_protein_zone',
   'Proteína na zona',
   'Atingir a zona de proteína hoje.',
   'daily',
   '{"acao": "protein_in_zone"}'::jsonb,
   '{"xp": 20}'::jsonb,
   '{}'::jsonb),
  ('daily_sleep_7h',
   'Sono 7h+',
   '7 horas ou mais de sono última noite.',
   'daily',
   '{"acao": "sleep_hours_min", "valor": 7}'::jsonb,
   '{"xp": 15}'::jsonb,
   '{}'::jsonb),
  ('daily_train_planned',
   'Treino previsto',
   'Fechar a sessão de treino planejada hoje.',
   'daily',
   '{"acao": "training_session_planned"}'::jsonb,
   '{"xp": 25}'::jsonb,
   '{}'::jsonb),
  ('weekly_train_3x',
   'Treino 3× na semana',
   'Registrar 3 sessões de treino esta semana.',
   'weekly',
   '{"acao": "training_sessions_min", "valor": 3, "janela_dias": 7}'::jsonb,
   '{"xp": 80, "shards": 2}'::jsonb,
   '{}'::jsonb),
  ('weekly_review',
   'Review semanal',
   'Preencher o check-in semanal (cintura + agregados).',
   'weekly',
   '{"acao": "weekly_checkin"}'::jsonb,
   '{"xp": 40}'::jsonb,
   '{}'::jsonb),
  ('recovery_easy_day',
   'Dia leve',
   'Hoje o corpo pediu pausa. Sem treino intenso — caminhada ou mobilidade contam.',
   'daily',
   '{"acao": "no_hard_training_today"}'::jsonb,
   '{"xp": 10}'::jsonb,
   '{"readiness_max": 49}'::jsonb),
  ('recovery_sleep_priority',
   'Prioridade: dormir',
   '3+ noites <5h na semana. Meta = 8h hoje. Sem culpa.',
   'daily',
   '{"acao": "sleep_hours_min", "valor": 8}'::jsonb,
   '{"xp": 20}'::jsonb,
   '{"padrao_sono_ruim": true}'::jsonb),
  ('welcome_back',
   'Welcome back',
   'Você voltou. Registrar o check-in de hoje já vale.',
   'daily',
   '{"acao": "daily_checkin"}'::jsonb,
   '{"xp": 30}'::jsonb,
   '{"dias_sem_log_min": 2}'::jsonb),
  ('arc_first_phase_review',
   'Primeira revisão de fase',
   'Chegar em phase_review — sinal de que o CUT deu o que tinha que dar.',
   'arc',
   '{"acao": "phase_engine_decision", "valor": "phase_review"}'::jsonb,
   '{"xp": 150, "shards": 5}'::jsonb,
   '{"fase_dias_min": 30}'::jsonb),
  ('season_cutting_completo',
   'Cutting completo',
   'Encerrar a fase CUT em concluida (não abandonada).',
   'season',
   '{"acao": "phase_ended", "valor": "cut"}'::jsonb,
   '{"xp": 500, "shards": 12}'::jsonb,
   '{"phase_type": "cut"}'::jsonb)
on conflict (slug) do nothing;
