-- ============================================================
-- Quest V1 — esquema inicial (motor da dieta + casca de RPG)
-- ------------------------------------------------------------
-- Princípios travados no schema:
--  * Progressão (elo/xp) é ÚNICA e pertence ao USUÁRIO (tabela `atributos`),
--    nunca ao personagem. Personagens são lentes, não donos de barra.
--  * Métricas de comportamento são PASSIVAS: a latência é derivada do
--    timestamp do log (ver view `vw_logs_dieta_latencia`), não há coluna de
--    input manual de latência.
--  * RLS ligado em tudo (single-user, mas já correto).
-- ============================================================

create extension if not exists "pgcrypto";

-- ─── atributos ──────────────────────────────────────────────
-- A progressão única do usuário. UMA linha por usuário.
create table if not exists public.atributos (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  stamina            integer not null default 0,        -- placar comportamental (não mede saúde)
  elo                integer not null default 1,        -- derivado de xp
  xp                 integer not null default 0,
  estado_personagem  jsonb   not null default '{}'::jsonb,
  atualizado_em      timestamptz not null default now()
);

-- ─── personagens ────────────────────────────────────────────
-- Roster. V1: 1 placeholder de Stamina. Estrutura aceita roster maior sem refac.
-- `bonus` = { "tipo": "aditivo", "magnitude": <int> } — SEMPRE aditivo, nunca redirect.
create table if not exists public.personagens (
  id                uuid primary key default gen_random_uuid(),
  nome              text not null,
  atributo_foco     text not null,                      -- 'stamina' (V2: 'forca', 'foco', ...)
  comportamento_alvo text not null,                     -- 'dieta'  (V2: 'treino', 'leitura', ...)
  bonus             jsonb not null default '{"tipo":"aditivo","magnitude":0}'::jsonb,
  asset_rosto       text,                               -- retrato (hub: mostra só o rosto)
  asset_corpo       text,                               -- corpo inteiro (revelado ao clicar)
  lore              text,
  ativo             boolean not null default true,      -- V2: liga personagens dos outros comportamentos
  ordem             integer not null default 0,         -- ordenação no grid do hub
  criado_em         timestamptz not null default now()
);

-- ─── selecao_diaria ─────────────────────────────────────────
-- Protagonista do dia. Histórico por data. Seleção 100% livre (sem recomendação).
create table if not exists public.selecao_diaria (
  user_id        uuid not null references auth.users(id) on delete cascade,
  data           date not null,
  personagem_id  uuid not null references public.personagens(id),
  criado_em      timestamptz not null default now(),
  primary key (user_id, data)
);

-- ─── logs_dieta ─────────────────────────────────────────────
-- O ato de registrar (1 toque). Timestamp capturado automaticamente.
-- Latência é DERIVADA (ver view), não é coluna de input.
create table if not exists public.logs_dieta (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ts          timestamptz not null default now(),
  tipo        text not null check (tipo in ('refeicao', 'hidratacao'))
);
create index if not exists idx_logs_dieta_user_ts on public.logs_dieta (user_id, ts desc);

-- ─── schedule_state ─────────────────────────────────────────
-- Estado do esquema de reforço POR comportamento. Base do fading reversível.
-- `esquema_atual`: 'CRF' | 'FR2' | 'FR3' | 'FR5' | 'FR8' (ladder em lib/engine/fading.ts)
create table if not exists public.schedule_state (
  user_id          uuid not null references auth.users(id) on delete cascade,
  comportamento    text not null,                       -- 'dieta'
  esquema_atual    text not null default 'CRF',
  nivel_afinamento integer not null default 0,          -- índice na ladder (0 = CRF, mais denso)
  ultima_transicao timestamptz not null default now(),
  primary key (user_id, comportamento)
);

-- ─── historico_reforco ──────────────────────────────────────
-- Base do "nova-no-sistema": uma faixa só é nova se NÃO está aqui.
-- tipo_reforco: 'faixa_cheia' (Spotify tocou) | 'fallback_local' (hit-confirm + fila).
create table if not exists public.historico_reforco (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  log_id        uuid references public.logs_dieta(id) on delete set null,
  faixa_id      text,                                   -- Spotify track id (null se só hit-confirm)
  tipo_reforco  text not null check (tipo_reforco in ('faixa_cheia', 'fallback_local')),
  ts            timestamptz not null default now()
);
create index if not exists idx_hist_reforco_user_faixa on public.historico_reforco (user_id, faixa_id);
create index if not exists idx_hist_reforco_user_ts on public.historico_reforco (user_id, ts desc);

-- ─── corpo_real (aba-espelho) ───────────────────────────────
-- Passiva e enterrada. Só recebe input deliberado, raro, iniciado pelo usuário.
create table if not exists public.corpo_real (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  ts          timestamptz not null default now(),
  peso        numeric,
  medidas     jsonb,                                    -- { "cintura": 80, ... }
  composicao  jsonb,                                    -- { "gordura_pct": 18, ... }
  descricao   text
);
create index if not exists idx_corpo_real_user_ts on public.corpo_real (user_id, ts desc);

-- ─── spotify_tokens ─────────────────────────────────────────
-- OAuth do Spotify (refresh automático). Server-side apenas.
create table if not exists public.spotify_tokens (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  access_token   text,
  refresh_token  text,
  expires_at     timestamptz,
  scope          text,
  atualizado_em  timestamptz not null default now()
);

-- ============================================================
-- VIEW: latência derivada (captura passiva)
-- ------------------------------------------------------------
-- "Zero" da refeição é configurável. V1: zero = início do dia local do log.
-- Latência = segundos entre o zero e o registro. O fading lê desta view.
-- ============================================================
create or replace view public.vw_logs_dieta_latencia as
select
  l.id,
  l.user_id,
  l.ts,
  l.tipo,
  -- zero configurável: aqui, meia-noite do dia do registro (UTC).
  -- lib/engine/latency.ts pode reconfigurar o zero (janela de refeição planejada).
  extract(epoch from (l.ts - date_trunc('day', l.ts))) as latencia_seg
from public.logs_dieta l;

-- ============================================================
-- RLS — cada usuário só enxerga e mexe nas próprias linhas.
-- `personagens` é roster compartilhado: leitura para autenticados.
-- ============================================================
alter table public.atributos          enable row level security;
alter table public.selecao_diaria     enable row level security;
alter table public.logs_dieta         enable row level security;
alter table public.schedule_state     enable row level security;
alter table public.historico_reforco  enable row level security;
alter table public.corpo_real         enable row level security;
alter table public.spotify_tokens     enable row level security;
alter table public.personagens        enable row level security;

-- Helper macro via policies por tabela (own-row).
do $$
declare
  t text;
begin
  foreach t in array array[
    'atributos','selecao_diaria','logs_dieta','schedule_state',
    'historico_reforco','corpo_real','spotify_tokens'
  ]
  loop
    execute format($f$
      create policy %1$s_select on public.%1$I
        for select using (auth.uid() = user_id);
      create policy %1$s_insert on public.%1$I
        for insert with check (auth.uid() = user_id);
      create policy %1$s_update on public.%1$I
        for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
      create policy %1$s_delete on public.%1$I
        for delete using (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- personagens: roster compartilhado, somente leitura para autenticados.
create policy personagens_select on public.personagens
  for select using (auth.role() = 'authenticated');

-- ============================================================
-- SEED — 1 personagem placeholder de Stamina (V1).
-- O usuário troca arte/lore/roster depois. Bônus aditivo magnitude 5.
-- ============================================================
insert into public.personagens (nome, atributo_foco, comportamento_alvo, bonus, lore, ordem)
values (
  'Stamina (placeholder)',
  'stamina',
  'dieta',
  '{"tipo":"aditivo","magnitude":5}'::jsonb,
  'Personagem placeholder de foco em Stamina. Troque nome, arte e lore depois.',
  0
)
on conflict do nothing;
