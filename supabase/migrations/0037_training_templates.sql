-- ============================================================
-- Quest — migration 0037: training_template (PR 3, §14, §54-57).
-- ------------------------------------------------------------
-- Catálogo compartilhado de templates de programa. Diferente de
-- `treino_exercicios` (per-user, montado no /plano), esta tabela é
-- global — o usuário escolhe um template e ele vira `training_program`
-- na migração 0038.
--
-- O programa atual de 7 dias (SEG-DOM do Apêndice A) vira o template
-- `legacy_7day_a_g` — preservado pra quem já usa. Novos templates:
-- v_taper_5day, v_taper_6day, tkd_compat, travel, deload.
--
-- RLS: select público pra authenticated. Sem write policy — catálogo.
-- ============================================================

create table if not exists public.training_template (
  slug              text primary key,
  nome              text not null,
  descricao         text,
  dias_por_semana   smallint not null,
  focos             jsonb not null default '[]'::jsonb,
  publico           boolean not null default true,
  criado_em         timestamptz not null default now()
);

alter table public.training_template enable row level security;

drop policy if exists training_template_select on public.training_template;
create policy training_template_select on public.training_template
  for select using (auth.role() = 'authenticated');

create table if not exists public.training_day (
  id                bigserial primary key,
  template_slug     text not null references public.training_template(slug) on delete cascade,
  ordem             smallint not null,
  nome              text not null,
  foco              text,
  unique (template_slug, ordem)
);

alter table public.training_day enable row level security;

drop policy if exists training_day_select on public.training_day;
create policy training_day_select on public.training_day
  for select using (auth.role() = 'authenticated');

create table if not exists public.training_day_exercise (
  id                bigserial primary key,
  day_id            bigint not null references public.training_day(id) on delete cascade,
  exercise_slug     text not null references public.exercise_definition(slug),
  ordem             smallint not null,
  series            smallint not null default 3,
  reps_min          smallint,
  reps_max          smallint,
  rir_alvo          smallint,
  descanso_s        smallint,
  nota              text,
  unique (day_id, ordem)
);

alter table public.training_day_exercise enable row level security;

drop policy if exists training_day_exercise_select on public.training_day_exercise;
create policy training_day_exercise_select on public.training_day_exercise
  for select using (auth.role() = 'authenticated');

create index if not exists idx_training_day_template
  on public.training_day (template_slug, ordem);

create index if not exists idx_training_day_exercise_day
  on public.training_day_exercise (day_id, ordem);

-- ------------------------------------------------------------
-- Seed dos templates iniciais. Só metadata + dias — a lista de
-- exercícios detalhada vem no PR3 seguinte via UI de programa.
--
-- Templates cobertos:
--   legacy_7day_a_g  → o split atual do Apêndice A (7 dias).
--   v_taper_5day     → 5 dias com foco em lat/upper chest (§46).
--   v_taper_6day     → 6 dias, um dia extra pra ombros/upper chest.
--   tkd_compat       → 4 dias curtos, coreografia + core intacto (§14).
--   travel           → 3 dias BW só, protocolo de viagem (§46).
--   deload           → 5 dias com volume 60% (§17).
-- ------------------------------------------------------------
insert into public.training_template (slug, nome, descricao, dias_por_semana, focos) values
  ('legacy_7day_a_g',
   'Split atual (7 dias A-G)',
   'O programa do Apêndice A que você já usa. Preservado pra continuidade.',
   7,
   '["chest","back","shoulders","legs","arms"]'::jsonb),
  ('v_taper_5day',
   'V-Taper 5 dias',
   'Foco S-tier: dorsal + deltoide lateral + peito superior. Recomendado pro cutting em curso.',
   5,
   '["back","shoulders_side","upper_chest"]'::jsonb),
  ('v_taper_6day',
   'V-Taper 6 dias',
   'Ombros lateral 2×/sem, peito superior 2×/sem. Volume alto — só se sono/estresse ok.',
   6,
   '["back","shoulders_side","upper_chest"]'::jsonb),
  ('tkd_compat',
   'TKD Compatible',
   '4 dias curtos, compatível com treino de TKD e ensaio de dança.',
   4,
   '["shoulders","core","back"]'::jsonb),
  ('travel',
   'Travel Mode',
   '3 dias BW apenas — hotel, aeroporto, casa. Proteína piso + logging simples.',
   3,
   '["core","chest","legs"]'::jsonb),
  ('deload',
   'Deload',
   'Semana de recuperação: 60% do volume, mesmo padrão de exercícios. Uma vez por ciclo.',
   5,
   '["recovery"]'::jsonb)
on conflict (slug) do nothing;
