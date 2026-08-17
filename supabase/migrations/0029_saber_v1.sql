-- ============================================================
-- Quest — migration 0029: módulo SABER (Fase 1) — schema.
-- ------------------------------------------------------------
-- Estudo vira comportamento; a fonte da verdade é um GRAFO de conceitos
-- (não o texto das apostilas). Cada apostila é uma projeção linear do
-- grafo, o que permite oferecer 3 ordens de estudo diferentes (didática,
-- cronológica, por projeto do artigo) sem manter três materiais.
--
-- Fase 1 = APENAS schema + seed + tela de sessão. XP/faixa/boss/painel
-- entram na Fase 2 (não implementados aqui).
-- ============================================================

-- ------------------------------------------------------------
-- 1. saber_conceito — átomo do grafo. Um por termo.
-- ------------------------------------------------------------
create table if not exists public.saber_conceito (
  slug          text primary key,            -- 'custo-de-resposta'
  titulo        text not null,
  apostila      text not null check (apostila in ('genero', 'qv_hap')),
  dominio       text not null,               -- alimenta progresso_dominio (v2)
  unidade       text,                        -- '1' | '2' | '3.4' etc. (secão da apostila)
  tese          text not null,               -- do marcador EM UMA FRASE — 1 frase
  definicao     text,                        -- do glossário
  armadilha     text,                        -- do marcador CUIDADO
  exemplo       text,                        -- do marcador EXEMPLO
  criterio      text,                        -- da lista de autoavaliação — gate de mastery
  gancho        text,                        -- do marcador NO SEU ARTIGO
  ano_origem    integer,                     -- eixo cronológico (Beauvoir 1949, Skinner 1953…)
  autor_origem  text,
  fronteira     text,                        -- o que o usuário ainda NÃO sabe aqui
  criado_em     timestamptz not null default now()
);

-- saber_conceito é catálogo compartilhado (não-por-usuário) — sem RLS pra
-- todo mundo ler; write é read-only via seed (sem RLS de escrita porque
-- apenas migrations tocam). O padrão do repo pra tabelas de catálogo
-- (personagens, food_db) é o mesmo.
create index if not exists idx_saber_conceito_apostila on public.saber_conceito (apostila);
create index if not exists idx_saber_conceito_dominio on public.saber_conceito (dominio);

-- ------------------------------------------------------------
-- 2. saber_prereq — arestas do DAG. Um conceito requer 0+ outros.
-- ------------------------------------------------------------
create table if not exists public.saber_prereq (
  conceito  text not null references public.saber_conceito(slug) on delete cascade,
  requer    text not null references public.saber_conceito(slug) on delete cascade,
  forca     text not null default 'duro' check (forca in ('duro', 'macio')),
  -- 'duro' trava a abertura do conceito até mastery ≥ 2 do requerido.
  -- 'macio' só avisa que ajuda ter visto antes.
  primary key (conceito, requer),
  check (conceito <> requer)
);

create index if not exists idx_saber_prereq_requer on public.saber_prereq (requer);

-- ------------------------------------------------------------
-- 3. saber_item — pergunta/exercício em 3 camadas.
--    Camada 1 = discriminação (reconhecer/diferenciar)
--    Camada 2 = explicação (produzir a definição de memória)
--    Camada 3 = aplicação (analisar caso inédito)
-- ------------------------------------------------------------
create table if not exists public.saber_item (
  id        bigserial primary key,
  conceito  text not null references public.saber_conceito(slug) on delete cascade,
  camada    smallint not null check (camada between 1 and 3),
  enunciado text not null,
  rubrica   text,                            -- como se autocorrigir nas camadas 2 e 3
  criado_em timestamptz not null default now()
);

create index if not exists idx_saber_item_conceito on public.saber_item (conceito);
create index if not exists idx_saber_item_camada on public.saber_item (camada);

-- ------------------------------------------------------------
-- 4. saber_producao — resposta do usuário a um item (por-usuário).
--    XP entra aqui na Fase 2 via xp_creditado.
-- ------------------------------------------------------------
create table if not exists public.saber_producao (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  item_id      bigint not null references public.saber_item(id) on delete cascade,
  texto        text not null,                -- o que o usuário efetivamente escreveu
  autonota     smallint check (autonota between 0 and 3),
  lente        text,                         -- lente da semana (Fase 3)
  xp_creditado boolean not null default false,
  criado_em    timestamptz not null default now()
);

alter table public.saber_producao enable row level security;
create policy saber_producao_select on public.saber_producao
  for select using (auth.uid() = user_id);
create policy saber_producao_insert on public.saber_producao
  for insert with check (auth.uid() = user_id);
create policy saber_producao_update on public.saber_producao
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saber_producao_delete on public.saber_producao
  for delete using (auth.uid() = user_id);

create index if not exists idx_saber_producao_user on public.saber_producao (user_id, criado_em desc);
create index if not exists idx_saber_producao_item on public.saber_producao (item_id);

-- ------------------------------------------------------------
-- 5. saber_sessao — "preço" da sessão. Registra minutos + esforço
--    mesmo quando não houve produção (Fase 3: curva de demanda).
-- ------------------------------------------------------------
create table if not exists public.saber_sessao (
  id           bigserial primary key,
  user_id      uuid not null references auth.users(id) on delete cascade,
  iniciada_em  timestamptz not null default now(),
  finalizada_em timestamptz,
  minutos      integer,
  esforco      smallint check (esforco between 1 and 5),
  interrompida boolean not null default false,
  fronteiras   text,                          -- o que ficou sem entender (bloco Fecho)
  ordem_usada  text check (ordem_usada in ('didatica', 'cronologica', 'projeto'))
);

alter table public.saber_sessao enable row level security;
create policy saber_sessao_select on public.saber_sessao
  for select using (auth.uid() = user_id);
create policy saber_sessao_insert on public.saber_sessao
  for insert with check (auth.uid() = user_id);
create policy saber_sessao_update on public.saber_sessao
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saber_sessao_delete on public.saber_sessao
  for delete using (auth.uid() = user_id);

create index if not exists idx_saber_sessao_user on public.saber_sessao (user_id, iniciada_em desc);

-- ------------------------------------------------------------
-- 6. mastery_conceito — XP por conceito (paralelo a mastery_musculo).
--    Preenchido na Fase 2 quando estudo virar XP.
-- ------------------------------------------------------------
create table if not exists public.mastery_conceito (
  user_id       uuid not null references auth.users(id) on delete cascade,
  conceito      text not null references public.saber_conceito(slug) on delete cascade,
  xp            integer not null default 0 check (xp >= 0),
  nivel         smallint not null default 0 check (nivel between 0 and 3),
  -- Escala 0..3: 0 fechado · 1 reconhecimento · 2 explicação · 3 aplicação.
  -- Prereq 'duro' abre quando o exigido chegar em nivel ≥ 2.
  atualizado_em timestamptz not null default now(),
  primary key (user_id, conceito)
);

alter table public.mastery_conceito enable row level security;
create policy mastery_conceito_select on public.mastery_conceito
  for select using (auth.uid() = user_id);
create policy mastery_conceito_insert on public.mastery_conceito
  for insert with check (auth.uid() = user_id);
create policy mastery_conceito_update on public.mastery_conceito
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy mastery_conceito_delete on public.mastery_conceito
  for delete using (auth.uid() = user_id);

create index if not exists idx_mastery_conceito_user on public.mastery_conceito (user_id);

-- ------------------------------------------------------------
-- 7. saber_revisao — agendamento SM-2 simples.
-- ------------------------------------------------------------
create table if not exists public.saber_revisao (
  user_id        uuid not null references auth.users(id) on delete cascade,
  conceito       text not null references public.saber_conceito(slug) on delete cascade,
  vence_em       date not null default (now()::date),
  intervalo_dias integer not null default 1 check (intervalo_dias >= 1),
  facilidade     numeric(4,2) not null default 2.5 check (facilidade >= 1.3),
  lapsos         integer not null default 0 check (lapsos >= 0),
  ultima_revisao timestamptz,
  primary key (user_id, conceito)
);

alter table public.saber_revisao enable row level security;
create policy saber_revisao_select on public.saber_revisao
  for select using (auth.uid() = user_id);
create policy saber_revisao_insert on public.saber_revisao
  for insert with check (auth.uid() = user_id);
create policy saber_revisao_update on public.saber_revisao
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy saber_revisao_delete on public.saber_revisao
  for delete using (auth.uid() = user_id);

create index if not exists idx_saber_revisao_user_vence on public.saber_revisao (user_id, vence_em);

-- ------------------------------------------------------------
-- 8. saber_fonte — referências bibliográficas + estado de auditoria.
-- ------------------------------------------------------------
create table if not exists public.saber_fonte (
  id       bigserial primary key,
  citacao  text not null,             -- forma completa da referência
  doi      text,
  ano      integer,
  estado   text not null default 'ok' check (estado in ('ok', 'inconsistente', 'errado', 'ausente')),
  nota     text                       -- explicação da correção quando estado <> 'ok'
);

create index if not exists idx_saber_fonte_estado on public.saber_fonte (estado);

-- ------------------------------------------------------------
-- 9. progresso_dominio — relaxar check pra aceitar domínios de Saber.
-- ------------------------------------------------------------
-- Antes: check (dominio in ('upper','lower','abs','danca','taekwondo'))
-- Depois: aceita + 'peito','ombros' (v12.7) + 'genero','qv_hap','metodo','escrita'.
alter table public.progresso_dominio
  drop constraint if exists progresso_dominio_dominio_check;

alter table public.progresso_dominio
  add constraint progresso_dominio_dominio_check check (
    dominio in (
      'upper', 'lower', 'abs', 'danca', 'taekwondo',
      'peito', 'ombros',
      'genero', 'qv_hap', 'metodo', 'escrita'
    )
  );
