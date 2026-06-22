// ============================================================
// Motor de ganho — base protegida + bônus aditivo (+25%). (TRAVA 3)
// ------------------------------------------------------------
//   ganho_final = base(comportamento)
//               + round(base * 0.25) se o protagonista do dia favorece
//                                    a família desse comportamento
//
//  * A base protegida roda TODO dia, integral, independente do personagem.
//  * Escolher um personagem nunca reduz o ganho de nenhum comportamento.
//  * Base igual para os 4 (magnitude do bônus também) — seleção por identidade.
// ============================================================

import type { Comportamento, GainResult, Personagem } from "@/lib/types";
import { pctBonus } from "@/lib/engine/bonus";

/** Base protegida por registro. Igual para os 4 comportamentos. */
const BASE = 20;

export function baseProtegida(_comportamento: Comportamento): number {
  return BASE;
}

export function calcularGanho(
  comportamento: Comportamento,
  personagemDoDia: Personagem | null,
): GainResult {
  const base = baseProtegida(comportamento);
  const bonus = Math.round(base * pctBonus(personagemDoDia, comportamento));
  return { base, bonus, total: base + bonus };
}

// ─── Progressão ÚNICA do jogador (elo derivado de xp) ───────
// O elo pertence ao JOGADOR, não ao personagem. Uma única curva, alimentada
// pelos quatro atributos somados em XP.

export function xpParaElo(elo: number): number {
  return 100 * (elo - 1) * elo; // elo 1 = 0xp, 2 = 200, 3 = 600, ...
}

export function eloDeXp(xp: number): number {
  let elo = 1;
  while (xp >= xpParaElo(elo + 1)) elo++;
  return elo;
}
