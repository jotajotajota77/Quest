-- ============================================================
-- Quest — migration 0036: exercise_definition (PR 2, §12-13).
-- ------------------------------------------------------------
-- Catálogo compartilhado de exercícios. Diferente de `treino_exercicios`
-- (que é per-user, criado no plano), esta tabela é global.
--
-- Serve pra:
--   - Descobrir metric_type default a partir do nome (prancha → time).
--   - Distribuição de músculo primário/secundário (PR8 usa isso).
--   - Base pra biblioteca visual (PR3).
--
-- RLS: select público (any authenticated user). Sem write policy —
-- catálogo é seeded via migration.
-- ============================================================

create table if not exists public.exercise_definition (
  slug              text primary key,
  nome_pt           text not null,
  nome_en           text,
  metric_type_default text not null default 'weight_reps'
    check (metric_type_default in (
      'weight_reps',
      'bw_reps',
      'bw_assisted',
      'bw_weighted',
      'time',
      'distance',
      'duration',
      'interval',
      'custom'
    )),
  muscle_primary    text[] not null default '{}',
  muscle_secondary  jsonb not null default '[]'::jsonb,
  variacao_de       text references public.exercise_definition(slug) on delete set null,
  bilateral         boolean not null default true,
  equipment         text,
  criado_em         timestamptz not null default now()
);

alter table public.exercise_definition enable row level security;

drop policy if exists exercise_definition_select on public.exercise_definition;
create policy exercise_definition_select on public.exercise_definition
  for select using (auth.role() = 'authenticated');

create index if not exists idx_exercise_definition_nome_pt
  on public.exercise_definition (lower(nome_pt));

-- ------------------------------------------------------------
-- Seed inicial. Cobre os exercícios que aparecem em
-- src/lib/treino.ts (ALTERNATIVAS + PRESETS) + os cardio + core.
-- Idempotente via ON CONFLICT.
-- ------------------------------------------------------------
insert into public.exercise_definition (slug, nome_pt, metric_type_default, muscle_primary, equipment) values
  -- Peito
  ('supino-reto',            'Supino reto',            'weight_reps', array['chest'],           'barbell'),
  ('supino-inclinado',       'Supino inclinado',       'weight_reps', array['upper_chest'],     'barbell'),
  ('supino-maquina',         'Supino máquina',         'weight_reps', array['chest'],           'machine'),
  ('crucifixo',              'Crucifixo',              'weight_reps', array['chest'],           'dumbbell'),
  ('crossover',              'Crossover',              'weight_reps', array['chest'],           'cable'),
  ('flexao',                 'Flexão',                 'bw_reps',     array['chest'],           'bodyweight'),
  -- Costas
  ('barra-fixa',             'Barra fixa',             'bw_reps',     array['back'],            'bodyweight'),
  ('puxada',                 'Puxada',                 'weight_reps', array['back'],            'cable'),
  ('pulldown',               'Pulldown',               'weight_reps', array['back'],            'cable'),
  ('remada-curvada',         'Remada curvada',         'weight_reps', array['back'],            'barbell'),
  ('remada-baixa',           'Remada baixa',           'weight_reps', array['back'],            'cable'),
  ('remada-unilateral',      'Remada unilateral',      'weight_reps', array['back'],            'dumbbell'),
  ('levantamento-terra',     'Levantamento terra',     'weight_reps', array['back','posterior'],'barbell'),
  ('encolhimento',           'Encolhimento (trapézio)','weight_reps', array['back'],            'dumbbell'),
  -- Ombro
  ('desenvolvimento',        'Desenvolvimento',        'weight_reps', array['shoulders'],       'barbell'),
  ('desenvolvimento-maquina','Desenvolvimento máquina','weight_reps', array['shoulders'],       'machine'),
  ('arnold-press',           'Arnold press',           'weight_reps', array['shoulders'],       'dumbbell'),
  ('elevacao-lateral',       'Elevação lateral',       'weight_reps', array['shoulders'],       'dumbbell'),
  ('elevacao-frontal',       'Elevação frontal',       'weight_reps', array['shoulders'],       'dumbbell'),
  ('face-pull',              'Face pull',              'weight_reps', array['shoulders','back'],'cable'),
  -- Bíceps
  ('rosca-direta',           'Rosca direta',           'weight_reps', array['biceps'],          'barbell'),
  ('rosca-martelo',          'Rosca martelo',          'weight_reps', array['biceps'],          'dumbbell'),
  ('rosca-scott',            'Rosca scott',            'weight_reps', array['biceps'],          'machine'),
  ('rosca-alternada',        'Rosca alternada',        'weight_reps', array['biceps'],          'dumbbell'),
  ('rosca-concentrada',      'Rosca concentrada',      'weight_reps', array['biceps'],          'dumbbell'),
  -- Tríceps
  ('triceps-corda',          'Tríceps corda',          'weight_reps', array['triceps'],         'cable'),
  ('triceps-testa',          'Tríceps testa',          'weight_reps', array['triceps'],         'barbell'),
  ('triceps-frances',        'Tríceps francês',        'weight_reps', array['triceps'],         'dumbbell'),
  ('triceps-coice',          'Tríceps coice',          'weight_reps', array['triceps'],         'dumbbell'),
  ('mergulho',               'Mergulho',               'bw_reps',     array['triceps','chest'], 'bodyweight'),
  -- Pernas
  ('agachamento',            'Agachamento',            'weight_reps', array['legs'],            'barbell'),
  ('leg-press',              'Leg press',              'weight_reps', array['legs'],            'machine'),
  ('hack-squat',             'Hack squat',             'weight_reps', array['legs'],            'machine'),
  ('afundo',                 'Afundo',                 'weight_reps', array['legs'],            'dumbbell'),
  ('cadeira-extensora',      'Cadeira extensora',      'weight_reps', array['legs'],            'machine'),
  -- Posterior
  ('stiff',                  'Stiff',                  'weight_reps', array['posterior'],       'barbell'),
  ('mesa-flexora',           'Mesa flexora',           'weight_reps', array['posterior'],       'machine'),
  ('cadeira-flexora',        'Cadeira flexora',        'weight_reps', array['posterior'],       'machine'),
  ('terra-romeno',           'Terra romeno',           'weight_reps', array['posterior','back'],'barbell'),
  -- Panturrilha
  ('panturrilha-em-pe',      'Panturrilha em pé',      'weight_reps', array['calves'],          'machine'),
  ('panturrilha-sentado',    'Panturrilha sentado',    'weight_reps', array['calves'],          'machine'),
  ('panturrilha-no-leg',     'Panturrilha no leg',     'weight_reps', array['calves'],          'machine'),
  -- Core (mistos: alguns por reps, outros por tempo)
  ('crunch-polia',           'Crunch na polia',        'weight_reps', array['core'],            'cable'),
  ('abdominal',              'Abdominal',              'bw_reps',     array['core'],            'bodyweight'),
  ('abdominal-declinado',    'Abdominal declinado',    'bw_reps',     array['core'],            'bodyweight'),
  ('elevacao-de-pernas',     'Elevação de pernas',     'bw_reps',     array['core'],            'bodyweight'),
  ('prancha',                'Prancha',                'time',        array['core'],            'bodyweight'),
  ('prancha-lateral',        'Prancha lateral',        'time',        array['core'],            'bodyweight'),
  ('ab-wheel',               'Ab wheel',               'bw_reps',     array['core'],            'equipment'),
  ('dead-bug',               'Dead bug',               'bw_reps',     array['core'],            'bodyweight'),
  ('rotacao-russa',          'Rotação russa',          'weight_reps', array['core'],            'dumbbell'),
  ('cable-woodchopper',      'Cable woodchopper',      'weight_reps', array['core'],            'cable'),
  -- Cardio
  ('esteira',                'Esteira',                'duration',    array['cardio'],          'machine'),
  ('bike',                   'Bike',                   'duration',    array['cardio'],          'machine'),
  ('corda',                  'Corda',                  'duration',    array['cardio'],          'equipment'),
  ('eliptico',               'Elíptico',               'duration',    array['cardio'],          'machine'),
  ('remo',                   'Remo',                   'distance',    array['cardio','back'],   'machine'),
  ('hiit',                   'HIIT',                   'interval',    array['cardio'],          'bodyweight')
on conflict (slug) do nothing;
