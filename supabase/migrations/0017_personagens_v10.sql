-- ============================================================
-- Quest — migration 0017: personagens v10 (rebranding total)
-- ------------------------------------------------------------
-- Substitui os 4 personagens da v9 (Zyan/Dhavos/Kai/Luan) por 5 mestres
-- inspirados em idols (Mark Lee, Seok Matthew, Bangchan, Choi San, Huta),
-- com nomes próprios (não-idênticos). Cada mestre "guarda" um domínio de
-- treino num rank canônico:
--
--   Ryuki Han    (마크 vibe)     — Braços     · Azul 4º kup
--   Ji-seok Moon (매튜 vibe)     — Abs/core   · Verde 6º kup
--   Hujin Kim    (후타 vibe)     — Pernas     · Vermelha 2º kup
--   Sanhee Park  (산 vibe)      — Dança      · Verde/Azul 5º kup
--   Chan-ho Lee  (방찬 vibe)    — Taekwondo  · Preta 2º dan
--
-- Sanha (Yoon Sanha, ASTRO) entra como AVATAR DO JOGADOR — aparece só
-- na aba Espelho, não é selecionável no Hub (flag avatar_jogador=true).
--
-- Mecânica de faixa dinâmica (você começa branca; sobe com XP no domínio;
-- desafia o mestre quando alcança a faixa canônica → 3 quests → gradua)
-- virá em migrations proximas — esta migration só faz o swap de identidade
-- e adiciona os campos que a mecânica vai usar.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Novos campos em personagens.
-- ------------------------------------------------------------
alter table public.personagens
  add column if not exists dominio         text,          -- 'bracos'|'abs'|'pernas'|'danca'|'taekwondo'|'avatar'
  add column if not exists faixa_canonica  text,          -- 'branca_10kup' … 'preta_4dan'
  add column if not exists nome_kr         text,          -- '류키 한' etc.
  add column if not exists inspiracao      text,          -- 'Mark Lee (NCT)' etc.
  add column if not exists avatar_jogador  boolean not null default false;

-- ------------------------------------------------------------
-- 2. Purga os 4 personagens da v9 (junto com suas seleções históricas).
--    Logs, séries, meta, etc. ficam intactos — nada que dependa dos
--    personagens em runtime é apagado.
-- ------------------------------------------------------------
delete from public.selecao_diaria
  where personagem_id in (
    select id from public.personagens
    where slug in ('zyan-polska', 'dhavos-tavera', 'kai-ryuen', 'luan-santos')
  );

delete from public.personagens
  where slug in ('zyan-polska', 'dhavos-tavera', 'kai-ryuen', 'luan-santos');

-- ------------------------------------------------------------
-- 3. Insert dos 5 mestres + Sanha (avatar).
--    atributo_foco fica em {forca, stamina} por compatibilidade com o
--    engine atual — os atributos técnica+presença entram numa migration
--    própria junto com a mecânica de faixa dinâmica.
-- ------------------------------------------------------------
insert into public.personagens
  (slug, nome, titulo, atributo_foco, comportamento_alvo, lore, ativo, ordem,
   desbloqueado, bonus, dominio, faixa_canonica, nome_kr, inspiracao, avatar_jogador)
values
  ('ryuki-han', 'Ryuki Han', 'The Iron Weight',
    'forca', 'treino',
    '"Braço não empurra peso — empurra o mundo." Mestre dos braços.',
    true, 1, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'bracos', 'azul_4kup', '류키 한', 'Mark Lee (NCT)', false),

  ('ji-seok-moon', 'Ji-seok Moon', 'The Core Sharpener',
    'forca', 'treino',
    '"Se o core cede, tudo desmorona." Mestre do abdômen/core.',
    true, 2, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'abs', 'verde_6kup', '지석 문', 'Seok Matthew (BOYNEXTDOOR)', false),

  ('hujin-kim', 'Hujin Kim', 'The Endless Kick',
    'stamina', 'nutri',
    '"Perna cansada mente. A tua não." Mestre das pernas.',
    true, 3, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'pernas', 'vermelha_2kup', '후진 김', 'Huta (BTOB)', false),

  ('sanhee-park', 'Sanhee Park', 'The Stage Priest',
    'stamina', 'nutri',
    '"Presença é a técnica invisível." Mestre da dança.',
    true, 4, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'danca', 'verde_azul_5kup', '산희 박', 'Choi San (ATEEZ)', false),

  ('chan-ho-lee', 'Chan-ho Lee', 'The Sabum',
    'forca', 'treino',
    '"Kihap não é grito — é decisão." Sabum do dojang, mestre do Taekwondo.',
    true, 5, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'taekwondo', 'preta_2dan', '찬호 리', 'Bangchan (Stray Kids)', false),

  ('sanha', 'Sanha', 'The Trainee',
    'stamina', 'nutri',
    'Você. Trainee em busca do V-taper. Aparece só no Espelho.',
    true, 99, true, null,
    'avatar', 'branca_10kup', '산하', 'Yoon Sanha (ASTRO)', true);
