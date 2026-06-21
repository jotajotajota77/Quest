// ============================================================
// Motor de ganho — base protegida + bônus aditivo.  (TRAVA)
// ------------------------------------------------------------
//   ganho_final = base_protegida(comportamento)
//               + bonus_personagem_se_aplicável(comportamento)
//
//  * A base protegida roda TODO dia, integral, independente do personagem.
//  * Bônus é uma camada EXTRA por cima. Nenhum personagem subtrai a base de
//    nenhum comportamento. Escolher um personagem que não é o de Stamina NÃO
//    reduz o reforço da dieta — só deixa de somar o bônus dele.
// ============================================================

import type { Comportamento, GainResult, Personagem } from "@/lib/types";
import { bonusPersonagem } from "@/lib/engine/bonus";

/**
 * Base protegida por comportamento. Nunca zero para um comportamento ativo,
 * nunca função do personagem escolhido. V1 só tem 'dieta'.
 */
const BASE_PROTEGIDA: Record<Comportamento, number> = {
  dieta: 10,
};

export function baseProtegida(comportamento: Comportamento): number {
  return BASE_PROTEGIDA[comportamento] ?? 0;
}

/**
 * Calcula o ganho de um registro. `personagemDoDia` pode ser null (nenhuma
 * seleção) — a base ainda assim é aplicada integralmente.
 */
export function calcularGanho(
  comportamento: Comportamento,
  personagemDoDia: Personagem | null,
): GainResult {
  const base = baseProtegida(comportamento);
  const bonus = bonusPersonagem(personagemDoDia, comportamento);
  return { base, bonus, total: base + bonus };
}

// ─── Progressão única do usuário (elo derivado de xp) ───────
// O elo pertence ao USUÁRIO, não ao personagem. Uma única curva.

/** XP acumulado necessário para alcançar um dado elo. Curva quadrática suave. */
export function xpParaElo(elo: number): number {
  return 100 * (elo - 1) * elo; // elo 1 = 0xp, 2 = 200, 3 = 600, ...
}

/** Resolve o elo a partir do XP total. */
export function eloDeXp(xp: number): number {
  let elo = 1;
  while (xp >= xpParaElo(elo + 1)) elo++;
  return elo;
}
