// ============================================================
// Adaptive Physique RPG — momentum (PR7, §31-33).
// ------------------------------------------------------------
// 100% puro. Fórmula D.4 do plano (janela 14 dias):
//
//   momentum = 100 × (
//     0.30 × treino_planejado_pct
//     + 0.25 × proteina_pct
//     + 0.15 × sono_pct
//     + 0.15 × checkin_pct
//     + 0.10 × recovery_respeitado_pct
//     + 0.05 × atividade_relevante_pct
//   )
//
// NÃO inclui peso perdido (§27, §60). NÃO zera com 1 falha.
// É medida de ADERÊNCIA, não punição.
// ============================================================

export interface MomentumInput {
  /** % dos dias previstos com treino em que houve treino registrado. */
  treino_planejado_pct: number | null;
  /** % dos dias com daily.peso_kg em que proteína caiu dentro da zona. */
  proteina_pct: number | null;
  /** % dos dias com sono_h >= 6.5. */
  sono_pct: number | null;
  /** % dos dias com daily_checkin registrado. */
  checkin_pct: number | null;
  /** % dos dias com readiness < 50 em que o usuário evitou treino pesado. */
  recovery_respeitado_pct: number | null;
  /** % dos dias com pelo menos uma atividade relevante (TKD, dança, treino, cardio). */
  atividade_relevante_pct: number | null;
}

export interface MomentumResult {
  score: number;             // 0-100 com 2 casas
  adherence_pct: number;     // % dos dias com QUALQUER interação registrada
  componentes: {
    treino_planejado: number;
    proteina: number;
    sono: number;
    checkin: number;
    recovery_respeitado: number;
    atividade: number;
    cobertura_pct: number;
    /** Trend humano: 'up' | 'flat' | 'down' (comparativo vs 7 dias antes). */
    trend?: "up" | "flat" | "down";
  };
}

const PESOS = {
  treino_planejado_pct: 0.30,
  proteina_pct: 0.25,
  sono_pct: 0.15,
  checkin_pct: 0.15,
  recovery_respeitado_pct: 0.10,
  atividade_relevante_pct: 0.05,
} as const;

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

export function calcMomentum(input: MomentumInput, adherence_pct = 0): MomentumResult {
  const c: [keyof MomentumInput, number][] = [
    ["treino_planejado_pct", PESOS.treino_planejado_pct],
    ["proteina_pct", PESOS.proteina_pct],
    ["sono_pct", PESOS.sono_pct],
    ["checkin_pct", PESOS.checkin_pct],
    ["recovery_respeitado_pct", PESOS.recovery_respeitado_pct],
    ["atividade_relevante_pct", PESOS.atividade_relevante_pct],
  ];

  const presentes = c.filter(([k]) => input[k] != null);
  const pesoTotal = presentes.reduce((a, [, p]) => a + p, 0);
  let score01 = 0;
  if (pesoTotal > 0) {
    for (const [k, p] of presentes) {
      score01 += (p / pesoTotal) * clamp01((input[k] as number) / 100);
    }
  }

  const score = Math.round(score01 * 100 * 100) / 100;

  return {
    score,
    adherence_pct: Math.max(0, Math.min(100, adherence_pct)),
    componentes: {
      treino_planejado: Math.round(input.treino_planejado_pct ?? 0),
      proteina: Math.round(input.proteina_pct ?? 0),
      sono: Math.round(input.sono_pct ?? 0),
      checkin: Math.round(input.checkin_pct ?? 0),
      recovery_respeitado: Math.round(input.recovery_respeitado_pct ?? 0),
      atividade: Math.round(input.atividade_relevante_pct ?? 0),
      cobertura_pct: Math.round(pesoTotal * 100),
    },
  };
}

/**
 * Compara score de hoje vs média dos 7 dias anteriores.
 * Retorna trend humano.
 */
export function trendMomentum(hoje: number, historico7d: number[]): "up" | "flat" | "down" {
  if (!historico7d.length) return "flat";
  const media = historico7d.reduce((a, b) => a + b, 0) / historico7d.length;
  const delta = hoje - media;
  if (delta > 3) return "up";
  if (delta < -3) return "down";
  return "flat";
}

/**
 * Detecta "voltou depois de 2+ dias sem log" — trigger da welcome_back
 * quest §26. `datasComLog` são datas ISO ordenadas desc (mais recente primeiro).
 */
export function welcomeBackAtivo(datasComLog: string[], hoje = new Date()): boolean {
  if (datasComLog.length === 0) return false;
  const hojeIso = hoje.toISOString().slice(0, 10);
  const ultima = datasComLog[0];
  if (ultima === hojeIso) {
    // já logou hoje — vale acionar se o penúltimo log foi >2 dias antes.
    const penultima = datasComLog[1];
    if (!penultima) return false;
    const diffDias = diasEntre(penultima, hojeIso);
    return diffDias >= 3;
  }
  const diff = diasEntre(ultima, hojeIso);
  return diff >= 2;
}

function diasEntre(isoA: string, isoB: string): number {
  const a = new Date(isoA + "T00:00:00Z").getTime();
  const b = new Date(isoB + "T00:00:00Z").getTime();
  return Math.abs(Math.round((b - a) / 86400000));
}
