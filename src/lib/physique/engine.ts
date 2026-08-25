// ============================================================
// Adaptive Physique RPG — engine determinístico (PR4, §42, §88).
// ------------------------------------------------------------
// 100% puro. Zero I/O. Entrada = snapshot semanal; saída = decisão
// {decision, signals, reason, confidence}.
//
// As regras D.5 (CUT) e D.8 (guardrails §72) do plano estão implementadas
// exatamente na ordem: primeiro match ganha. RECOVERY_CHECK vem antes de
// tudo — se sinais preocupantes coincidem, o engine JAMAIS sugere cortar
// mais / mais cardio / mais treino.
//
// Não gamifica magreza (§65). Não recompensa déficit extremo (§117).
// Se dúvida: WATCH (observe).
// ============================================================

export type Decision =
  | "keep_course"
  | "small_adjustment"
  | "recovery"
  | "phase_review"
  | "watch"
  | "recovery_check";

export interface CutInput {
  /** Média móvel de 7 dias do peso — atual (hoje até -6). */
  media7d_atual: number | null;
  /** Média móvel de 7 dias do peso — semana anterior (-7 até -13). */
  media7d_passada: number | null;
  /** Delta de cintura vs. semana anterior, em cm. Positivo = subiu. */
  cintura_delta_cm: number | null;
  /** Delta % de performance (média das últimas 3 sessões vs. base). */
  performance_delta_pct: number | null;
  /** Média de horas de sono últimos 7 dias. */
  sono_h_medio: number | null;
  /** Média de fome (0-10) últimos 7 dias. */
  fome_media: number | null;
  /** Aderência % (checkins + treinos previstos completos) últimos 14 dias. */
  aderencia_pct: number | null;
  /** Dias desde `physique_phase.started_at`. */
  dias_na_fase: number;
  /** Piso de segurança configurado (§72). Vem de physique_phase.calorie_target_min_floor. */
  kcal_min_floor: number | null;
  /** Alvo calórico atual (vem de nutrition_target ou physique_phase). */
  kcal_target_atual: number | null;
  /** Estimativa opcional de BF% (pra phase_review). */
  bf_estimado_pct?: number | null;
  /** Alvo opcional de BF% (physique_phase.target_bf_optional). */
  bf_target_pct?: number | null;
  /** Delta total de cintura desde início da fase (cm). */
  cintura_delta_total_cm?: number | null;
}

export interface Signals {
  s_perda_pct: number | null;
  s_cintura_delta_cm: number | null;
  s_perf_pct: number | null;
  s_sono_h: number | null;
  s_fome: number | null;
  s_aderencia_pct: number | null;
  dias_na_fase: number;
  kcal_target_atual: number | null;
  kcal_min_floor: number | null;
}

export interface DecisionResult {
  decision: Decision;
  reason: string;
  confidence: number;
  signals: Signals;
  /** Alvo calórico sugerido, se aplicável. NUNCA abaixo do piso §72. */
  kcal_target_sugerido?: number | null;
}

/**
 * Roda o engine de CUT. D.5 + D.8 na ordem. Primeiro match ganha.
 */
export function decideCut(input: CutInput): DecisionResult {
  const s_perda_pct = perdaPct(input.media7d_atual, input.media7d_passada);
  const s = {
    s_perda_pct,
    s_cintura_delta_cm: input.cintura_delta_cm,
    s_perf_pct: input.performance_delta_pct,
    s_sono_h: input.sono_h_medio,
    s_fome: input.fome_media,
    s_aderencia_pct: input.aderencia_pct,
    dias_na_fase: input.dias_na_fase,
    kcal_target_atual: input.kcal_target_atual,
    kcal_min_floor: input.kcal_min_floor,
  } satisfies Signals;

  // §72 GUARDRAIL — RECOVERY_CHECK. Se qualquer combinação preocupante
  // coincidir, o engine NUNCA propõe cortar mais.
  if (guardrail72(input)) {
    return {
      decision: "recovery_check",
      reason:
        "Sinais preocupantes coincidem (sono baixo + performance caindo + fome alta OU perda muito rápida). Não corte calorias. Pausar cutting + avaliar com profissional é razoável.",
      confidence: 0.9,
      signals: s,
      kcal_target_sugerido: input.kcal_target_atual,
    };
  }

  // 2. RECOVERY (§42). Perda rápida + performance caindo.
  if (
    naonulo(s_perda_pct) &&
    naonulo(input.performance_delta_pct) &&
    s_perda_pct! > 1.2 &&
    input.performance_delta_pct! < -5
  ) {
    return {
      decision: "recovery",
      reason:
        "Perda rápida (>1.2%/sem) + performance caindo. Não reduza calorias — pode ser recuperação incompleta.",
      confidence: 0.8,
      signals: s,
      kcal_target_sugerido: input.kcal_target_atual,
    };
  }

  // 3. KEEP_COURSE (§42). Perda dentro da faixa saudável.
  if (
    naonulo(s_perda_pct) &&
    s_perda_pct! >= 0.35 &&
    s_perda_pct! <= 0.85 &&
    (input.performance_delta_pct == null || input.performance_delta_pct >= -3)
  ) {
    return {
      decision: "keep_course",
      reason:
        `Progresso dentro do esperado (${s_perda_pct!.toFixed(2)}%/sem). Mantenha rota.`,
      confidence: 0.85,
      signals: s,
      kcal_target_sugerido: input.kcal_target_atual,
    };
  }

  // 4. SMALL_ADJUSTMENT (§42). Estagnou 2+ semanas com alta aderência.
  if (
    input.dias_na_fase >= 14 &&
    naonulo(s_perda_pct) &&
    s_perda_pct! < 0.15 &&
    naonulo(input.aderencia_pct) &&
    input.aderencia_pct! > 85
  ) {
    const sugerido = ajustarComPiso(input.kcal_target_atual, -125, input.kcal_min_floor);
    return {
      decision: "small_adjustment",
      reason:
        "14+ dias sem tendência de queda com alta aderência. Considere -100 a -150 kcal.",
      confidence: 0.7,
      signals: s,
      kcal_target_sugerido: sugerido,
    };
  }

  // 5. PHASE_REVIEW (§44). Fase longa ou alvo próximo.
  if (
    input.dias_na_fase >= 42 &&
    (bfAtingiu(input) || cinturaAtingiu(input))
  ) {
    return {
      decision: "phase_review",
      reason:
        "42+ dias na fase e alvo próximo (BF ou cintura). Considere transição pra Maintenance.",
      confidence: 0.75,
      signals: s,
      kcal_target_sugerido: input.kcal_target_atual,
    };
  }

  // 6. WATCH — default. Não age; observa.
  return {
    decision: "watch",
    reason: "Sinais mistos ou dados insuficientes. Continue observando.",
    confidence: 0.4,
    signals: s,
    kcal_target_sugerido: input.kcal_target_atual,
  };
}

// ---------- helpers ----------

function naonulo(v: number | null | undefined): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function perdaPct(atual: number | null, passada: number | null): number | null {
  if (!naonulo(atual) || !naonulo(passada) || passada === 0) return null;
  return ((passada - atual) / passada) * 100;
}

function bfAtingiu(i: CutInput): boolean {
  return (
    naonulo(i.bf_estimado_pct) &&
    naonulo(i.bf_target_pct) &&
    i.bf_estimado_pct! <= i.bf_target_pct!
  );
}

function cinturaAtingiu(i: CutInput): boolean {
  return naonulo(i.cintura_delta_total_cm) && i.cintura_delta_total_cm! >= 4;
}

/**
 * §72 — GUARDRAIL de segurança. Qualquer combinação preocupante ativa
 * RECOVERY_CHECK e trava o engine de propor mais déficit.
 *
 * Combos:
 *   - s_perf < -10 sustentado (usa último sinal como proxy no PR4)
 *   - fome ≥ 8/10 média por 7 dias
 *   - sono < 5.5h médio + perf < -8 (D.5 §1 original)
 *   - perda > 1.5% média/semana
 */
function guardrail72(i: CutInput): boolean {
  const perda = perdaPct(i.media7d_atual, i.media7d_passada);

  const combo_sono_perf_fome =
    naonulo(i.sono_h_medio) && i.sono_h_medio! < 5.5 &&
    naonulo(i.performance_delta_pct) && i.performance_delta_pct! < -8 &&
    naonulo(i.fome_media) && i.fome_media! >= 8;

  const perf_muito_baixa =
    naonulo(i.performance_delta_pct) && i.performance_delta_pct! < -10;

  const fome_persistente =
    naonulo(i.fome_media) && i.fome_media! >= 8;

  const perda_perigosa = naonulo(perda) && perda! > 1.5;

  return combo_sono_perf_fome || perf_muito_baixa || perda_perigosa ||
    // Fome persistente sozinha não trava, mas combinada com sono baixo trava:
    (fome_persistente && naonulo(i.sono_h_medio) && i.sono_h_medio! < 6);
}

/**
 * Aplica delta ao alvo calórico respeitando o piso §72.
 * Nunca retorna abaixo de `piso` (se piso for null, aceita qualquer valor).
 */
export function ajustarComPiso(
  atual: number | null,
  delta: number,
  piso: number | null,
): number | null {
  if (!naonulo(atual)) return null;
  const alvo = atual + delta;
  if (naonulo(piso) && alvo < piso!) return piso!;
  return alvo;
}
