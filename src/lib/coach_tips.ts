// ============================================================
// Fat Loss Coach — tips funcionais sobre os últimos 30 dias de logs RICOS.
// ------------------------------------------------------------
// Cada tip = achado real + ação concreta + severidade. Opera só sobre dias em
// que o usuário usou o caminho rico (logs com macro). Complementar, nunca
// obrigatório. Pura função (sem rede) — os dados vêm do data layer.
// ============================================================

import type { LogRow } from "@/lib/types";
import { META_KCAL } from "@/lib/alimentos";

export type Severidade = "alta" | "media" | "baixa" | "positiva";

export interface Tip {
  titulo: string;
  acao: string;
  severidade: Severidade;
}

export function gerarTips(
  logs: LogRow[],
  pesoKg: number | null,
  catMap: Map<string, string>,
): Tip[] {
  const dias = new Map<
    string,
    { kcal: number; p: number; c: number; g: number; junk: number }
  >();
  for (const l of logs) {
    const d = l.ts.slice(0, 10);
    const acc = dias.get(d) ?? { kcal: 0, p: 0, c: 0, g: 0, junk: 0 };
    const kcal = Number(l.kcal ?? 0);
    acc.kcal += kcal;
    acc.p += Number(l.proteina ?? 0);
    acc.c += Number(l.carbs ?? 0);
    acc.g += Number(l.gordura ?? 0);
    if (l.food_id && catMap.get(l.food_id) === "doce") acc.junk += kcal;
    dias.set(d, acc);
  }

  const arr = [...dias.values()];
  const n = arr.length;
  if (n === 0) {
    return [
      {
        titulo: "Sem dados ricos ainda",
        acao: "Use o registro detalhado (macros) alguns dias para o coach analisar.",
        severidade: "baixa",
      },
    ];
  }

  const mean = (f: (x: (typeof arr)[number]) => number) =>
    arr.reduce((a, x) => a + f(x), 0) / n;
  const kcalM = mean((x) => x.kcal);
  const pM = mean((x) => x.p);
  const cM = mean((x) => x.c);
  const gM = mean((x) => x.g);
  const junkM = mean((x) => x.junk);

  const tips: Tip[] = [];

  if (pesoKg) {
    const gkg = pM / pesoKg;
    if (gkg < 1.8) {
      tips.push({
        titulo: `Proteína baixa: ${gkg.toFixed(1)} g/kg`,
        acao: `Mire ≥1.8 g/kg (~${Math.round(1.8 * pesoKg)} g/dia). Some uma fonte magra por refeição.`,
        severidade: "alta",
      });
    }
  }

  const junkPct = kcalM > 0 ? (junkM / kcalM) * 100 : 0;
  if (junkPct > 25) {
    tips.push({
      titulo: `Doces = ${junkPct.toFixed(0)}% das kcal`,
      acao: "Troque metade por fruta + proteína: mantém o prazer, corta o excesso.",
      severidade: "media",
    });
  }

  if (kcalM > META_KCAL * 1.1) {
    tips.push({
      titulo: `Acima da meta (~${Math.round(kcalM)} kcal/dia)`,
      acao: `Corte ~${Math.round(kcalM - META_KCAL)} kcal/dia (uma porção de carbo ou gordura).`,
      severidade: "media",
    });
  } else if (kcalM > 0 && kcalM < META_KCAL * 0.85) {
    tips.push({
      titulo: `Abaixo da meta (~${Math.round(kcalM)} kcal/dia)`,
      acao: "Adicione carbo de qualidade ou gordura boa para sustentar treino e recuperação.",
      severidade: "media",
    });
  }

  const fatPct = kcalM > 0 ? ((gM * 9) / kcalM) * 100 : 0;
  if (fatPct > 40) {
    tips.push({
      titulo: `Gordura alta: ${fatPct.toFixed(0)}% das kcal`,
      acao: "Reduza frituras/óleos e redistribua para proteína e carbo.",
      severidade: "baixa",
    });
  }

  const carbPct = kcalM > 0 ? ((cM * 4) / kcalM) * 100 : 0;
  if (carbPct > 60) {
    tips.push({
      titulo: `Carbo alto: ${carbPct.toFixed(0)}% das kcal`,
      acao: "Equilibre com mais proteína; priorize carbo perto do treino.",
      severidade: "baixa",
    });
  }

  if (n >= 4) {
    const sd = Math.sqrt(arr.reduce((a, x) => a + (x.kcal - kcalM) ** 2, 0) / n);
    const cv = kcalM > 0 ? sd / kcalM : 0;
    if (cv > 0.3) {
      tips.push({
        titulo: `Consumo irregular (CV ${(cv * 100).toFixed(0)}%)`,
        acao: "Padronize 2–3 refeições-base; a consistência pesa mais que a perfeição.",
        severidade: "media",
      });
    }
  }

  if (n < 5) {
    tips.push({
      titulo: `Só ${n} dia(s) com macro nos últimos 30`,
      acao: "O coach fica mais preciso com mais registros detalhados — sem pressão.",
      severidade: "baixa",
    });
  }

  if (tips.length === 0) {
    tips.push({
      titulo: "Tá no caminho 💪",
      acao: "Proteína, calorias e variabilidade dentro do esperado. Mantém.",
      severidade: "positiva",
    });
  }

  return tips;
}
