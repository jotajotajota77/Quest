-- ============================================================
-- Quest — migration 0024: RPG v12
-- ------------------------------------------------------------
-- Camada RPG completa sobre o loop existente:
--
-- 1) atributos ganha 4 eixos novos (potencia/resistencia/mobilidade/tecnica).
--    forca e stamina permanecem; stamina vira ancoragem histórica de
--    resistência. shards entra pra economia de duplicatas.
--
-- 2) mastery_musculo — XP por GRUPO MUSCULAR (chest/back/etc), acumulado
--    ao inserir séries. Modelado igual progresso_dominio pra consistência.
--
-- 3) season_ativa — season/era corrente do jogador (Y2K, GirlCrush, etc).
--    Uma linha por usuário; historico em season_historico.
--
-- 4) colecao_item — inventário genérico (photocard, outfit, badge, título).
--    item_id é slug do catálogo (lib/photocards.ts, lib/seasons.ts).
--
-- 5) boss_estado — persiste HP do boss semanal + dano que carrega da
--    semana anterior (opção "b" do design: boss não derrotado carrega
--    dano acumulado pra próxima semana).
--
-- 6) treino_sessoes.xp_creditado — flag idempotente pra Training Raid saber
--    se já pagou o XP de conclusão do split.
--
-- 7) personagens.jogavel — todos os 6 (5 mestres + Sanha) viram jogáveis;
--    "mestre" passa a ser label conceitual, não classe de entidade.
-- ============================================================

-- ------------------------------------------------------------
-- 1. atributos: 4 eixos novos + shards
-- ------------------------------------------------------------
alter table public.atributos
  add column if not exists potencia    integer not null default 0,
  add column if not exists resistencia integer not null default 0,
  add column if not exists mobilidade  integer not null default 0,
  add column if not exists tecnica     integer not null default 0,
  add column if not exists shards      integer not null default 0;

-- Backfill: resistencia herda o stamina histórico (mesma semântica de
-- capacidade sustentada). potencia/mobilidade/tecnica começam em 0.
update public.atributos
   set resistencia = stamina
 where resistencia = 0;

-- ------------------------------------------------------------
-- 2. mastery_musculo
-- ------------------------------------------------------------
create table if not exists public.mastery_musculo (
  user_id       uuid not null references auth.users(id) on delete cascade,
  grupo         text not null,   -- 'chest'|'back'|'shoulders'|'biceps'|'triceps'|'lower'|'core'|'taekwondo'|'danca'
  xp            integer not null default 0 check (xp >= 0),
  nivel         integer not null default 1 check (nivel >= 1),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, grupo)
);

alter table public.mastery_musculo enable row level security;

create policy mastery_musculo_select on public.mastery_musculo
  for select using (auth.uid() = user_id);
create policy mastery_musculo_insert on public.mastery_musculo
  for insert with check (auth.uid() = user_id);
create policy mastery_musculo_update on public.mastery_musculo
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy mastery_musculo_delete on public.mastery_musculo
  for delete using (auth.uid() = user_id);

create index if not exists idx_mastery_musculo_user
  on public.mastery_musculo (user_id);

-- ------------------------------------------------------------
-- 3. season_ativa + season_historico
-- ------------------------------------------------------------
create table if not exists public.season_ativa (
  user_id           uuid primary key references auth.users(id) on delete cascade,
  slug              text not null,   -- 'y2k'|'girlcrush'|'cyber'|... (catálogo em lib/seasons.ts)
  iniciada_em       date not null default (now()::date),
  dias_duracao      integer not null default 30 check (dias_duracao > 0),
  conceito          text,            -- 'y2k'|'girlcrush'|... (mesmo que slug hoje; separado pra permitir season composta no futuro)
  soundtrack_theme  text,            -- 'aespa+everglow+nmixx' etc. (só descritivo)
  atualizado_em     timestamptz not null default now()
);

alter table public.season_ativa enable row level security;

create policy season_ativa_select on public.season_ativa
  for select using (auth.uid() = user_id);
create policy season_ativa_insert on public.season_ativa
  for insert with check (auth.uid() = user_id);
create policy season_ativa_update on public.season_ativa
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy season_ativa_delete on public.season_ativa
  for delete using (auth.uid() = user_id);

create table if not exists public.season_historico (
  user_id       uuid not null references auth.users(id) on delete cascade,
  slug          text not null,
  iniciada_em   date not null,
  terminada_em  date not null default (now()::date),
  completa      boolean not null default false,   -- todas as photocards da season foram desbloqueadas
  primary key (user_id, slug, iniciada_em)
);

alter table public.season_historico enable row level security;

create policy season_historico_select on public.season_historico
  for select using (auth.uid() = user_id);
create policy season_historico_insert on public.season_historico
  for insert with check (auth.uid() = user_id);
create policy season_historico_delete on public.season_historico
  for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 4. colecao_item (inventário genérico)
-- ------------------------------------------------------------
create table if not exists public.colecao_item (
  user_id     uuid not null references auth.users(id) on delete cascade,
  item_id     text not null,     -- ex.: 'photocard:ryuki:y2k:001'
  tipo        text not null check (tipo in ('photocard','outfit','badge','titulo','era')),
  meta        jsonb,             -- metadata do item (nome exibido, raridade, personagem, season)
  quantidade  integer not null default 1 check (quantidade >= 1),
  ganho_em    timestamptz not null default now(),
  favorito    boolean not null default false,
  primary key (user_id, item_id)
);

alter table public.colecao_item enable row level security;

create policy colecao_item_select on public.colecao_item
  for select using (auth.uid() = user_id);
create policy colecao_item_insert on public.colecao_item
  for insert with check (auth.uid() = user_id);
create policy colecao_item_update on public.colecao_item
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy colecao_item_delete on public.colecao_item
  for delete using (auth.uid() = user_id);

create index if not exists idx_colecao_item_user_tipo
  on public.colecao_item (user_id, tipo);

-- Só uma photocard favorita por vez.
create unique index if not exists uniq_colecao_favorita_photocard
  on public.colecao_item (user_id)
  where favorito = true and tipo = 'photocard';

-- ------------------------------------------------------------
-- 5. boss_estado
-- ------------------------------------------------------------
create table if not exists public.boss_estado (
  user_id                   uuid not null references auth.users(id) on delete cascade,
  semana_iso                text not null,     -- ex.: '2026-W31'
  mestre_slug               text not null,     -- bosss da semana (determinístico)
  hp_total                  integer not null,
  dano_creditado            integer not null default 0,   -- dano já contabilizado (evita dupla contagem)
  dano_carregado_anterior   integer not null default 0,   -- dano vindo da semana passada não derrotada
  derrotado_em              timestamptz,
  recompensa_creditada      boolean not null default false,
  atualizado_em             timestamptz not null default now(),
  primary key (user_id, semana_iso)
);

alter table public.boss_estado enable row level security;

create policy boss_estado_select on public.boss_estado
  for select using (auth.uid() = user_id);
create policy boss_estado_insert on public.boss_estado
  for insert with check (auth.uid() = user_id);
create policy boss_estado_update on public.boss_estado
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists idx_boss_estado_user_semana
  on public.boss_estado (user_id, semana_iso desc);

-- ------------------------------------------------------------
-- 6. treino_sessoes: xp_creditado (idempotência do Training Raid)
-- ------------------------------------------------------------
alter table public.treino_sessoes
  add column if not exists xp_creditado boolean not null default false;

-- ------------------------------------------------------------
-- 7. personagens.jogavel — todos jogáveis
-- ------------------------------------------------------------
alter table public.personagens
  add column if not exists jogavel boolean not null default true;

-- Reafirma: todos os 6 são jogáveis. avatar_jogador (Sanha) continua sendo
-- só a marca de "canonical player self"; jogavel é "pode ser embodied hoje".
update public.personagens
   set jogavel = true
 where slug in (
   'ryuki-han','ji-seok-moon','hujin-kim','sanhee-park','chan-ho-lee','sanha'
 );
