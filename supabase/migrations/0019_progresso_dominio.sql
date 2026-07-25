-- ============================================================
-- Quest — migration 0019: progresso_dominio (faixa dinâmica v10.2)
-- ------------------------------------------------------------
-- 5 linhas por usuário (upper / lower / abs / danca / taekwondo). Sanha
-- começa em 10º kup (branca) em todos os 5. XP acumula quando você loga
-- com o mestre daquele domínio como protagonista do dia. Ao acumular o
-- threshold da faixa, sobe o kup — quando passa do 1º kup, vira faixa
-- preta 1º dan e continua subindo em dan.
--
-- Curva de XP (kup → próximo): 30, 60, 100, 180, 280, 400, 550, 750,
-- 1000, 1500 — cumulativo até 1º dan = 4.850 xp por domínio.
-- Dan → próximo: 2500, 4000, 6000, 9000, ...
--
-- Faixa canônica do MESTRE (personagens.faixa_canonica, formato
-- "branca_10kup" / "azul_4kup" / "preta_2dan") é o teto do desafio: quando
-- o seu kup/dan naquele domínio alcança a canônica → mestre se torna
-- "desafiável" (mecânica de quest em migration futura).
-- ============================================================

create table if not exists public.progresso_dominio (
  user_id       uuid not null references auth.users(id) on delete cascade,
  dominio       text not null check (dominio in ('upper','lower','abs','danca','taekwondo')),
  kup           integer not null default 10 check (kup >= 0 and kup <= 10),
  dan           integer not null default 0  check (dan >= 0 and dan <= 9),
  xp_no_kup     integer not null default 0  check (xp_no_kup >= 0),
  atualizado_em timestamptz not null default now(),
  primary key (user_id, dominio)
);

alter table public.progresso_dominio enable row level security;

create policy progresso_dominio_select on public.progresso_dominio
  for select using (auth.uid() = user_id);
create policy progresso_dominio_insert on public.progresso_dominio
  for insert with check (auth.uid() = user_id);
create policy progresso_dominio_update on public.progresso_dominio
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy progresso_dominio_delete on public.progresso_dominio
  for delete using (auth.uid() = user_id);

create index if not exists idx_progresso_dominio_user
  on public.progresso_dominio (user_id);
