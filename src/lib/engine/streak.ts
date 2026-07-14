// ============================================================
// Streak — emocional, anti-tudo-ou-nada. Dia de névoa NÃO quebra. (TRAVA névoa)
// ------------------------------------------------------------
// Um dia "conta" para o streak se teve qualquer log OU é um dia de névoa
// declarado. A quebra só acontece num dia sem log e sem névoa.
// ============================================================

function diaISO(t: number): string {
  return new Date(t).toISOString().slice(0, 10);
}

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

function maiorStreakHistorico(dias: Set<string>): number {
  if (dias.size === 0) return 0;
  const ordenados = [...dias].sort();
  let melhor = 1;
  let corrente = 1;
  for (let i = 1; i < ordenados.length; i++) {
    const anterior = new Date(`${ordenados[i - 1]}T00:00:00Z`).getTime();
    const atual = new Date(`${ordenados[i]}T00:00:00Z`).getTime();
    if (atual - anterior === 86_400_000) {
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
  const hojeT = new Date(`${hojeISO}T00:00:00Z`).getTime();

  // Começa hoje se hoje está ativo; senão a partir de ontem (streak até ontem).
  let cursor = ativo(hojeISO) ? hojeT : hojeT - 86_400_000;
  let streak = 0;
  while (ativo(diaISO(cursor))) {
    streak++;
    cursor -= 86_400_000;
  }

  // Última atividade real (log), varrendo até 365 dias atrás.
  let ultimaAtividade: string | null = null;
  for (let i = 0; i < 365; i++) {
    const d = diaISO(hojeT - i * 86_400_000);
    if (diasComLog.has(d)) {
      ultimaAtividade = d;
      break;
    }
  }
  const diasDesdeUltimaAtividade = ultimaAtividade
    ? Math.round((hojeT - new Date(`${ultimaAtividade}T00:00:00Z`).getTime()) / 86_400_000)
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
