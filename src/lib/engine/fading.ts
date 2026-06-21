// ============================================================
// Fading automático de esquema — passivo e REVERSÍVEL. (TRAVA)
// ------------------------------------------------------------
//  * Critério de transição é DESEMPENHO, nunca calendário.
//  * Sinal de estabilidade = latência baixa + variabilidade baixa, ambos
//    derivados do timestamp (captura passiva, ver latency.ts).
//  * Começa em CRF (instala) e rareia (FR2 → FR3 → ...) quando estável.
//  * RE-ADENSA sozinho se a adesão cai após um afinamento — não é catraca.
//  * O porteiro de robustez (gates.ts) pode vetar o afinamento — DESARMADO no
//    V1, então nunca bloqueia agora; a estrutura existe para o V2.
// ============================================================

import type { Esquema, ScheduleState } from "@/lib/types";
import type { SinalEstabilidade } from "@/lib/engine/latency";
import { porteiroPermiteAfinar } from "@/lib/engine/gates";

/** Ladder do mais denso (índice 0 = CRF) ao mais magro. */
export const LADDER: readonly Esquema[] = ["CRF", "FR2", "FR3", "FR5", "FR8"];

/** Razão do esquema: quantos registros por 1 música. CRF = 1 (todo registro). */
export function razaoEsquema(esquema: Esquema): number {
  switch (esquema) {
    case "CRF":
      return 1;
    case "FR2":
      return 2;
    case "FR3":
      return 3;
    case "FR5":
      return 5;
    case "FR8":
      return 8;
  }
}

/**
 * Limiares de estabilidade. Ajustáveis. Mantidos conservadores para não
 * afinar cedo demais (instalação > economia de reforço).
 */
export const LIMIARES = {
  /** Janela móvel mínima de registros para decidir qualquer transição. */
  minAmostras: 6,
  /** Latência média (min) abaixo da qual consideramos "pronto na hora". */
  latenciaEstavelMin: 120,
  /** Variabilidade (min) abaixo da qual a latência é "consistente". */
  variabilidadeEstavelMin: 90,
  /** Acima destes, a adesão está frouxa → re-adensar. */
  latenciaInstavelMin: 240,
  variabilidadeInstavelMin: 180,
} as const;

export type DirecaoFading = "afinar" | "readensar" | "manter";

export interface DecisaoFading {
  direcao: DirecaoFading;
  esquemaNovo: Esquema;
  nivelNovo: number;
  motivo: string;
}

function clampNivel(n: number): number {
  return Math.max(0, Math.min(LADDER.length - 1, n));
}

/**
 * Decide a próxima posição na ladder a partir do estado atual e do sinal de
 * estabilidade da janela móvel. NÃO consulta calendário/tempo decorrido.
 *
 * @param contexto passado adiante ao porteiro (gates) — no V1 ele ignora e
 *                 sempre libera, mas a assinatura já está pronta para o V2.
 */
export function decidirFading(
  estado: ScheduleState,
  sinal: SinalEstabilidade,
  contexto: { user_id: string; comportamento: ScheduleState["comportamento"] },
): DecisaoFading {
  const nivelAtual = clampNivel(estado.nivel_afinamento);

  // Amostra insuficiente: não mexe (nem afina nem readensa por ruído).
  if (sinal.n < LIMIARES.minAmostras) {
    return {
      direcao: "manter",
      esquemaNovo: LADDER[nivelAtual],
      nivelNovo: nivelAtual,
      motivo: `amostra insuficiente (${sinal.n}/${LIMIARES.minAmostras})`,
    };
  }

  const instavel =
    sinal.mediaLatenciaMin > LIMIARES.latenciaInstavelMin ||
    sinal.variabilidadeMin > LIMIARES.variabilidadeInstavelMin;

  // RE-ADENSAR tem prioridade: se a adesão caiu, volta para esquema mais denso.
  // Reversível e imediato — protege a instalação. Porteiro NÃO trava re-adensar.
  if (instavel && nivelAtual > 0) {
    const nivelNovo = clampNivel(nivelAtual - 1);
    return {
      direcao: "readensar",
      esquemaNovo: LADDER[nivelNovo],
      nivelNovo,
      motivo: `adesão frouxa (lat=${sinal.mediaLatenciaMin.toFixed(0)}min, var=${sinal.variabilidadeMin.toFixed(0)}min) → re-adensa`,
    };
  }

  const estavel =
    sinal.mediaLatenciaMin <= LIMIARES.latenciaEstavelMin &&
    sinal.variabilidadeMin <= LIMIARES.variabilidadeEstavelMin;

  if (estavel && nivelAtual < LADDER.length - 1) {
    // Porteiro de robustez (DESARMADO no V1) — sempre libera agora.
    if (!porteiroPermiteAfinar(contexto)) {
      return {
        direcao: "manter",
        esquemaNovo: LADDER[nivelAtual],
        nivelNovo: nivelAtual,
        motivo: "porteiro de robustez vetou o afinamento",
      };
    }
    const nivelNovo = clampNivel(nivelAtual + 1);
    return {
      direcao: "afinar",
      esquemaNovo: LADDER[nivelNovo],
      nivelNovo,
      motivo: `estável (lat=${sinal.mediaLatenciaMin.toFixed(0)}min, var=${sinal.variabilidadeMin.toFixed(0)}min) → afina`,
    };
  }

  return {
    direcao: "manter",
    esquemaNovo: LADDER[nivelAtual],
    nivelNovo: nivelAtual,
    motivo: "dentro da faixa neutra",
  };
}

/**
 * Dado o esquema vigente e quantos registros já passaram desde a última
 * música, decide se ESTE registro dispara a faixa cheia.
 * CRF → sempre; FR2 → a cada 2; etc.
 */
export function deveTocarMusica(
  esquema: Esquema,
  registrosDesdeUltimaMusica: number,
): boolean {
  return registrosDesdeUltimaMusica + 1 >= razaoEsquema(esquema);
}
