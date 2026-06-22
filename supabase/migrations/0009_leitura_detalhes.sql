-- ============================================================
-- Quest — migration 0009: detalhes de leitura (livro, páginas, tempo)
-- ------------------------------------------------------------
-- A aba Leitura passa a permitir registrar QUAL livro, quantas PÁGINAS e quanto
-- TEMPO (min). Campos opcionais no próprio log (mesma estratégia das macros da
-- Nutri): o 1-toque continua sendo o piso (TRAVA 1) e ignora estes campos.
-- ============================================================

alter table public.logs
  add column if not exists livro    text,
  add column if not exists paginas  integer,
  add column if not exists minutos  integer;
