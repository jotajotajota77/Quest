-- ============================================================
-- Quest — migration 0027: novo personagem jogável "Min".
-- ------------------------------------------------------------
-- Personagem-teste com arte real embutida no PR. Domínio de taekwondo
-- (dobok visível no rosto e no pose_kihap), faixa preta 1º dan.
-- Aparece como mais uma opção jogável no /hub — não substitui ninguém.
-- ============================================================

insert into public.personagens
  (slug, nome, titulo, atributo_foco, comportamento_alvo, lore, ativo, ordem,
   desbloqueado, bonus, dominio, faixa_canonica, nome_kr, inspiracao, jogavel)
values
  ('min', 'Min', 'The Vermilion Kihap',
    'foco', 'treino',
    'Cabelo vermelhão de fogo, faixa preta de 1º dan. Junta TKD com estética cyber-idol — o mestre do palco e do dojang.',
    true, 6, true, '{"tipo": "atributo", "valor": 0.25}'::jsonb,
    'taekwondo', 'preta_1dan', '민', 'design original v12.6', true)
on conflict (slug) do nothing;
