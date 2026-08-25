// ============================================================
// Adaptive Physique RPG — matemática pura (PR1).
// ------------------------------------------------------------
// Zero I/O. Só cálculos determinísticos usados pelo engine e pela UI.
// Média móvel curta/longa, deltas, ISO week. Tudo puro pra facilitar
// testes futuros.
// ============================================================

export interface Ponto {
  ts: string;        // ISO date/timestamp
  valor: number;
}

/** Média aritmética simples de uma janela dos últimos N dias. */
export function mediaMovel(pontos: Ponto[], dias: number, hoje = new Date()): number | null {
  if (!pontos.length || dias <= 0) return null;
  const limite = new Date(hoje);
  limite.setDate(limite.getDate() - dias);
  const dentro = pontos.filter((p) => new Date(p.ts) >= limite);
  if (!dentro.length) return null;
  const soma = dentro.reduce((acc, p) => acc + p.valor, 0);
  return round(soma / dentro.length, 3);
}

export function mediaMovel7d(pontos: Ponto[], hoje = new Date()): number | null {
  return mediaMovel(pontos, 7, hoje);
}

export function mediaMovel14d(pontos: Ponto[], hoje = new Date()): number | null {
  return mediaMovel(pontos, 14, hoje);
}

/**
 * Delta absoluto entre duas janelas consecutivas (a mais recente x a
 * anterior). Usado pelo engine pra calcular ritmo de perda/ganho.
 * Retorna null se qualquer das janelas não tiver amostra.
 */
export function deltaEntreJanelas(
  pontos: Ponto[],
  janelaDias: number,
  hoje = new Date(),
): number | null {
  const recentes = janelaFiltrada(pontos, 0, janelaDias, hoje);
  const anteriores = janelaFiltrada(pontos, janelaDias, janelaDias * 2, hoje);
  if (!recentes.length || !anteriores.length) return null;
  const mediaR = media(recentes);
  const mediaA = media(anteriores);
  return round(mediaR - mediaA, 3);
}

/**
 * Delta em % do peso corporal (spec §72 usa 0.5%-1% peso/semana como
 * banda saudável de cutting).
 */
export function deltaPercentual(atual: number | null, anterior: number | null): number | null {
  if (atual == null || anterior == null || anterior === 0) return null;
  return round(((atual - anterior) / anterior) * 100, 2);
}

/**
 * Semana ISO no formato '2026-W32'. Usa cálculo padrão ISO 8601.
 * Não depende do fuso: o `hoje` passado já deve estar no fuso desejado.
 */
export function semanaISO(hoje = new Date()): string {
  const d = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

/** Média das 3 medidas de cintura (§41). Ignora null. */
export function mediaCintura(
  m1: number | null,
  m2: number | null,
  m3: number | null,
): number | null {
  const vals = [m1, m2, m3].filter((v): v is number => typeof v === "number" && !Number.isNaN(v));
  if (vals.length < 3) return null;
  return round((vals[0] + vals[1] + vals[2]) / 3, 1);
}

// ---------- internos ----------
function janelaFiltrada(pontos: Ponto[], inicioDias: number, fimDias: number, hoje: Date): Ponto[] {
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - fimDias);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() - inicioDias);
  return pontos.filter((p) => {
    const t = new Date(p.ts);
    return t >= inicio && t < fim;
  });
}

function media(pontos: Ponto[]): number {
  return pontos.reduce((acc, p) => acc + p.valor, 0) / pontos.length;
}

function round(n: number, casas: number): number {
  const f = Math.pow(10, casas);
  return Math.round(n * f) / f;
}
