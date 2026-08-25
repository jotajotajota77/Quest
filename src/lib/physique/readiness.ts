// ============================================================
// Adaptive Physique RPG — readiness (PR6, §17, §24).
// ------------------------------------------------------------
// 100% puro. Fórmula D.3 do plano:
//
//   readiness = clamp(
//     0.25 × sono_score
//     + 0.20 × (10 - fome) / 10
//     + 0.15 × (10 - dor)  / 10
//     + 0.15 × performance_recente_pct
//     + 0.10 × (1 - carga_semana_pct)
//     + 0.15 × (10 - fadiga_subjetiva) / 10
//   ) × 100
//
// Faixas:
//   >= 70  → READY
//   50-69  → CAUTION
//   <  50  → RECOVERY ADVISED
//
// NUNCA vira ordem médica. Só sugestão (§17).
// ============================================================

export type Veredicto = "ready" | "caution" | "recovery_advised";

export interface ReadinessInput {
  /** Horas de sono última noite (0-14 razoável). Null se não avaliado. */
  sono_h: number | null;
  /** Qualidade de sono 1-5. Null se não avaliado. */
  sono_qualidade: number | null;
  /** Fome 0-10 (0 = sem, 10 = fominha). */
  fome: number | null;
  /** Dor 0-10. */
  dor: number | null;
  /** Delta % de performance recente (últimas 2 sem vs 2 anteriores). */
  performance_pct: number | null;
  /** Carga semana atual (0-1, onde 1 = 100% do máximo saudável do usuário). */
  carga_semana_pct: number | null;
  /** Fadiga subjetiva 0-10 (0 = zero, 10 = destruído). Do daily.humor + stress. */
  fadiga_subjetiva: number | null;
}

export interface ReadinessResult {
  score: number;                             // 0-100 arredondado
  veredicto: Veredicto;
  componentes: {
    sono: number;
    fome_folga: number;
    dor_folga: number;
    performance: number;
    carga_folga: number;
    fadiga_folga: number;
    /** Peso relativo de cada componente disponível na fórmula usada. */
    cobertura_pct: number;
  };
}

/** sono_score: combina horas dormidas + qualidade em 0..1. */
function scoreSono(h: number | null, qual: number | null): number | null {
  if (h == null && qual == null) return null;
  const hn = h == null ? 6 : Math.max(0, Math.min(10, h));
  const qn = qual == null ? 3 : Math.max(1, Math.min(5, qual));
  // 7-9h e qualidade 4-5 = ~1.0; 4h + qualidade 2 = ~0.3.
  const horasScore = hn <= 4 ? 0.25 : hn >= 7 ? 1 : 0.25 + ((hn - 4) / 3) * 0.75;
  const qualScore = (qn - 1) / 4; // 1→0, 5→1
  return horasScore * 0.65 + qualScore * 0.35;
}

/** clamp helper. */
function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/**
 * Calcula readiness. Se um componente é null, seu peso é redistribuído
 * proporcionalmente entre os presentes. Isso preserva a escala 0-100
 * mesmo com dados parciais (comum nos primeiros dias).
 */
export function calcReadiness(input: ReadinessInput): ReadinessResult {
  const componentes: Array<{ nome: string; peso: number; valor: number | null }> = [
    { nome: "sono", peso: 0.25, valor: scoreSono(input.sono_h, input.sono_qualidade) },
    {
      nome: "fome",
      peso: 0.20,
      valor: input.fome == null ? null : clamp01((10 - input.fome) / 10),
    },
    {
      nome: "dor",
      peso: 0.15,
      valor: input.dor == null ? null : clamp01((10 - input.dor) / 10),
    },
    {
      nome: "performance",
      peso: 0.15,
      valor:
        input.performance_pct == null
          ? null
          : clamp01(0.5 + input.performance_pct / 20), // -10% → 0, 0% → 0.5, +10% → 1
    },
    {
      nome: "carga",
      peso: 0.10,
      valor: input.carga_semana_pct == null ? null : clamp01(1 - input.carga_semana_pct),
    },
    {
      nome: "fadiga",
      peso: 0.15,
      valor:
        input.fadiga_subjetiva == null
          ? null
          : clamp01((10 - input.fadiga_subjetiva) / 10),
    },
  ];

  const presentes = componentes.filter((c) => c.valor != null);
  const pesoTotal = presentes.reduce((a, c) => a + c.peso, 0);
  const cobertura_pct = Math.round(pesoTotal * 100);

  let score01 = 0;
  if (pesoTotal > 0) {
    for (const c of presentes) {
      score01 += (c.peso / pesoTotal) * (c.valor as number);
    }
  }

  const score = Math.round(score01 * 100);
  const veredicto: Veredicto =
    score >= 70 ? "ready" : score >= 50 ? "caution" : "recovery_advised";

  return {
    score,
    veredicto,
    componentes: {
      sono: Math.round((componentes[0].valor ?? 0) * 100),
      fome_folga: Math.round((componentes[1].valor ?? 0) * 100),
      dor_folga: Math.round((componentes[2].valor ?? 0) * 100),
      performance: Math.round((componentes[3].valor ?? 0) * 100),
      carga_folga: Math.round((componentes[4].valor ?? 0) * 100),
      fadiga_folga: Math.round((componentes[5].valor ?? 0) * 100),
      cobertura_pct,
    },
  };
}

/**
 * Retorna true se >=3 noites nos últimos 7 dias tiveram sono < 5h.
 * Sinal duro para banner "Recovery advised" na home mesmo se o score
 * do dia parecer ok.
 */
export function sinalSonoRuim(horasUltimos7: (number | null)[]): boolean {
  const ruins = horasUltimos7.filter((h) => h != null && h! < 5).length;
  return ruins >= 3;
}
