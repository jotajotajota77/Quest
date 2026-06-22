-- ============================================================
-- Quest — migration 0002: app completo (4 comportamentos + roster)
-- ------------------------------------------------------------
-- Expande a base só-dieta para os 4 comportamentos (treino/nutri/leitura/
-- dança), 4 atributos alimentando um Elo ÚNICO, e o roster real de 4
-- personagens com bônus aditivo +25%. Mantém RLS em tudo.
-- ============================================================

-- 1. atributos: os 4 atributos do jogador (stamina já existe). Elo é ÚNICO.
alter table public.atributos
  add column if not exists forca     integer not null default 0,
  add column if not exists sabedoria integer not null default 0,
  add column if not exists destreza  integer not null default 0;

-- 2. logs: substitui logs_dieta, agora com `comportamento` para as 4 abas.
create table if not exists public.logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  ts            timestamptz not null default now(),
  comportamento text not null check (comportamento in
    ('treino','nutri_refeicao','nutri_agua','leitura','danca'))
);
create index if not exists idx_logs_user_ts on public.logs (user_id, ts desc);
create index if not exists idx_logs_user_comp_ts
  on public.logs (user_id, comportamento, ts desc);

-- migra dados antigos preservando id (FK do historico continua válida)
insert into public.logs (id, user_id, ts, comportamento)
select id, user_id, ts,
  case tipo when 'refeicao' then 'nutri_refeicao' else 'nutri_agua' end
from public.logs_dieta
on conflict (id) do nothing;

alter table public.logs enable row level security;
create policy logs_select on public.logs
  for select using (auth.uid() = user_id);
create policy logs_insert on public.logs
  for insert with check (auth.uid() = user_id);
create policy logs_update on public.logs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy logs_delete on public.logs
  for delete using (auth.uid() = user_id);

-- 3. historico_reforco aponta para logs (a base do nova-no-sistema/fading).
alter table public.historico_reforco
  drop constraint if exists historico_reforco_log_id_fkey;
alter table public.historico_reforco
  add constraint historico_reforco_log_id_fkey
  foreign key (log_id) references public.logs(id) on delete set null;

-- 4. fora a view e a tabela antigas.
drop view if exists public.vw_logs_dieta_latencia;
drop table if exists public.logs_dieta;

-- 5. view de latência derivada (captura passiva) sobre logs.
create or replace view public.vw_logs_latencia as
select l.id, l.user_id, l.ts, l.comportamento,
  extract(epoch from (l.ts - date_trunc('day', l.ts))) as latencia_seg
from public.logs l;

-- 6. schedule_state: o motor de instalação agora se chama 'nutri'.
update public.schedule_state set comportamento = 'nutri' where comportamento = 'dieta';

-- 7. personagens: novas colunas + roster real (4 personagens, bônus +25%).
alter table public.personagens
  add column if not exists slug   text,
  add column if not exists titulo text,
  add column if not exists bio    text;

-- limpa seleção e roster antigos (dados de dev) respeitando a FK.
delete from public.selecao_diaria;
delete from public.personagens;
create unique index if not exists idx_personagens_slug on public.personagens (slug);

-- comportamento_alvo usa a FAMÍLIA: 'treino' | 'nutri' | 'leitura' | 'danca'.
-- bonus = { tipo:'pct', valor:0.25 } — aditivo, magnitude igual para os 4.
insert into public.personagens
  (slug, nome, titulo, atributo_foco, comportamento_alvo, bonus,
   asset_rosto, asset_corpo, bio, lore, ativo, ordem)
values
('zyan-polska','Zyan Polska','The Iron Core','forca','treino',
 '{"tipo":"pct","valor":0.25}'::jsonb,
 '/personagens/zyan-polska/rosto.png','/personagens/zyan-polska/corpo.png',
 'Densidade Absoluta: transforma impacto em nada, segura toneladas.',
 '"O ferro não negocia. Só responde." Bônus: +25% Força no treino.', true, 0),
('kai-ryuen','Kai Ryuen','The Cardio Knight','stamina','nutri',
 '{"tipo":"pct","valor":0.25}'::jsonb,
 '/personagens/kai-ryuen/rosto.png','/personagens/kai-ryuen/corpo.png',
 'Pulmão Azul: hiperoxigenação, fôlego sobre-humano, nunca para.',
 '"Quem para, perde." Bônus: +25% Stamina em refeição/água.', true, 1),
('luan-santos','Luan Santos','The Dance Magician','destreza','danca',
 '{"tipo":"pct","valor":0.25}'::jsonb,
 '/personagens/luan-santos/rosto.png','/personagens/luan-santos/corpo.png',
 'Reescrita Rítmica: movimento sincronizado com música >120 BPM induz flow.',
 '"O ritmo decide. O corpo segue." Bônus: +25% Destreza na dança.', true, 2),
('dhavos-tavera','Dhavos Tavera','The Beast Warden','sabedoria','leitura',
 '{"tipo":"pct","valor":0.25}'::jsonb,
 '/personagens/dhavos-tavera/rosto.png','/personagens/dhavos-tavera/corpo.png',
 'Guardian Bond: vínculo bioenergético com criaturas, percepção em rede.',
 '"Quem cuida, dura." Bônus: +25% Sabedoria na leitura.', true, 3);
