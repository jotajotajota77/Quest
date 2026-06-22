// ============================================================
// Ganchos de controle do sistema.
// ------------------------------------------------------------
//  * Porteiro de robustez do fading: AGORA ARMADO (os outros comportamentos
//    existem, há sinal a ler).
//  * Convocação da aba-espelho: ainda DESARMADO (ativação ≈ 1 flag no futuro).
// ============================================================

import type { Familia } from "@/lib/types";

// ─── Porteiro de robustez do fading (ARMADO) — TRAVA 5 ──────
// Antes de RAREAR (down-shift) o esquema da dieta, exige prova de que a dieta
// sobreviveu a um "dia ruim" NATURAL — lido das perturbações de OUTROS
// comportamentos (rotina de outra aba furada). Sem evidência de robustez,
// segura o afinamento (o reforço continua denso).
export const PORTEIRO_ROBUSTEZ_ATIVO = true;

export interface SinalRobustez {
  /** Houve um dia ruim natural (rotina de outra aba furou) na janela? */
  houvePerturbacao: boolean;
  /** Nesse(s) dia(s) ruim(ns), a dieta ainda foi registrada? */
  dietaSobreviveu: boolean;
}

/**
 * @returns true se o afinamento (rarear o reforço da dieta) está liberado.
 * Com o porteiro armado: só libera se a dieta provou robustez a um dia ruim.
 */
export function porteiroPermiteAfinar(sinal: SinalRobustez): boolean {
  if (!PORTEIRO_ROBUSTEZ_ATIVO) return true;
  return sinal.houvePerturbacao && sinal.dietaSobreviveu;
}

// ─── Convocação da aba-espelho (DESARMADO) ──────────────────
// No futuro: puxaria o usuário para a aba-espelho quando COMPORTAMENTO e
// RESULTADO divergem (ex.: dieta consistente há ~3 semanas + cintura parada).
// Hoje DESARMADO: a aba-espelho é 100% passiva — nada convoca o usuário.
export const CONVOCACAO_MIRROR_ATIVA = false;

export interface SinalDivergencia {
  diasConsistentes: number;
  resultadoEstagnado: boolean;
  familia: Familia;
}

export interface ConvocacaoDecision {
  convocar: boolean;
  motivo: string;
}

export function avaliarConvocacaoEspelho(
  _sinal: SinalDivergencia,
): ConvocacaoDecision {
  if (!CONVOCACAO_MIRROR_ATIVA) {
    return { convocar: false, motivo: "desarmado" };
  }
  // --- Lógica futura (inerte enquanto a flag estiver false) ---
  // const convocar = _sinal.diasConsistentes >= 21 && _sinal.resultadoEstagnado;
  // return { convocar, motivo: convocar ? "divergencia" : "alinhado" };
  return { convocar: false, motivo: "desarmado" };
}
