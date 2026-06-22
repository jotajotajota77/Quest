// Analisador semanal — passivo: lê os logs dos últimos 7 dias e sugere o foco
// da próxima semana (a aba menos registrada). Nada de input; só leitura.
import type { Familia, LogRow } from "@/lib/types";
import { familiaDe, FAMILIAS, FAMILIAS_ORDEM } from "@/lib/comportamentos";

export interface AnaliseSemana {
  contagem: Record<Familia, number>;
  maisFraca: Familia;
  total: number;
  sugestao: string;
}

export function analisarSemana(logs: LogRow[]): AnaliseSemana {
  const contagem: Record<Familia, number> = {
    treino: 0,
    nutri: 0,
    leitura: 0,
    danca: 0,
  };
  for (const l of logs) contagem[familiaDe(l.comportamento)]++;

  let maisFraca: Familia = "nutri";
  for (const f of FAMILIAS_ORDEM) {
    if (contagem[f] < contagem[maisFraca]) maisFraca = f;
  }
  const total = FAMILIAS_ORDEM.reduce((a, f) => a + contagem[f], 0);
  return {
    contagem,
    maisFraca,
    total,
    sugestao: `Próxima semana: reforce ${FAMILIAS[maisFraca].label} — foi a aba menos registrada (${contagem[maisFraca]}×).`,
  };
}
