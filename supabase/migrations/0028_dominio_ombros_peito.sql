-- ============================================================
-- Quest — migration 0028: novos domínios "peito" e "ombros".
-- ------------------------------------------------------------
-- Antes: dominio agregava tudo em 'upper' (peito+costas+ombros+braços).
-- Agora Min ganha foco específico em PEITO, Sanha ganha foco em OMBROS
-- (dele saiu o 'avatar' genérico). Os demais domínios continuam iguais.
-- ============================================================

update public.personagens set dominio = 'peito' where slug = 'min';
update public.personagens set dominio = 'ombros' where slug = 'sanha';
