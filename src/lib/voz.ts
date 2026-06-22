// ============================================================
// Voz contextual / body-doubling — o PROTAGONISTA do dia "fala" na home.
// ------------------------------------------------------------
// A mensagem muda por streak / tempo desde a última atividade / hora do dia /
// modo névoa. Crucial: RETORNO SEM JULGAMENTO após ausência. Identidade do
// roster como reforçador — não narrativa lenta como motor.
// ============================================================

import type { Personagem } from "@/lib/types";
import type { StreakInfo } from "@/lib/engine/streak";

export interface ContextoVoz {
  personagem: Personagem | null;
  streak: StreakInfo;
  fogHoje: boolean;
  hora: number; // 0..23
  registrosHoje: number;
}

function nome(p: Personagem | null): string {
  return p?.nome ?? "VHYX";
}

export function mensagemContextual(ctx: ContextoVoz): string {
  const { personagem, streak, fogHoje, hora, registrosHoje } = ctx;
  const quem = nome(personagem);

  // Modo névoa: tom de recolhimento, sem julgamento (TRAVA névoa).
  if (fogHoje) {
    return `Operador em recolhimento. ${quem} entende. O streak está protegido — volte amanhã inteiro.`;
  }

  // Retorno após ausência: sem julgamento (o item mais importante).
  const fora = streak.diasDesdeUltimaAtividade;
  if (fora !== null && fora >= 2 && registrosHoje === 0) {
    return `${fora} dias fora. Sem julgamento. Bom retorno — um toque já reacende.`;
  }

  // Já registrou hoje: reforça a identidade.
  if (registrosHoje > 0) {
    if (streak.streak >= 7) {
      return `${streak.streak} dias seguidos. ${quem}: "Isso é constância. O ferro responde."`;
    }
    return `${registrosHoje} registro(s) hoje. ${quem} marca presença com você.`;
  }

  // Ainda não registrou hoje — empurra leve conforme a hora.
  if (hora >= 21) {
    return `Ainda dá tempo. Um toque antes de dormir mantém a linha viva.`;
  }
  if (hora <= 10) {
    return `Bom dia. ${quem} está no seu canto — comece pequeno, um toque.`;
  }
  if (streak.streak > 0) {
    return `Streak de ${streak.streak}. Mantém com um registro qualquer hoje.`;
  }
  return `${quem} no seu canto. Um toque começa o dia.`;
}
