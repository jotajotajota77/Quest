// ============================================================
// Engine de bônus de personagem — genérica, só Stamina ativa no V1. (TRAVA)
// ------------------------------------------------------------
//  * O bônus é ESTRITAMENTE ADITIVO sobre a base protegida, jamais redirect.
//  * Um personagem só soma se o registro for do SEU comportamento-alvo.
//    Caso contrário soma 0 — NUNCA subtrai nem desliga a base.
//  * No V2 basta marcar `ativo` os personagens dos outros comportamentos; a
//    engine já os trata sem refac. No V1 só o de Stamina/dieta está ativo.
// ============================================================

import type { Comportamento, Personagem } from "@/lib/types";

/** Comportamentos cujo bônus está ARMADO no V1. */
const COMPORTAMENTOS_ATIVOS: ReadonlySet<Comportamento> = new Set<Comportamento>([
  "dieta",
]);

/**
 * Bônus aditivo do personagem para um comportamento.
 * Retorna sempre >= 0 (nunca penaliza).
 */
export function bonusPersonagem(
  personagem: Personagem | null,
  comportamento: Comportamento,
): number {
  if (!personagem) return 0;
  if (!personagem.ativo) return 0;
  // Comportamento inerte no V1 (treino/leitura/dança) → bônus desarmado.
  if (!COMPORTAMENTOS_ATIVOS.has(comportamento)) return 0;
  // Personagem de outro alvo não soma — mas também não subtrai a base.
  if (personagem.comportamento_alvo !== comportamento) return 0;

  const { tipo, magnitude } = personagem.bonus;
  if (tipo !== "aditivo") return 0; // defesa: só aceitamos camada aditiva
  return Math.max(0, Math.floor(magnitude));
}
