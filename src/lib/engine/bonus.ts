// ============================================================
// Bônus de personagem — percentual ADITIVO, todos os 4 vivos. (TRAVA 3)
// ------------------------------------------------------------
//  * +25% no atributo do comportamento do protagonista, só no dia dele.
//  * ESTRITAMENTE ADITIVO sobre a base protegida, jamais redirecionamento.
//  * Um personagem só soma se o registro for da SUA família. Caso contrário
//    soma 0 — NUNCA subtrai nem reduz a base de nenhum comportamento.
//  * Magnitude igual (+25%) para os quatro, de propósito: seleção por
//    identidade/lore, não por min-max.
// ============================================================

import type { Comportamento, Personagem } from "@/lib/types";
import { familiaDe } from "@/lib/comportamentos";

/**
 * Multiplicador aditivo do personagem para um comportamento (ex.: 0.25).
 * Retorna 0 quando não se aplica — nunca penaliza.
 */
export function pctBonus(
  personagem: Personagem | null,
  comportamento: Comportamento,
): number {
  if (!personagem || !personagem.ativo || !personagem.desbloqueado) return 0;
  if (!personagem.bonus) return 0; // slot bloqueado / sem bônus definido
  // Personagem de outra família não soma — mas também não subtrai a base.
  if (personagem.comportamento_alvo !== familiaDe(comportamento)) return 0;
  if (personagem.bonus.tipo !== "pct") return 0;
  return Math.max(0, personagem.bonus.valor);
}
