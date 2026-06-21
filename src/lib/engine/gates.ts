// ============================================================
// Ganchos DESARMADOS no V1 — estrutura presente, ativação ≈ 1 flag no V2.
// ------------------------------------------------------------
// NÃO ligue nada disto no V1. Ambos os ganchos existem só para que o V2 seja
// uma troca de flag, sem redesenho. Os corpos "V2" estão escritos como
// referência, mas guardados atrás das flags abaixo (ambas false).
// ============================================================

import type { Comportamento } from "@/lib/types";

// ─── Gancho 1: Convocação da aba-espelho ────────────────────
// V2: puxaria o usuário para a aba-espelho quando COMPORTAMENTO e RESULTADO
// divergem (ex.: dieta consistente há ~3 semanas + cintura parada).
// V1: DESARMADO. A aba-espelho é 100% passiva — nada convoca o usuário.
export const CONVOCACAO_MIRROR_ATIVA = false;

export interface SinalDivergencia {
  /** dias de adesão consistente ao comportamento. */
  diasConsistentes: number;
  /** o resultado corporal relevante (ex.: cintura) está estagnado? */
  resultadoEstagnado: boolean;
}

export interface ConvocacaoDecision {
  convocar: boolean;
  motivo: string;
}

export function avaliarConvocacaoEspelho(
  _sinal: SinalDivergencia,
): ConvocacaoDecision {
  if (!CONVOCACAO_MIRROR_ATIVA) {
    return { convocar: false, motivo: "desarmado_v1" };
  }
  // --- Lógica V2 (inerte enquanto a flag estiver false) ---
  // const convocar = _sinal.diasConsistentes >= 21 && _sinal.resultadoEstagnado;
  // return { convocar, motivo: convocar ? "divergencia_comportamento_resultado" : "alinhado" };
  return { convocar: false, motivo: "desarmado_v1" };
}

// ─── Gancho 2: Porteiro de robustez do fading ───────────────
// V2: o fading só RAREARIA depois de provar que a dieta sobreviveu a um
// "dia ruim" natural — lido de perturbações de OUTROS comportamentos (que não
// existem no V1). A estrutura de leitura fica prevista aqui.
// V1: DESARMADO → sempre libera o afinamento (não bloqueia nada).
export const PORTEIRO_ROBUSTEZ_ATIVO = false;

export interface ContextoPorteiro {
  user_id: string;
  comportamento: Comportamento;
}

/**
 * @returns true se o afinamento (rarear o reforço) está liberado.
 * No V1 sempre true: não há outros comportamentos para ler perturbações.
 */
export function porteiroPermiteAfinar(_ctx: ContextoPorteiro): boolean {
  if (!PORTEIRO_ROBUSTEZ_ATIVO) {
    return true; // inerte: nunca bloqueia no V1
  }
  // --- Lógica V2 (inerte enquanto a flag estiver false) ---
  // const sobreviveuDiaRuim = leuPerturbacaoDeOutrosComportamentos(_ctx);
  // return sobreviveuDiaRuim;
  return true;
}
