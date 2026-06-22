// ============================================================
// Fading automático de esquema — passivo e REVERSÍVEL. (TRAVA 5)
// ------------------------------------------------------------
// SÓ a Nutri usa este motor (assimetria de reforço — TRAVA 2).
//  * Critério de transição é DESEMPENHO, nunca calendário.
//  * Sinal de estabilidade = latência baixa + variabilidade baixa (passivos).
//  * Começa em CRF (instala) e rareia (FR2 → FR3 → ...) quando estável.
//  * RE-ADENSA sozinho se a adesão cai — não é catraca.
//  * O PORTEIRO de robustez (armado) pode vetar o afinamento: o flag
//    `porteiroPermite` vem computado de fora (lê perturbação de outras abas).
// ============================================================

import type { Esquema, ScheduleState } from "@/lib/types";
import type { SinalEstabilidade } from "@/lib/engine/latency";

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

export const LIMIARES = {
  minAmostras: 6,
  latenciaEstavelMin: 120,
  variabilidadeEstavelMin: 90,
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
 * Decide a próxima posição na ladder a partir do estado e do sinal de
 * estabilidade. NÃO consulta calendário/tempo decorrido.
 *
 * @param porteiroPermite resultado do porteiro de robustez (lê perturbação de
 *        outras abas). Só afeta o AFINAR; re-adensar nunca é travado.
 */
export function decidirFading(
  estado: ScheduleState,
  sinal: SinalEstabilidade,
  porteiroPermite: boolean,
): DecisaoFading {
  const nivelAtual = clampNivel(estado.nivel_afinamento);

  if (sinal.n < LIMIARES.minAmostras) {
    return manter(nivelAtual, `amostra insuficiente (${sinal.n}/${LIMIARES.minAmostras})`);
  }

  const instavel =
    sinal.mediaLatenciaMin > LIMIARES.latenciaInstavelMin ||
    sinal.variabilidadeMin > LIMIARES.variabilidadeInstavelMin;

  // RE-ADENSAR tem prioridade e nunca é travado pelo porteiro.
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
    if (!porteiroPermite) {
      return manter(nivelAtual, "porteiro de robustez segurou o afinamento (sem prova de dia ruim)");
    }
    const nivelNovo = clampNivel(nivelAtual + 1);
    return {
      direcao: "afinar",
      esquemaNovo: LADDER[nivelNovo],
      nivelNovo,
      motivo: `estável + robusta (lat=${sinal.mediaLatenciaMin.toFixed(0)}min, var=${sinal.variabilidadeMin.toFixed(0)}min) → afina`,
    };
  }

  return manter(nivelAtual, "dentro da faixa neutra");
}

function manter(nivel: number, motivo: string): DecisaoFading {
  return { direcao: "manter", esquemaNovo: LADDER[nivel], nivelNovo: nivel, motivo };
}

/**
 * Dado o esquema vigente e quantos registros já passaram desde a última
 * música, decide se ESTE registro dispara a faixa cheia.
 */
export function deveTocarMusica(
  esquema: Esquema,
  registrosDesdeUltimaMusica: number,
): boolean {
  return registrosDesdeUltimaMusica + 1 >= razaoEsquema(esquema);
}
