-- ============================================================
-- Quest — migration 0014: v9 — reconfiguração total (cutting)
-- ------------------------------------------------------------
-- Sistema interno de uso único: só Treino + Nutrição (+ cardio dentro da
-- Nutri). Remove Leitura/Dança, Sabedoria/Destreza e os 5 slots bloqueados.
-- Luan e Dhavos NÃO são removidos — são reapontados pro Treino/Nutri (Dhavos
-- → Força, Luan → Stamina/cardio), junto com Zyan e Kai. Introduz `meta`
-- (objetivo de cutting: 17,8%→13% BF até 09/09/2026) e a ficha de treino do
-- Apêndice A (biblioteca viva com campos de programação + seed do split de
-- 7 dias).
-- Decisão do usuário: logs históricos de leitura/dança são APAGADOS (não
-- mantidos como histórico morto).
-- ============================================================

-- ------------------------------------------------------------
-- 1. Purga leitura/dança dos dados.
-- ------------------------------------------------------------
delete from public.logs where comportamento in ('leitura', 'danca');
delete from public.quests where quest_id in ('leitura_hoje', 'danca_hoje');

alter table public.logs drop constraint if exists logs_comportamento_check;
alter table public.logs add constraint logs_comportamento_check
  check (comportamento in
    ('treino', 'nutri_refeicao', 'nutri_agua', 'cardio', 'volei', 'resistencia'));

alter table public.logs
  drop column if exists livro,
  drop column if exists paginas,
  drop column if exists minutos;

-- ------------------------------------------------------------
-- 2. Personagens — os 4 originais ficam, SEM slots bloqueados/extensibilidade.
--    Luan e Dhavos são REPAREADOS (não removidos): Dhavos passa a Força
--    (treino, junto com Zyan), Luan passa a Stamina/cardio (nutri, junto com
--    Kai). Bônus continua +25% aditivo — só o alvo muda. `donoDoAtributo`
--    (lib/data.ts) já lida com 2 personagens na mesma família (pega o
--    primeiro por `ordem`; Zyan e Kai continuam como "dono" padrão).
-- ------------------------------------------------------------
delete from public.selecao_diaria
  where personagem_id in (
    select id from public.personagens where desbloqueado = false
  );
delete from public.personagens where desbloqueado = false;

update public.personagens set
  atributo_foco = 'forca',
  comportamento_alvo = 'treino',
  lore = '"Quem guarda, também aguenta o peso." Bônus: +25% Força no treino.'
where slug = 'dhavos-tavera';

update public.personagens set
  atributo_foco = 'stamina',
  comportamento_alvo = 'nutri',
  lore = '"O ritmo não para — nem o fôlego." Bônus: +25% Stamina em refeição/água/cardio.'
where slug = 'luan-santos';

-- ------------------------------------------------------------
-- 3. Atributos — só Força e Stamina.
-- ------------------------------------------------------------
alter table public.atributos
  drop column if exists sabedoria,
  drop column if exists destreza;

-- ------------------------------------------------------------
-- 4. meta — objetivo de cutting (1 linha por usuário, lazy-criada como
--    `atributos` já é, via garantirMeta()).
-- ------------------------------------------------------------
create table if not exists public.meta (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  bf_inicial    numeric not null default 17.8,
  bf_alvo       numeric not null default 13,
  peso_alvo     numeric not null default 62,
  data_inicio   date not null default '2026-07-14',
  data_alvo     date not null default '2026-09-09',
  prioridades   jsonb not null default
    '["peito superior","deltoide lateral","largura de costas","abdômen com carga","pernas (manutenção)"]'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.meta enable row level security;
create policy meta_select on public.meta for select using (auth.uid() = user_id);
create policy meta_insert on public.meta for insert with check (auth.uid() = user_id);
create policy meta_update on public.meta for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy meta_delete on public.meta for delete using (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 5. exercicios — campos de programação (série/reps/RIR/descanso/cadência)
--    + novos exercícios do Apêndice A ainda não catalogados.
-- ------------------------------------------------------------
alter table public.exercicios
  add column if not exists series    text,
  add column if not exists reps      text,
  add column if not exists rir       text,
  add column if not exists descanso  text,
  add column if not exists cadencia  text;

insert into public.exercicios
  (id, nome, grupo_muscular, padrao_movimento, equipamento, musculos, execucao, cue, erro_comum, variacoes, peso_esforco_base, casa_ok)
values
('ex_crucifixo_inclinado','Crucifixo inclinado (halter/cabo)','peito','isolado','halter',
 '["peitoral superior"]'::jsonb,
 'Banco a 30–45°, halteres alinhados ao peito alto, abra em arco e junte sem estender total.',
 'Pausa no alongamento; foco em esticar a porção clavicular.',
 'Perder a inclinação e virar supino.',
 '["Crucifixo no cabo inclinado","Crucifixo reto"]'::jsonb,0.9,false),
('ex_supino_inclinado_smith','Supino inclinado no Smith/máquina (~30°)','peito','empurrar horizontal','maquina',
 '["peitoral superior","deltoide anterior","tríceps"]'::jsonb,
 'Banco a ~30° na guiada/Smith, desça até a clavícula alta e empurre com trajetória fixa.',
 '2ª dose de peito superior com carga estável; drop-set na última série.',
 'Ajustar o banco no ângulo errado (vira peito médio).',
 '["Supino inclinado halteres","Supino inclinado barra"]'::jsonb,1.2,false),
('ex_crossover_baixo_alto','Crossover na polia (baixo→alto)','peito','isolado','cabo',
 '["peitoral superior (clavicular)"]'::jsonb,
 'Polias baixas, puxe em arco de baixo pra cima até a altura dos olhos, aperte no topo.',
 'Vetor de baixo pra cima ativa a porção clavicular.',
 'Deixar o vetor virar horizontal (perde o ângulo).',
 '["Crossover alto→baixo","Crucifixo inclinado"]'::jsonb,0.9,false),
('ex_elevacao_lateral_cabo_unilateral','Elevação lateral no cabo (unilateral, atrás do corpo)','ombro','isolado','cabo',
 '["deltoide lateral"]'::jsonb,
 'Polia baixa atrás do corpo, eleve o braço lateralmente cruzando levemente à frente do tronco.',
 'Tensão máxima no ponto de maior alongamento do lateral.',
 'Usar impulso do tronco pra levantar.',
 '["Elevação lateral halter","Elevação lateral máquina"]'::jsonb,0.85,false),
('ex_remada_alta_polia','Remada alta na polia (pegada aberta)','ombro','puxar horizontal','cabo',
 '["deltoide lateral","deltoide posterior","trapézio"]'::jsonb,
 'Corda ou barra na polia baixa, puxe até a altura do peito com cotovelos abertos e altos.',
 'Cotovelos lideram o movimento, acima da linha das mãos.',
 'Puxar com os braços em vez de liderar com o cotovelo/ombro.',
 '["Remada alta com barra"]'::jsonb,0.9,false),
('ex_barra_fixa_lastrada','Barra fixa lastrada','costas','puxar vertical','peso corporal',
 '["latíssimo","romboides","bíceps"]'::jsonb,
 'Cinto com anilha/corrente, pegada aberta pronada, puxe até o queixo passar a barra.',
 'Largura do latíssimo — progressão de carga é prioridade aqui.',
 'Amplitude parcial pra compensar o peso extra.',
 '["Barra fixa livre","Puxada aberta pesada"]'::jsonb,1.4,false),
('ex_puxada_supinada_fechada','Puxada supinada (pegada fechada)','costas','puxar vertical','cabo',
 '["latíssimo inferior","bíceps"]'::jsonb,
 'Pegada supinada fechada na polia alta, puxe até a parte alta do peito.',
 'Foca o lat inferior e o bíceps.',
 'Balançar o tronco pra ajudar a puxar.',
 '["Puxada aberta","Barra fixa supinada (chin-up)"]'::jsonb,1.1,false)
on conflict (id) do nothing;

-- Preenche as prescrições de programa (série/reps/RIR/descanso/cadência) —
-- os exercícios já existentes no catálogo (0013) recebem update; os 7 novos
-- acima recebem update logo em seguida, no mesmo bloco.
update public.exercicios set series='4', reps='6–8',   rir='1–2', descanso='2–3 min', cadencia='3-1-1' where id='ex_supino_inclinado_com_halteres';
update public.exercicios set series='3', reps='8–10',  rir='1–2', descanso='2 min',   cadencia='2-0-2' where id='ex_supino_reto_com_barra';
update public.exercicios set series='3', reps='12–15', rir='0–1', descanso='90 s',    cadencia='2-1-2' where id='ex_crucifixo_inclinado';
update public.exercicios set series='4', reps='8–10',  rir='1–2', descanso='2 min',   cadencia='2-0-1' where id='ex_desenvolvimento_com_halteres';
update public.exercicios set series='4', reps='12–20', rir='0–1', descanso='45–60 s', cadencia='2-0-1' where id='ex_elevacao_lateral';
update public.exercicios set series='3', reps='10–12', rir='1',   descanso='60–90 s', cadencia='2-0-1' where id='ex_triceps_na_polia_corda';
update public.exercicios set series='4', reps='6–10',  rir='1–2', descanso='2–3 min', cadencia='2-1-2' where id='ex_barra_fixa_pull_up';
update public.exercicios set series='3', reps='8–12',  rir='1–2', descanso='2 min',   cadencia='2-1-2' where id='ex_puxada_frontal_na_polia';
update public.exercicios set series='3', reps='8–10',  rir='1–2', descanso='2 min',   cadencia='2-0-1' where id='ex_remada_curvada_com_barra';
update public.exercicios set series='3', reps='12–15', rir='0–1', descanso='90 s',    cadencia='2-1-2' where id='ex_pulldown_com_braco_reto';
update public.exercicios set series='3', reps='15–20', rir='0–1', descanso='60 s',    cadencia='2-1-1' where id='ex_face_pull';
update public.exercicios set series='3', reps='8–12',  rir='1',   descanso='60–90 s', cadencia='2-0-1' where id='ex_rosca_direta_com_barra';
update public.exercicios set series='3', reps='10–12', rir='0–1', descanso='60 s',    cadencia='2-1-2' where id='ex_elevacao_de_pernas';
update public.exercicios set series='3', reps='8–10',  rir='2',   descanso='2–3 min', cadencia='2-0-1' where id='ex_agachamento_livre';
update public.exercicios set series='3', reps='10–12', rir='1–2', descanso='2 min',   cadencia='2-0-1' where id='ex_leg_press';
update public.exercicios set series='2', reps='12–15', rir='0–1', descanso='60–90 s', cadencia='2-1-1' where id='ex_cadeira_extensora';
update public.exercicios set series='3', reps='10–12', rir='1',   descanso='90 s',    cadencia='2-1-2' where id='ex_mesa_flexora';
update public.exercicios set series='2', reps='10–12', rir='1–2', descanso='90 s',    cadencia='3-0-1' where id='ex_stiff_terra_romeno';
update public.exercicios set series='4', reps='12–20', rir='0–1', descanso='45–60 s', cadencia='2-1-1' where id='ex_panturrilha_em_pe';
update public.exercicios set series='4', reps='8–10',  rir='1–2', descanso='2 min',   cadencia='2-0-1' where id='ex_supino_inclinado_smith';
update public.exercicios set series='3', reps='12–15', rir='0–1', descanso='90 s',    cadencia='2-1-2' where id='ex_crossover_baixo_alto';
update public.exercicios set series='3', reps='12–15', rir='0–1', descanso='60–90 s', cadencia='2-0-1' where id='ex_remada_alta_polia';
update public.exercicios set series='3', reps='10–12', rir='0–1', descanso='60 s',    cadencia='2-1-2' where id='ex_abdominal_na_polia';
update public.exercicios set series='3', reps='15–20', rir='0–1', descanso='60 s',    cadencia='2-1-1' where id='ex_crucifixo_invertido_rear_delt';
update public.exercicios set series='3', reps='8–10',  rir='1',   descanso='60–90 s', cadencia='2-0-1' where id='ex_triceps_testa';
update public.exercicios set series='2', reps='12',    rir='0–1', descanso='60 s',    cadencia='2-0-1' where id='ex_rosca_martelo';
update public.exercicios set series='4', reps='6–10',  rir='1–2', descanso='2–3 min', cadencia='2-1-2' where id='ex_barra_fixa_lastrada';
update public.exercicios set series='3', reps='10–12', rir='1–2', descanso='90 s',    cadencia='2-0-1' where id='ex_remada_unilateral_com_halter';
update public.exercicios set series='3', reps='10–12', rir='1',   descanso='90 s',    cadencia='2-1-2' where id='ex_puxada_supinada_fechada';
update public.exercicios set series='3', reps='15–20', rir='0–1', descanso='45–60 s', cadencia='2-1-1' where id='ex_elevacao_lateral_cabo_unilateral';

-- ------------------------------------------------------------
-- 6. treino_exercicios — liga ao catálogo + seed do split de 7 dias
--    (Apêndice A). App de usuário único: usa o único usuário existente.
-- ------------------------------------------------------------
alter table public.treino_exercicios
  add column if not exists exercicio_id text references public.exercicios(id);

do $$
declare uid uuid;
begin
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise notice 'Nenhum usuário encontrado — seed do split de treino pulado (rode manualmente depois de criar a conta).';
    return;
  end if;

  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id) values
  -- SEGUNDA — push (pesado) · ênfase peito superior
  (uid,'Supino inclinado c/ halteres (30–40°)','peito','seg_push',1,false,'ex_supino_inclinado_com_halteres'),
  (uid,'Supino reto (barra ou halteres)','peito','seg_push',2,false,'ex_supino_reto_com_barra'),
  (uid,'Crucifixo inclinado (halter/cabo)','peito','seg_push',3,false,'ex_crucifixo_inclinado'),
  (uid,'Desenvolvimento militar (halteres)','ombro','seg_push',4,false,'ex_desenvolvimento_com_halteres'),
  (uid,'Elevação lateral (halter)','ombro','seg_push',5,false,'ex_elevacao_lateral'),
  (uid,'Tríceps corda ou testa','triceps','seg_push',6,false,'ex_triceps_na_polia_corda'),
  -- TERÇA — pull (pesado) · ênfase largura de costas
  (uid,'Barra fixa pronada (pegada aberta) ou puxada aberta','costas','ter_pull',1,false,'ex_barra_fixa_pull_up'),
  (uid,'Puxada frente pegada média (pulldown)','costas','ter_pull',2,false,'ex_puxada_frontal_na_polia'),
  (uid,'Remada curvada (barra pronada)','costas','ter_pull',3,false,'ex_remada_curvada_com_barra'),
  (uid,'Pullover na polia (braço reto)','costas','ter_pull',4,false,'ex_pulldown_com_braco_reto'),
  (uid,'Face pull','ombro','ter_pull',5,false,'ex_face_pull'),
  (uid,'Rosca direta + alternada','biceps','ter_pull',6,false,'ex_rosca_direta_com_barra'),
  (uid,'Abdômen infra c/ carga (elevação de pernas)','core','ter_pull',7,false,'ex_elevacao_de_pernas'),
  -- QUARTA — legs (manutenção)
  (uid,'Agachamento livre ou hack','pernas','qua_legs',1,false,'ex_agachamento_livre'),
  (uid,'Leg press','pernas','qua_legs',2,false,'ex_leg_press'),
  (uid,'Cadeira extensora','pernas','qua_legs',3,false,'ex_cadeira_extensora'),
  (uid,'Mesa flexora','posterior','qua_legs',4,false,'ex_mesa_flexora'),
  (uid,'Stiff','posterior','qua_legs',5,false,'ex_stiff_terra_romeno'),
  (uid,'Panturrilha em pé','panturrilha','qua_legs',6,false,'ex_panturrilha_em_pe'),
  -- QUINTA — upper · ênfase peito superior (2º estímulo)
  (uid,'Supino inclinado no Smith/máquina (~30°)','peito','qui_upper',1,false,'ex_supino_inclinado_smith'),
  (uid,'Crossover na polia baixa→alta','peito','qui_upper',2,false,'ex_crossover_baixo_alto'),
  (uid,'Puxada aberta ou barra fixa','costas','qui_upper',3,false,'ex_puxada_frontal_na_polia'),
  (uid,'Elevação lateral (cabo/halter)','ombro','qui_upper',4,false,'ex_elevacao_lateral'),
  (uid,'Remada alta na polia (pegada aberta)','ombro','qui_upper',5,false,'ex_remada_alta_polia'),
  (uid,'Abdômen c/ carga (crunch na polia/máquina)','core','qui_upper',6,false,'ex_abdominal_na_polia'),
  -- SEXTA — ombros + braços (largura + manutenção de braço)
  (uid,'Desenvolvimento (halteres/máquina)','ombro','sex_ombros_bracos',1,false,'ex_desenvolvimento_com_halteres'),
  (uid,'Elevação lateral (halter)','ombro','sex_ombros_bracos',2,false,'ex_elevacao_lateral'),
  (uid,'Elevação lateral no cabo (unilateral, atrás do corpo)','ombro','sex_ombros_bracos',3,false,'ex_elevacao_lateral_cabo_unilateral'),
  (uid,'Crucifixo invertido / posterior','ombro','sex_ombros_bracos',4,false,'ex_crucifixo_invertido_rear_delt'),
  (uid,'Rosca direta (barra)','biceps','sex_ombros_bracos',5,false,'ex_rosca_direta_com_barra'),
  (uid,'Tríceps testa ou paralelas','triceps','sex_ombros_bracos',6,false,'ex_triceps_testa'),
  (uid,'Rosca martelo + tríceps corda (bi-set)','biceps','sex_ombros_bracos',7,false,'ex_rosca_martelo'),
  -- SÁBADO — costas + posterior de coxa (largura + posterior)
  (uid,'Barra fixa lastrada ou puxada aberta pesada','costas','sab_costas_posterior',1,false,'ex_barra_fixa_lastrada'),
  (uid,'Remada serrote (halter)','costas','sab_costas_posterior',2,false,'ex_remada_unilateral_com_halter'),
  (uid,'Pulldown braço reto ou pullover','costas','sab_costas_posterior',3,false,'ex_pulldown_com_braco_reto'),
  (uid,'Puxada supinada (pegada fechada)','costas','sab_costas_posterior',4,false,'ex_puxada_supinada_fechada'),
  (uid,'Stiff ou mesa flexora','posterior','sab_costas_posterior',5,false,'ex_stiff_terra_romeno'),
  (uid,'Abdômen c/ carga (crunch máquina/prancha com peso)','core','sab_costas_posterior',6,false,'ex_abdominal_na_polia'),
  -- DOMINGO — pump, técnica e cardio (circuito leve, RIR 0, sem sobrecarga)
  (uid,'Elevação lateral (drop-set, sem carga extra)','ombro','dom_pump_cardio',1,false,'ex_elevacao_lateral'),
  (uid,'Crossover peito superior (pump)','peito','dom_pump_cardio',2,false,'ex_crossover_baixo_alto'),
  (uid,'Pulldown/pullover largura (pump)','costas','dom_pump_cardio',3,false,'ex_pulldown_com_braco_reto'),
  (uid,'Abdômen (fluxo, sem carga extra)','core','dom_pump_cardio',4,false,'ex_abdominal_na_polia');
end $$;

-- ------------------------------------------------------------
-- 7. spotify_tokens — guarda o id da playlist real "Quest — Trilha do
--    Hábito" (criada sob demanda na primeira faixa tocada).
-- ------------------------------------------------------------
alter table public.spotify_tokens
  add column if not exists playlist_id text;
