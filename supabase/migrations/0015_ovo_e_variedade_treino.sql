-- ============================================================
-- Quest — migration 0015: ovo inteiro (10 preparos) + treino mais
-- variado com dicas mais ricas.
-- ------------------------------------------------------------
-- (1) food_db: adiciona os 10 preparos de "Ovo inteiro" (o base 'ovo'
--     do 0006 já existia; faltavam as variações preparadas — o padrão
--     de clara/gema no 0011 tem os 10).
-- (2) exercicios: enriquece execucao/cue/erro_comum/variacoes das 8
--     prioridades V-taper (peito superior, delto lateral, largura de
--     costas, abd com carga, pernas manutenção) com dicas explícitas
--     de quantidade (progressão de carga/reps) e qualidade (técnica).
-- (3) treino_exercicios: adiciona 1 exercício por dia ao split de 7
--     dias (idempotente — WHERE NOT EXISTS por user+split+exercicio_id
--     — pra não sujar plano custom nem duplicar seed).
-- (4) Prescrição (série/reps/RIR/desc/cad) dos 4 exercícios que passam
--     a ser seedados no split e ainda não tinham prescrição no 0014.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Ovo inteiro — 10 preparos (mesmo padrão de clara/gema no 0011).
--    Macros por 100g, aproximados no estilo TACO. Valores calóricos
--    escalam com o método (base cozido ≈ 155 kcal).
-- ------------------------------------------------------------
insert into public.food_db (id, nome, categoria, kcal, proteina, carbo, gordura) values
('gx_ovo_inteiro_cozido',      'Ovo inteiro cozido',      'proteina', 155,   13,   1.1, 11),
('gx_ovo_inteiro_grelhado',    'Ovo inteiro grelhado',    'proteina', 158,   13,   1.1, 11),
('gx_ovo_inteiro_assado',      'Ovo inteiro assado',      'proteina', 165,   13,   1.1, 11.5),
('gx_ovo_inteiro_na_chapa',    'Ovo inteiro na chapa',    'proteina', 165,   13,   1.1, 12),
('gx_ovo_inteiro_ensopado',    'Ovo inteiro ensopado',    'proteina', 172,   13,   1.1, 12),
('gx_ovo_inteiro_refogado',    'Ovo inteiro refogado',    'proteina', 210,   13,   1.1, 17),
('gx_ovo_inteiro_frito',       'Ovo inteiro frito',       'proteina', 240,   13,   1.1, 20),
('gx_ovo_inteiro_a_milanesa',  'Ovo inteiro à milanesa',  'proteina', 275,   13,  12,   20),
('gx_ovo_inteiro_desfiado',    'Ovo inteiro desfiado',    'proteina', 158,   13,   1.1, 11),
('gx_ovo_inteiro_defumado',    'Ovo inteiro defumado',    'proteina', 175,   13.2, 1.1, 12)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 2. Exercicios — enriquecimento dos 8 exercícios-prioridade V-taper.
--    execucao mais concreta, cue com faixas de reps/RIR e progressão
--    numérica, erro_comum com 2–3 erros comuns, variacoes com 4–5.
-- ------------------------------------------------------------

update public.exercicios set
  execucao   = 'Banco a 30° (45° já vira ombro). Pés firmes, escápulas retraídas e travadas. Halteres na linha do peito alto, cotovelos ~60° em relação ao tronco. Desce 3s controlado até sentir o alongamento; empurra explosivo mantendo tensão em cima sem estender total.',
  cue        = 'Faixa alvo: 4×6–8 com RIR 1–2 na semana 1–4; progride pra 4×8–10 na 5–8. Sobe 2,5 kg quando cravar 4×8 com RIR 2. Pense em "juntar o peito superior" a cada rep.',
  erro_comum = 'Rotacionar o punho pra dentro (sobrecarga no ombro). Bater os halteres no topo e perder tensão. Descida rápida — perde o estímulo excêntrico.',
  variacoes  = '["Supino inclinado no Smith (~30°)","Supino inclinado com barra","Máquina inclinada","Supino inclinado halteres neutros","Landmine press"]'::jsonb
where id = 'ex_supino_inclinado_com_halteres';

update public.exercicios set
  execucao   = 'Em pé, halteres ao lado do quadril, cotovelo semi-flexionado 10–15° e travado nesse ângulo. Eleve o cotovelo (não o halter) até a linha dos ombros. Punho neutro ou dedo mindinho levemente mais alto. Segure 1s no topo, desce controlado 2–3s.',
  cue        = 'Peso leve + volume alto é o segredo do lateral. 4×12–20 com RIR 0–1, drop-set na última série. Sobe 1 kg (não 2,5) quando fizer 15 reps limpas com facilidade — o lateral cresce com progressão lenta.',
  erro_comum = 'Balançar o tronco pra jogar o halter (usa trapézio e momento). Levantar acima da linha dos ombros — impinge o ombro. Estender o cotovelo no meio (vira frontal).',
  variacoes  = '["Elevação no cabo unilateral (atrás do corpo)","Elevação na máquina","Elevação sentado (elimina impulso)","Elevação inclinada (banco a 15°)","Elevação com elástico"]'::jsonb
where id = 'ex_elevacao_lateral';

update public.exercicios set
  execucao   = 'Cinto de peso com anilha ou corrente (5–15 kg extra). Pegada pronada ~1,5× a largura dos ombros. Comece em dead hang, ative a escápula pra baixo antes de puxar. Sobe até o queixo passar a barra ou peito quase encostar. Desça 3s controlado até estender o braço.',
  cue        = '4×6–10 com RIR 1–2 — carga extra é a prioridade, não reps. Progressão: +2,5 kg quando bater 4×8 limpo com RIR 2. Se falhar antes de 6, use banda de assistência mantendo o lastro.',
  erro_comum = 'Kipping / balançar — evapora o estímulo do lat. Amplitude parcial pra fazer o rep. Não ativar escápula antes de puxar (força bíceps e ombro).',
  variacoes  = '["Barra fixa pronada aberta (peso corporal)","Puxada aberta pesada","Barra fixa com colete lastrado","Barra fixa neutra lastrada","Chin-up lastrado (supinado)"]'::jsonb
where id = 'ex_barra_fixa_lastrada';

update public.exercicios set
  execucao   = 'Barra no trapézio médio (não no pescoço). Pés na largura dos ombros, ponta ~15° pra fora. Faça bracing 360° do abdômen antes de descer. Quadril desce entre os joelhos até coxa passar da paralela, joelhos rastreando os pés. Empurra o chão com o meio do pé subindo.',
  cue        = '3×8–10 com RIR 2 — manutenção de força em cutting, não pico. Se travar em 8 reps, mantém a carga por 2 semanas antes de subir. Objetivo: manter a carga, não ganhar 5 kg no mês.',
  erro_comum = 'Joelho pra dentro (valgus) na subida. Calcanhar subindo — se falta mobilidade, use halter atrás ou palmilha. Butt wink (lombar arredondando no fundo).',
  variacoes  = '["Agachamento frontal","Hack squat","Agachamento no Smith","Agachamento pausado (2s no fundo)","Agachamento goblet (leve)"]'::jsonb
where id = 'ex_agachamento_livre';

update public.exercicios set
  execucao   = 'Barra no chão ou rack alto na altura das coxas. Pés na largura do quadril. Joelhos leves 5–10° fixos nesse ângulo. Empurra o quadril pra trás (hip hinge), barra descendo colada às coxas até sentir o alongamento no posterior (~metade da canela ou joelho). Volta empurrando o quadril à frente.',
  cue        = '2×10–12 com RIR 1–2. Cadência 3-0-1: desce 3s, sem pausa embaixo, sobe 1s. Sente o posterior — se sentir só lombar, você está dobrando o joelho a mais. Não é um deadlift completo.',
  erro_comum = 'Dobrar o joelho na descida (vira agachamento). Arredondar a lombar procurando amplitude — pare onde a coluna começar a flexionar. Puxar com a lombar em vez de estender o quadril.',
  variacoes  = '["Stiff com halteres","RDL unilateral (single-leg)","Good morning","Terra romeno com barra hexagonal","Stiff no cabo"]'::jsonb
where id = 'ex_stiff_terra_romeno';

update public.exercicios set
  execucao   = 'Corda na polia alta. Ajoelhado, corda na altura da nuca, sente sobre os calcanhares. Flexione a coluna encurtando o abdômen (cotovelo em direção à coxa), quadril imóvel. Sobe tirando peso, desce 2s controlado até quase estender.',
  cue        = '3×10–12 com RIR 0–1 — abdômen com carga é o que aumenta espessura visível. Sobe 2,5 kg quando cravar 12 reps limpo. Pense em "enrolar a coluna", não "puxar com o braço".',
  erro_comum = 'Puxar com os braços/ombros — a corda não deve se mover independente do tronco. Mover o quadril (deve ficar fixo). Amplitude curta — parar antes de encurtar totalmente o abdômen.',
  variacoes  = '["Crunch na máquina","Cable crunch em pé","Abdominal supra","Crunch reverso c/ carga","Roll-out no ab wheel"]'::jsonb
where id = 'ex_abdominal_na_polia';

update public.exercicios set
  execucao   = 'Barra em pegada pronada, mãos ~1,5× a largura dos ombros. Sentado, coxas travadas. Iniciar puxando as escápulas pra baixo (não com o bíceps). Traz a barra até a parte alta do peito, cotovelo apontando ao chão. Volta controlado 2s alongando o lat.',
  cue        = '3×8–12 com RIR 1–2. Peito aberto — pense em "empurrar o teto com a cabeça". Sobe carga quando cravar 3×12 sem inclinar mais que 15° pra trás.',
  erro_comum = 'Puxar até a nuca (impinge ombro). Balançar o tronco (usa lombar). Terminar o rep com a barra alta demais — falta amplitude no lat.',
  variacoes  = '["Barra fixa pronada (peso corporal)","Puxada supinada (chin-up assist)","Puxada com pegada neutra","Puxada triângulo","Puxada com corda dupla"]'::jsonb
where id = 'ex_puxada_frontal_na_polia';

update public.exercicios set
  execucao   = 'Polias baixas, ambas ao mesmo tempo. Postura em split (um pé à frente) pra estabilidade. Punho neutro, cotovelo semi-flexionado 15° travado. Puxa em arco ascendente até altura dos olhos, mãos se cruzando levemente. Aperta 1s no topo, desce 3s alongando.',
  cue        = '3×12–15 com RIR 0–1 — vetor de baixo pra cima ativa a porção clavicular. Última série drop-set (baixa 30% e vai até falha). Sente a contração no peito alto.',
  erro_comum = 'Vetor virando horizontal (perde o ângulo — vira peito médio). Cotovelo mudando de ângulo no meio (usa tríceps). Postura frontal quadrada — instável, perde o foco.',
  variacoes  = '["Crossover alto→baixo (peito inferior)","Crucifixo inclinado (halter)","Crucifixo inclinado na polia","Máquina peck deck inclinada","Cabo unilateral baixo→alto"]'::jsonb
where id = 'ex_crossover_baixo_alto';

-- ------------------------------------------------------------
-- 3. Prescrição dos 4 exercícios novos no split (que ainda não tinham
--    programa preenchido no 0014).
-- ------------------------------------------------------------
update public.exercicios set series='3', reps='15–20', rir='0–1', descanso='60 s', cadencia='2-1-1' where id='ex_cadeira_abdutora';
update public.exercicios set series='3', reps='10–12', rir='1',   descanso='60 s', cadencia='2-0-1' where id='ex_rosca_alternada_com_halteres';
update public.exercicios set series='3', reps='12–15', rir='0–1', descanso='60 s', cadencia='2-1-1' where id='ex_encolhimento_trapezio';
update public.exercicios set series='3', reps='15–20', rir='0–1', descanso='45 s', cadencia='2-1-1' where id='ex_abdominal_supra';

-- ------------------------------------------------------------
-- 4. treino_exercicios — adiciona 1 exercício por dia ao split de 7
--    dias, escolhidos pra reforçar prioridades V-taper e cobrir gaps:
--
--    Dia  | Exercício                       | Justificativa
--    -----+---------------------------------+-------------------------------
--    SEG  | Face pull                       | Balanço postural pós-push
--    TER  | Rosca martelo                   | Braquial + antebraço
--    QUA  | Cadeira abdutora                | Glúteo médio (V-taper embaixo)
--    QUI  | Tríceps na polia (corda)        | 2º estímulo tríceps
--    SEX  | Rosca alternada com halteres    | Variação de bíceps
--    SAB  | Encolhimento (trapézio)         | Trap superior (postura)
--    DOM  | Abdominal supra                 | Core no fluxo, sem carga
--
--    Idempotente: INSERT SELECT ... WHERE NOT EXISTS (por user+split+ex_id).
--    Preserva plano custom do usuário (rows com custom=true não são tocadas
--    porque nem sequer olho pra elas — só chego adicionando).
-- ------------------------------------------------------------
do $$
declare uid uuid;
begin
  select id into uid from auth.users order by created_at asc limit 1;
  if uid is null then
    raise notice 'Nenhum usuário encontrado — seed de complementos do split pulado.';
    return;
  end if;

  -- SEG · Face pull
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Face pull', 'ombro', 'seg_push', 7, false, 'ex_face_pull'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'seg_push' and exercicio_id = 'ex_face_pull'
  );

  -- TER · Rosca martelo
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Rosca martelo', 'biceps', 'ter_pull', 8, false, 'ex_rosca_martelo'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'ter_pull' and exercicio_id = 'ex_rosca_martelo'
  );

  -- QUA · Cadeira abdutora
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Cadeira abdutora (glúteo médio)', 'gluteo', 'qua_legs', 7, false, 'ex_cadeira_abdutora'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'qua_legs' and exercicio_id = 'ex_cadeira_abdutora'
  );

  -- QUI · Tríceps na polia (corda)
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Tríceps na polia (corda)', 'triceps', 'qui_upper', 7, false, 'ex_triceps_na_polia_corda'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'qui_upper' and exercicio_id = 'ex_triceps_na_polia_corda'
  );

  -- SEX · Rosca alternada com halteres
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Rosca alternada com halteres', 'biceps', 'sex_ombros_bracos', 8, false, 'ex_rosca_alternada_com_halteres'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'sex_ombros_bracos' and exercicio_id = 'ex_rosca_alternada_com_halteres'
  );

  -- SAB · Encolhimento (trapézio)
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Encolhimento (trapézio)', 'costas', 'sab_costas_posterior', 7, false, 'ex_encolhimento_trapezio'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'sab_costas_posterior' and exercicio_id = 'ex_encolhimento_trapezio'
  );

  -- DOM · Abdominal supra (fluxo)
  insert into public.treino_exercicios (user_id, nome, grupo_muscular, split, ordem, custom, exercicio_id)
  select uid, 'Abdominal supra (fluxo, sem carga)', 'core', 'dom_pump_cardio', 5, false, 'ex_abdominal_supra'
  where not exists (
    select 1 from public.treino_exercicios
    where user_id = uid and split = 'dom_pump_cardio' and exercicio_id = 'ex_abdominal_supra'
  );
end $$;
