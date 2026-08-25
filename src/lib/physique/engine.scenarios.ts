// ============================================================
// Adaptive Physique RPG — cenários de teste do engine CUT (PR4).
// ------------------------------------------------------------
// Não é um runner (o projeto ainda não tem vitest). Cada cenário é um
// {input, esperado}. Serve como spec-executável: quem for adicionar
// regra nova roda `verificarCenarios()` mentalmente ou via script.
//
// Cobre os 6 branches + guardrails §72 + edge cases nulos.
// ============================================================

import { decideCut, type CutInput, type Decision } from "./engine";

interface Cenario {
  nome: string;
  input: CutInput;
  esperado: Decision;
  /** Se true, o kcal_target_sugerido tem que respeitar o piso. */
  respeitaPiso?: boolean;
}

const base: CutInput = {
  media7d_atual: null,
  media7d_passada: null,
  cintura_delta_cm: null,
  performance_delta_pct: null,
  sono_h_medio: null,
  fome_media: null,
  aderencia_pct: null,
  dias_na_fase: 30,
  kcal_min_floor: 1700,
  kcal_target_atual: 1900,
  bf_estimado_pct: null,
  bf_target_pct: null,
  cintura_delta_total_cm: null,
};

export const CENARIOS: Cenario[] = [
  {
    nome: "keep_course: perda 0.5%/sem, perf ok",
    input: { ...base, media7d_atual: 79, media7d_passada: 79.4, performance_delta_pct: 0 },
    esperado: "keep_course",
  },
  {
    nome: "keep_course: perda 0.80%/sem próxima ao limite",
    input: { ...base, media7d_atual: 79, media7d_passada: 79.64, performance_delta_pct: -2 },
    esperado: "keep_course",
  },
  {
    nome: "recovery_check: perda 1.9%/sem + perf -8% (guardrail §72)",
    input: { ...base, media7d_atual: 78.5, media7d_passada: 80.0, performance_delta_pct: -8 },
    esperado: "recovery_check",
  },
  {
    nome: "recovery: perda 1.3%/sem + perf -7%",
    input: { ...base, media7d_atual: 79, media7d_passada: 80.04, performance_delta_pct: -7 },
    esperado: "recovery",
  },
  {
    nome: "small_adjustment: 20d na fase sem tendência, aderência 90%",
    input: { ...base, dias_na_fase: 20, media7d_atual: 79, media7d_passada: 79.05, aderencia_pct: 90 },
    esperado: "small_adjustment",
    respeitaPiso: true,
  },
  {
    nome: "small_adjustment NÃO ativa antes de 14 dias",
    input: { ...base, dias_na_fase: 10, media7d_atual: 79, media7d_passada: 79.05, aderencia_pct: 92 },
    esperado: "watch",
  },
  {
    nome: "phase_review: 50 dias + bf abaixo do alvo",
    input: { ...base, dias_na_fase: 50, media7d_atual: 76, media7d_passada: 76.2, bf_estimado_pct: 12, bf_target_pct: 13 },
    esperado: "phase_review",
  },
  {
    nome: "phase_review: 60d + cintura caiu 5cm total",
    input: { ...base, dias_na_fase: 60, cintura_delta_total_cm: 5, media7d_atual: 78, media7d_passada: 78.2 },
    esperado: "phase_review",
  },
  {
    nome: "watch: sinais mistos, sem dados suficientes",
    input: { ...base },
    esperado: "watch",
  },
  {
    nome: "watch: perda 0.2%/sem — nem KEEP nem AJUSTE",
    input: { ...base, media7d_atual: 79.5, media7d_passada: 79.66 },
    esperado: "watch",
  },
  // §72 GUARDRAILS
  {
    nome: "§72 guardrail: sono 5h + perf -10% + fome 9",
    input: { ...base, sono_h_medio: 5, performance_delta_pct: -10, fome_media: 9 },
    esperado: "recovery_check",
    respeitaPiso: true,
  },
  {
    nome: "§72 guardrail: perf -12% (sozinha basta)",
    input: { ...base, performance_delta_pct: -12 },
    esperado: "recovery_check",
  },
  {
    nome: "§72 guardrail: perda > 1.5%/sem",
    input: { ...base, media7d_atual: 78, media7d_passada: 79.5 },
    esperado: "recovery_check",
  },
  {
    nome: "§72 guardrail: fome 8/10 + sono 5h",
    input: { ...base, fome_media: 8, sono_h_medio: 5 },
    esperado: "recovery_check",
  },
  {
    nome: "§72 NÃO dispara com fome 8 sozinha se sono ok",
    input: { ...base, fome_media: 8, sono_h_medio: 7, media7d_atual: 79, media7d_passada: 79.4, performance_delta_pct: 0 },
    esperado: "keep_course",
  },
  {
    nome: "recovery_check bloqueia phase_review",
    input: {
      ...base,
      dias_na_fase: 60,
      cintura_delta_total_cm: 5,
      sono_h_medio: 5,
      fome_media: 9,
      performance_delta_pct: -10,
    },
    esperado: "recovery_check",
  },
  {
    nome: "keep_course com null em sono e fome (não trava)",
    input: { ...base, media7d_atual: 79, media7d_passada: 79.4 },
    esperado: "keep_course",
  },
  {
    nome: "small_adjustment sugerido nunca abaixo do piso",
    input: { ...base, kcal_target_atual: 1750, kcal_min_floor: 1700, dias_na_fase: 20, media7d_atual: 79, media7d_passada: 79.05, aderencia_pct: 90 },
    esperado: "small_adjustment",
    respeitaPiso: true,
  },
  {
    nome: "peso null: sem s_perda_pct → watch",
    input: { ...base, aderencia_pct: 95, dias_na_fase: 20 },
    esperado: "watch",
  },
  {
    nome: "recovery com performance apenas negativa não trava keep se perda ok",
    input: { ...base, media7d_atual: 79, media7d_passada: 79.4, performance_delta_pct: -2 },
    esperado: "keep_course",
  },
  {
    nome: "aderência baixa impede small_adjustment",
    input: { ...base, dias_na_fase: 20, media7d_atual: 79, media7d_passada: 79.05, aderencia_pct: 60 },
    esperado: "watch",
  },
];

/**
 * Verifica todos os cenários. Retorna { passou, falhou[] }. Chamável
 * de um script tsx futuro (ou copy-paste no console do server).
 */
export function verificarCenarios(): {
  passou: number;
  falhou: { nome: string; esperado: Decision; recebido: Decision; motivo: string }[];
} {
  const falhou: { nome: string; esperado: Decision; recebido: Decision; motivo: string }[] = [];
  let passou = 0;
  for (const c of CENARIOS) {
    const r = decideCut(c.input);
    if (r.decision !== c.esperado) {
      falhou.push({ nome: c.nome, esperado: c.esperado, recebido: r.decision, motivo: `decision mismatch — reason: ${r.reason}` });
      continue;
    }
    if (c.respeitaPiso && c.input.kcal_min_floor != null && r.kcal_target_sugerido != null) {
      if (r.kcal_target_sugerido < c.input.kcal_min_floor) {
        falhou.push({ nome: c.nome, esperado: c.esperado, recebido: r.decision, motivo: `piso violado: ${r.kcal_target_sugerido} < ${c.input.kcal_min_floor}` });
        continue;
      }
    }
    passou++;
  }
  return { passou, falhou };
}
