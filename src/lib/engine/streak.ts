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
