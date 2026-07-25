// ============================================================
// Streak — emocional, anti-tudo-ou-nada. Dia de névoa NÃO quebra. (TRAVA névoa)
// ------------------------------------------------------------
// Um dia "conta" para o streak se teve qualquer log OU é um dia de névoa
// declarado. A quebra só acontece num dia sem log e sem névoa.
//
// v10.1: reescrita usando string-based date math (sem aritmética de ms) pra
// ficar 100% imune a fronteira de dia / DST / off-by-one no cruzamento
// UTC↔local. Antes, `hojeT - N*86_400_000` misturado com `diaISO(t)` gerava
// falha silenciosa em certas horas do dia.
// ============================================================

export interface StreakInfo {
  streak: number;
  /** Dias desde a última ATIVIDADE real (log), ignorando névoa. null = nunca. */
  diasDesdeUltimaAtividade: number | null;
  ultimaAtividade: string | null;
}

/** Streak detalhado (gamificação, TRAVA 8 v9.2) — chama viva.
 *  Extende o streak base com estado visual + recorde histórico. */
export interface StreakDetalhado extends StreakInfo {
  /** true se hoje ainda não teve log/névoa mas a streak > 0 (chama amarela). */
  emRisco: boolean;
  /** Maior streak já registrada no set de dias com log/névoa. */
  recorde: number;
  /** Hoje teve log/névoa? (chama verde vs amarela vs apagada) */
  hitHoje: boolean;
  /** Próximo marco (3/7/14/21/28/42/56/84) acima da streak atual. */
  proximoMarco: number | null;
}

const MARCOS_CHAMA = [3, 7, 14, 21, 28, 42, 56, 84, 112];
const MS_DIA = 86_400_000;

/** Subtrai 1 dia de "YYYY-MM-DD" via Date.UTC (imune a DST e ms edge). */
function diaAnterior(dataISO: string): string {
  const [y, m, d] = dataISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().slice(0, 10);
}

/** Diferença em dias entre duas datas ISO (a > b → positivo). */
function difDias(a: string, b: string): number {
  const ta = new Date(`${a}T00:00:00Z`).getTime();
  const tb = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((ta - tb) / MS_DIA);
}

function maiorStreakHistorico(dias: Set<string>): number {
  if (dias.size === 0) return 0;
  const ordenados = [...dias].sort();
  let melhor = 1;
  let corrente = 1;
  for (let i = 1; i < ordenados.length; i++) {
    if (difDias(ordenados[i], ordenados[i - 1]) === 1) {
      corrente++;
      if (corrente > melhor) melhor = corrente;
    } else {
      corrente = 1;
    }
  }
  return melhor;
}

export function calcularStreak(
  hojeISO: string,
  diasComLog: Set<string>,
  diasNevoa: Set<string>,
): StreakInfo {
  const ativo = (d: string) => diasComLog.has(d) || diasNevoa.has(d);

  // Começa em hoje se ativo; senão em ontem (streak "até ontem"). Trabalha
  // com strings de data pra evitar qualquer off-by-one de fuso.
  let dia = ativo(hojeISO) ? hojeISO : diaAnterior(hojeISO);
  let streak = 0;
  while (ativo(dia)) {
    streak++;
    dia = diaAnterior(dia);
  }

  // Última atividade real (só logs, ignora névoa), até 365 dias atrás.
  let ultimaAtividade: string | null = null;
  let cursor = hojeISO;
  for (let i = 0; i < 365; i++) {
    if (diasComLog.has(cursor)) {
      ultimaAtividade = cursor;
      break;
    }
    cursor = diaAnterior(cursor);
  }
  const diasDesdeUltimaAtividade = ultimaAtividade
    ? difDias(hojeISO, ultimaAtividade)
    : null;

  return { streak, diasDesdeUltimaAtividade, ultimaAtividade };
}

/** Streak enriquecido pra chama viva (visual + recorde + próximo marco).
 *  A união de log ∪ névoa alimenta a chama; log sozinho alimenta a atividade
 *  real. Recorde considera qualquer dia que "conta" (log OU névoa). */
export function streakDetalhado(
  hojeISO: string,
  diasComLog: Set<string>,
  diasNevoa: Set<string>,
): StreakDetalhado {
  const base = calcularStreak(hojeISO, diasComLog, diasNevoa);
  const hitHoje = diasComLog.has(hojeISO) || diasNevoa.has(hojeISO);
  const emRisco = !hitHoje && base.streak > 0;
  const uniao = new Set<string>();
  for (const d of diasComLog) uniao.add(d);
  for (const d of diasNevoa) uniao.add(d);
  const recorde = Math.max(base.streak, maiorStreakHistorico(uniao));
  const proximoMarco = MARCOS_CHAMA.find((m) => m > base.streak) ?? null;
  return { ...base, emRisco, recorde, hitHoje, proximoMarco };
}
