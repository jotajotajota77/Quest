-- ============================================================
-- Quest — migration 0003: espinha do loop diário (v2)
-- ------------------------------------------------------------
-- Tier ladder, modo névoa (+ streak), daily spin, voz contextual, foco do dia,
-- schema forward-compat (macros nullable p/ o coach futuro), tabelas de treino
-- (UI vem na próxima leva), e labels/fotos da aba-espelho.
-- RLS em tudo.
-- ============================================================

-- 1. logs: campos de macro OPCIONAIS/NULLABLE — forward-compat do Fat Loss
--    Coach. NÃO usados agora (piso é 1-toque). Só esmaecem pra dentro depois.
alter table public.logs
  add column if not exists food_id  text,
  add column if not exists kcal     integer,
  add column if not exists proteina numeric,
  add column if not exists carbs    numeric,
  add column if not exists gordura  numeric;

-- 2. atributos: tier ladder concreto (substitui o "elo" vago).
alter table public.atributos
  add column if not exists tier_base    text    not null default 'E',
  add column if not exists tier_divisao integer not null default 4;

-- 3. dias: suporta modo névoa + streak + foco do dia. UMA linha por dia.
create table if not exists public.dias (
  user_id            uuid not null references auth.users(id) on delete cascade,
  data               date not null,
  fog_mode           boolean not null default false,
  streak_preservado  boolean not null default false,
  foco_do_dia        text,
  atualizado_em      timestamptz not null default now(),
  primary key (user_id, data)
);

-- 4. daily_spin: recompensa VR, 1×/dia.
create table if not exists public.daily_spin (
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       date not null,
  recompensa jsonb not null,
  criado_em  timestamptz not null default now(),
  primary key (user_id, data)
);

-- 5. treino rico (catálogo/plano + séries para PR). UI na próxima leva.
create table if not exists public.treino_exercicios (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  nome            text not null,
  grupo_muscular  text,
  split           text,                 -- 'A'|'B'|'C' | 'push'|'pull'|'legs' | ...
  ordem           integer not null default 0,
  custom          boolean not null default false,
  criado_em       timestamptz not null default now()
);
create index if not exists idx_treino_ex_user on public.treino_exercicios (user_id, split, ordem);

create table if not exists public.treino_series (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  exercicio_id uuid references public.treino_exercicios(id) on delete set null,
  nome         text not null,           -- snapshot do nome do exercício
  peso         numeric,
  reps         integer,
  ts           timestamptz not null default now(),
  is_pr        boolean not null default false
);
create index if not exists idx_treino_series_user on public.treino_series (user_id, nome, ts desc);

-- 6. corpo_real: labels anti-aversivos + refs de fotos LOCAIS (não vão p/ cloud).
alter table public.corpo_real
  add column if not exists estado_corporal text,   -- label anti-aversivo
  add column if not exists fotos jsonb;             -- refs locais (não imagens)

-- ============================================================
-- RLS nas novas tabelas (own-row).
-- ============================================================
alter table public.dias              enable row level security;
alter table public.daily_spin        enable row level security;
alter table public.treino_exercicios enable row level security;
alter table public.treino_series     enable row level security;

do $$
declare t text;
begin
  foreach t in array array['dias','daily_spin','treino_exercicios','treino_series']
  loop
    execute format($f$
      create policy %1$s_select on public.%1$I for select using (auth.uid() = user_id);
      create policy %1$s_insert on public.%1$I for insert with check (auth.uid() = user_id);
      create policy %1$s_update on public.%1$I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy %1$s_delete on public.%1$I for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;
