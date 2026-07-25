-- ============================================================
-- Quest — migration 0018: Upper/Lower + remap de mestres (v10.1)
-- ------------------------------------------------------------
-- Ajustes pos-feedback do usuario:
--
-- (1) Renomeia dominios "bracos" -> "upper" (mais geral, prioridade
--     peito superior) e "pernas" -> "lower" (mais generico).
--
-- (2) Remapeia os 5 mestres pros novos dominios seguindo o inspiration
--     rewrite:
--       Ryuki Han     (Mark Lee vibe)     -> Abs / Core
--       Ji-seok Moon  (Seok Matthew vibe) -> Danca
--       Hujin Kim     (Huta vibe)         -> Upper
--       Sanhee Park   (Choi San vibe)     -> Lower
--       Chan-ho Lee   (Bangchan vibe)     -> Taekwondo (inalterado)
--
-- (3) Corrige inspiracao do Ji-seok: BOYNEXTDOOR -> ZEROBASEONE (ZB1).
--
-- (4) Atualiza titulo/lore/atributo_foco/comportamento_alvo pra bater
--     com o novo dominio de cada mestre.
--
-- Faixas canonicas (identidade do mestre) permanecem inalteradas.
-- ============================================================

-- Ryuki Han (Mark Lee) -> Abs / Core
update public.personagens set
  dominio            = 'abs',
  titulo             = 'The Core Sharpener',
  atributo_foco      = 'forca',
  comportamento_alvo = 'treino',
  lore               = '"Se o core cede, tudo desmorona." Mestre do abdômen/core.'
where slug = 'ryuki-han';

-- Ji-seok Moon (Seok Matthew, ZB1) -> Danca + fix inspiracao
update public.personagens set
  dominio            = 'danca',
  titulo             = 'The Stage Priest',
  atributo_foco      = 'stamina',
  comportamento_alvo = 'nutri',
  lore               = '"Presença é a técnica invisível." Mestre da dança.',
  inspiracao         = 'Seok Matthew (ZEROBASEONE)'
where slug = 'ji-seok-moon';

-- Hujin Kim (Huta) -> Upper
update public.personagens set
  dominio            = 'upper',
  titulo             = 'The Ironclad',
  atributo_foco      = 'forca',
  comportamento_alvo = 'treino',
  lore               = '"Peito, costas, ombros — o triângulo do V." Mestre do Upper (peito superior em prioridade).'
where slug = 'hujin-kim';

-- Sanhee Park (Choi San) -> Lower
update public.personagens set
  dominio            = 'lower',
  titulo             = 'The Endless Kick',
  atributo_foco      = 'forca',
  comportamento_alvo = 'treino',
  lore               = '"Base firme é palco de tudo." Mestre do Lower.'
where slug = 'sanhee-park';

-- Chan-ho Lee (Bangchan) -> Taekwondo (inalterado — só re-escrita defensiva)
update public.personagens set
  dominio            = 'taekwondo',
  titulo             = 'The Sabum',
  atributo_foco      = 'forca',
  comportamento_alvo = 'treino',
  lore               = '"Kihap não é grito — é decisão." Sabum do dojang, mestre do Taekwondo.'
where slug = 'chan-ho-lee';
