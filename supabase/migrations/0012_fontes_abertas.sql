-- ============================================================
-- Quest — migration 0012: fontes abertas + ganho ponderado (v8)
-- ------------------------------------------------------------
-- Stamina passa a aceitar cardio/vôlei/resistência (além de dieta/água), todas
-- registradas em 1-toque (camada universal; SEM motor de instalação — só Nutri
-- refeição/água toca música). Ganho ponderado por esforço: `peso_esforco`
-- (embutido; existentes = 1.0). `atividade_id` = exercício/atividade registrada.
-- Sem teto diário (coluna/flag de teto prevista mas não criada — gancho no código).
-- ============================================================

alter table public.logs drop constraint if exists logs_comportamento_check;
alter table public.logs add constraint logs_comportamento_check
  check (comportamento in (
    'treino','nutri_refeicao','nutri_agua','leitura','danca',
    'cardio','volei','resistencia'
  ));

alter table public.logs
  add column if not exists atividade_id text,
  add column if not exists peso_esforco numeric not null default 1;
