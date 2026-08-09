-- ============================================================
-- Quest — migration 0025: RPG v12, PR3 (integração fina)
-- ------------------------------------------------------------
-- 1) colecao_item.visto — flag por-item pra distinguir drops NOVOS
--    (recém-caídos, ainda não vistos na /colecao) de itens antigos.
--    A migration marca todos os existentes como visto=true (já são
--    familiares); só drops inseridos daqui pra frente entram como
--    visto=false até o usuário abrir a /colecao.
--
-- 2) boss_estado.photocard_drop_id — persiste o slug da photocard
--    dropada quando o boss semanal caiu. Permite BossBattle mostrar
--    "Recompensa: +150 XP + 3 shards + [photocard]" em texto real,
--    não hardcoded, e sem consultar o log de coleção.
-- ============================================================

alter table public.colecao_item
  add column if not exists visto boolean not null default true;

-- Novos drops entram com visto=false; a UI marca como true ao renderizar.
-- (Rows já existentes ficam visto=true pelo default — não geram "NEW".)

alter table public.boss_estado
  add column if not exists photocard_drop_id text;
