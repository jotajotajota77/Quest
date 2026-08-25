-- ============================================================
-- Quest — migration 0035: exercise metric types (PR 2, §12-13).
-- ------------------------------------------------------------
-- Estende `treino_series` pra suportar exercícios que não são
-- "peso × reps" (prancha por tempo, barra assistida, esteira, HIIT).
--
-- Enum via CHECK constraint (não CREATE TYPE — evita quebrar a migração
-- em re-run com valores diferentes). Backfill: TODAS as linhas antigas
-- ficam `metric_type='weight_reps'` (o default cobre isso — nenhum
-- UPDATE necessário porque `not null default` já preenche).
--
-- Preserva `is_pr`, `peso`, `reps`, `nome`, `ts` — nada é dropado.
-- ============================================================

alter table public.treino_series
  add column if not exists metric_type text not null default 'weight_reps';

alter table public.treino_series
  drop constraint if exists treino_series_metric_type_check;

alter table public.treino_series
  add constraint treino_series_metric_type_check
    check (metric_type in (
      'weight_reps',
      'bw_reps',
      'bw_assisted',
      'bw_weighted',
      'time',
      'distance',
      'duration',
      'interval',
      'custom'
    ));

alter table public.treino_series
  add column if not exists seconds integer,
  add column if not exists assist_kg numeric(5,2),
  add column if not exists bodyweight_used_kg numeric(5,2),
  add column if not exists distance_m integer,
  add column if not exists intensity smallint,
  add column if not exists rir smallint,
  add column if not exists rpe smallint;

alter table public.treino_series
  drop constraint if exists treino_series_intensity_check;
alter table public.treino_series
  add constraint treino_series_intensity_check
    check (intensity is null or (intensity between 0 and 10));

alter table public.treino_series
  drop constraint if exists treino_series_rir_check;
alter table public.treino_series
  add constraint treino_series_rir_check
    check (rir is null or (rir between 0 and 6));

alter table public.treino_series
  drop constraint if exists treino_series_rpe_check;
alter table public.treino_series
  add constraint treino_series_rpe_check
    check (rpe is null or (rpe between 1 and 10));

-- Índice novo pra queries do PR engine (PR 3) por exercício + tipo.
create index if not exists idx_treino_series_user_nome_type
  on public.treino_series (user_id, nome, metric_type, ts desc);
