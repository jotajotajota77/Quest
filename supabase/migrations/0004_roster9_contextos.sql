-- ============================================================
-- Quest — migration 0004: roster 9 slots + imagens contextuais (v4)
-- ------------------------------------------------------------
-- (1) personagens ganham `desbloqueado` e `assets_contexto` (jsonb com as
--     imagens de ação por contexto). atributo/comportamento/bonus passam a
--     aceitar NULL (slots bloqueados a criar).
-- (2) seed de 5 slots bloqueados (slot-5…slot-9) como placeholders.
-- ============================================================

alter table public.personagens
  add column if not exists desbloqueado     boolean not null default true,
  add column if not exists assets_contexto  jsonb;

-- Slots bloqueados nascem com atributo/comportamento/bonus NULL (a criar).
alter table public.personagens alter column atributo_foco      drop not null;
alter table public.personagens alter column comportamento_alvo drop not null;
alter table public.personagens alter column bonus              drop not null;

-- Os 4 atuais ficam desbloqueados (default true já cobre, mas explícito).
update public.personagens set desbloqueado = true
where slug in ('zyan-polska','kai-ryuen','luan-santos','dhavos-tavera');

-- 5 slots bloqueados — placeholders estilo tela de luta (silhueta + cadeado).
-- Campos de jogo NULL até o usuário criar cada um (e flipar desbloqueado=true).
insert into public.personagens
  (slug, nome, titulo, atributo_foco, comportamento_alvo, bonus,
   asset_rosto, asset_corpo, assets_contexto, bio, lore, ativo, ordem, desbloqueado)
values
  ('slot-5', '???', 'EM BREVE', null, null, null, null, null, null, null, null, true, 4, false),
  ('slot-6', '???', 'EM BREVE', null, null, null, null, null, null, null, null, true, 5, false),
  ('slot-7', '???', 'EM BREVE', null, null, null, null, null, null, null, null, true, 6, false),
  ('slot-8', '???', 'EM BREVE', null, null, null, null, null, null, null, null, true, 7, false),
  ('slot-9', '???', 'EM BREVE', null, null, null, null, null, null, null, null, true, 8, false)
on conflict (slug) do nothing;
