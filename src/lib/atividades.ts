// ============================================================
// Fontes abertas de Stamina (v8) — cardio/vôlei/resistência, 1-toque. E pesos de
// esforço padrão por comportamento (embutidos; o usuário não calcula nada).
// Existentes = 1.0 (economia atual intacta); atividades de fôlego pesam mais.
// ============================================================

import type { Comportamento } from "@/lib/types";

export interface AtividadeStamina {
  comportamento: Comportamento;
  label: string;
  emoji: string;
}

export const ATIVIDADES_STAMINA: AtividadeStamina[] = [
  { comportamento: "cardio", label: "Cardio", emoji: "🏃" },
  { comportamento: "volei", label: "Vôlei", emoji: "🏐" },
  { comportamento: "resistencia", label: "Resistência", emoji: "🚴" },
];

/** Peso de esforço padrão por comportamento (multiplicador do ganho). */
export const PESO_ESFORCO_PADRAO: Record<Comportamento, number> = {
  treino: 1,
  nutri_refeicao: 1,
  nutri_agua: 1,
  cardio: 1.2,
  volei: 1.1,
  resistencia: 1.2,
};

export function pesoEsforcoDe(c: Comportamento): number {
  return PESO_ESFORCO_PADRAO[c] ?? 1;
}
