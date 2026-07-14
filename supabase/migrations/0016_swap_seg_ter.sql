-- ============================================================
-- Quest — migration 0016: troca segunda ↔ terça (SEG vira pull, TER vira push).
-- ------------------------------------------------------------
-- O split de 7 dias do Apêndice A tinha SEG='seg_push' e TER='ter_pull'.
-- Pedido do usuário: SEG passa a ser dia de pull (largura de costas) e TER
-- passa a ser dia de push (peito superior). Estratégia: renomear as chaves
-- de split pra refletir o novo mapeamento dia→conteúdo (seg_push → ter_push,
-- ter_pull → seg_pull). O conteúdo dos exercícios não muda — só a chave e
-- em qual chip do dia da semana o app agrupa.
--
-- Swap seguro via chave temporária (a troca direta não daria conflito de PK
-- em treino_sessoes, mas assim fica óbvio e idempotente):
--   1) seg_push → __swap_tmp__
--   2) ter_pull → seg_pull
--   3) __swap_tmp__ → ter_push
-- Aplicado tanto em treino_exercicios (plano) quanto em treino_sessoes
-- (histórico de sessões finalizadas, se houver).
-- ============================================================

-- treino_exercicios
update public.treino_exercicios set split = '__swap_tmp__'
  where split = 'seg_push';
update public.treino_exercicios set split = 'seg_pull'
  where split = 'ter_pull';
update public.treino_exercicios set split = 'ter_push'
  where split = '__swap_tmp__';

-- treino_sessoes (histórico de sessão do dia)
update public.treino_sessoes set split = '__swap_tmp__'
  where split = 'seg_push';
update public.treino_sessoes set split = 'seg_pull'
  where split = 'ter_pull';
update public.treino_sessoes set split = 'ter_push'
  where split = '__swap_tmp__';
