-- ============================================================
-- Quest — migration 0046: achievement_def + user_achievement (PR 11).
-- ------------------------------------------------------------
-- Sistema v2. Preserva `conquistas_unlocked` v1 intacto — coexistem
-- por 1 ciclo. A migração de conquistas → user_achievement é opcional
-- (mapa de slugs pode ser feito depois).
-- ============================================================

create table if not exists public.achievement_def (
  slug            text primary key,
  categoria       text not null,
  nome            text not null,
  descricao       text,
  criterio        jsonb not null default '{}'::jsonb,
  raridade        text not null default 'comum'
    check (raridade in ('comum', 'raro', 'epico', 'lendario')),
  cosmetic_slug   text,
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

alter table public.achievement_def enable row level security;

drop policy if exists achievement_def_select on public.achievement_def;
create policy achievement_def_select on public.achievement_def
  for select using (auth.role() = 'authenticated');

create table if not exists public.user_achievement (
  user_id       uuid not null references auth.users(id) on delete cascade,
  slug          text not null references public.achievement_def(slug),
  unlocked_em   timestamptz not null default now(),
  contexto      jsonb not null default '{}'::jsonb,
  primary key (user_id, slug)
);

alter table public.user_achievement enable row level security;

create policy user_achievement_select on public.user_achievement
  for select using (auth.uid() = user_id);
create policy user_achievement_insert on public.user_achievement
  for insert with check (auth.uid() = user_id);
create policy user_achievement_delete on public.user_achievement
  for delete using (auth.uid() = user_id);

create index if not exists idx_user_achievement_user_unlock
  on public.user_achievement (user_id, unlocked_em desc);

-- ------------------------------------------------------------
-- Seed: ~15 achievements iniciais cobrindo os principais marcos.
-- ------------------------------------------------------------
insert into public.achievement_def
  (slug, categoria, nome, descricao, criterio, raridade) values
  ('primeiro_checkin',     'onboarding', 'Primeiro check-in',
    'Você fez o primeiro daily_checkin.',
    '{"acao": "daily_checkin_count_min", "valor": 1}'::jsonb, 'comum'),
  ('streak_7_checkin',     'consistencia', 'Sete direto',
    '7 check-ins seguidos.', '{"acao": "checkin_streak", "valor": 7}'::jsonb, 'raro'),
  ('streak_30_checkin',    'consistencia', 'Um mês certeiro',
    '30 check-ins em 30 dias.',
    '{"acao": "checkin_streak", "valor": 30}'::jsonb, 'epico'),
  ('primeiro_pr',          'forca', 'Primeiro PR',
    'Primeiro PR registrado (qualquer tipo).',
    '{"acao": "personal_record_count_min", "valor": 1}'::jsonb, 'comum'),
  ('10_prs',               'forca', 'Dez PRs',
    '10 PRs cumulativos.',
    '{"acao": "personal_record_count_min", "valor": 10}'::jsonb, 'raro'),
  ('primeiro_treino',      'onboarding', 'Primeira sessão',
    'Fechou a primeira sessão de treino.',
    '{"acao": "treino_sessao_count_min", "valor": 1}'::jsonb, 'comum'),
  ('20_treinos',           'volume', 'Volume real',
    '20 sessões de treino registradas.',
    '{"acao": "treino_sessao_count_min", "valor": 20}'::jsonb, 'raro'),
  ('primeira_fase_concluida', 'fase', 'Fase encerrada',
    'Encerrou a primeira fase (não abandonada).',
    '{"acao": "phase_completed_count_min", "valor": 1}'::jsonb, 'raro'),
  ('cutting_completo',     'fase', 'Cutting completo',
    'Encerrou um CUT em concluida.',
    '{"acao": "phase_completed_type", "valor": "cut"}'::jsonb, 'epico'),
  ('build_completo',       'fase', 'Build completo',
    'Encerrou um BUILD em concluida.',
    '{"acao": "phase_completed_type", "valor": "build"}'::jsonb, 'epico'),
  ('primeira_transicao',   'fase', 'Nova rota',
    'Aceitou uma transição proposta pelo engine.',
    '{"acao": "transition_aceito_count_min", "valor": 1}'::jsonb, 'raro'),
  ('sono_7_noites',        'recovery', 'Sono na régua',
    '7 noites com 7h+ nas últimas 2 semanas.',
    '{"acao": "sono_7h_last14_min", "valor": 7}'::jsonb, 'raro'),
  ('primeiro_review_sem',  'onboarding', 'Review semanal',
    'Primeiro weekly_checkin com 3 medidas.',
    '{"acao": "weekly_checkin_full_count_min", "valor": 1}'::jsonb, 'comum'),
  ('vtaper_iniciado',      'skill_tree', 'V-Taper iniciado',
    'Definiu ao menos 1 grupo em S-tier.',
    '{"acao": "priority_s_min", "valor": 1}'::jsonb, 'comum'),
  ('primeiro_saber',       'saber', 'Primeira sessão de estudo',
    'Concluiu a primeira sessão do módulo Saber.',
    '{"acao": "saber_sessao_count_min", "valor": 1}'::jsonb, 'comum')
on conflict (slug) do nothing;
