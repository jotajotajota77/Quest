-- ============================================================
-- Quest — migration 0007: quests / sidequests (camada VR secundária, v4)
-- ------------------------------------------------------------
-- Camada secundária OPCIONAL: variedade + razão variável. Passiva (avaliada
-- contra os logs/protocolo do dia). NÃO é terceira lista de decisões — é
-- reconhecimento do que você já fez. XP creditado uma vez por quest concluída.
-- ============================================================

create table if not exists public.quests (
  user_id    uuid not null references auth.users(id) on delete cascade,
  data       date not null,
  quest_id   text not null,
  tipo       text not null,                 -- 'diaria' | 'sidequest'
  descricao  text not null,
  xp         integer not null default 0,
  estado     text not null default 'aberta',-- 'aberta' | 'completa'
  criado_em  timestamptz not null default now(),
  primary key (user_id, data, quest_id)
);

alter table public.quests enable row level security;
create policy quests_select on public.quests for select using (auth.uid() = user_id);
create policy quests_insert on public.quests for insert with check (auth.uid() = user_id);
create policy quests_update on public.quests for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy quests_delete on public.quests for delete using (auth.uid() = user_id);
