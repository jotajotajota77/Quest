// ============================================================
// Goal engine (v9) — progresso do cutting (17,8%→13% BF até 09/09/2026).
// ------------------------------------------------------------
// Puro/sem I/O (como tier.ts/streak.ts): recebe `meta` (lib/data.ts::
// garantirMeta) + o histórico recente de corpo_real (lib/data.ts::
// corpoRealRecente) já carregados, devolve os números prontos pro goal
// dashboard (home) e pro resumo do Espelho.
// ============================================================

import type { CorpoRealPonto, Meta } from "@/lib/types";

const MS_DIA = 86_400_000;
const TOTAL_SEMANAS = 8;
/** Ritmo necessário pra bater a meta num déficit sustentável (do prompt). */
export const RITMO_NECESSARIO_KG_SEMANA = 0.45;

export interface ProgressoMeta {
  diasRestantes: number;
  semanaAtual: number;
  totalSemanas: number;
  pesoAtual: number | null;
  bfAtual: number | null;
  /** 0–100, interpolado por BF (preferencial) ou peso (fallback). Null se sem dado. */
  pctCaminho: number | null;
  /** kg de variação na última semana vs a anterior (negativo = perdendo peso). */
  tendenciaSemanalKg: number | null;
  ritmoNecessarioKg: number;
}

function diasEntre(dataISO: string, agora: Date): number {
  return Math.round(
    (new Date(`${dataISO}T00:00:00Z`).getTime() - agora.getTime()) / MS_DIA,
  );
}

export function diasRestantes(meta: Meta, agora = new Date()): number {
  return diasEntre(meta.data_alvo, agora);
}

export function semanaPrograma(
  meta: Meta,
  agora = new Date(),
): { semana: number; total: number } {
  const desdeInicio = Math.floor(
    (agora.getTime() - new Date(`${meta.data_inicio}T00:00:00Z`).getTime()) / MS_DIA,
  );
  const semana = Math.min(TOTAL_SEMANAS, Math.max(1, Math.floor(desdeInicio / 7) + 1));
  return { semana, total: TOTAL_SEMANAS };
}

function mediaPeso(pontos: CorpoRealPonto[]): number | null {
  const pesos = pontos.map((p) => p.peso).filter((p): p is number => p != null);
  if (!pesos.length) return null;
  return pesos.reduce((a, b) => a + b, 0) / pesos.length;
}

/** Você vs você-passado (TRAVA 8 v9.2) — comparação hoje vs N dias atrás.
 *  Reforço concreto no cutting (invisível no espelho, visível nos números). */
export interface Comparacao {
  peso: { entao: number | null; agora: number | null; delta: number | null };
  bf: { entao: number | null; agora: number | null; delta: number | null };
  diasAtras: number;
}

/** Pega o valor cujo ts está mais próximo do centro alvo (dias atrás), dentro
 *  da tolerância (dias), ignorando pontos nulos. Histórico vem desc por ts. */
function valorEmJanela(
  historico: CorpoRealPonto[],
  agoraMs: number,
  centroDiasAtras: number,
  toleranciaDias: number,
  extrai: (p: CorpoRealPonto) => number | null,
): number | null {
  const alvoMs = agoraMs - centroDiasAtras * MS_DIA;
  const tolMs = toleranciaDias * MS_DIA;
  let melhor: { valor: number; dist: number } | null = null;
  for (const p of historico) {
    const v = extrai(p);
    if (v == null) continue;
    const dist = Math.abs(new Date(p.ts).getTime() - alvoMs);
    if (dist > tolMs) continue;
    if (!melhor || dist < melhor.dist) melhor = { valor: v, dist };
  }
  return melhor?.valor ?? null;
}

export function comparacaoHistorica(
  historico: CorpoRealPonto[],
  agora = new Date(),
  diasAtras = 14,
): Comparacao {
  const agoraMs = agora.getTime();
  const pesoAgora = historico.find((p) => p.peso != null)?.peso ?? null;
  const bfAgora = historico.find((p) => p.gordura_pct != null)?.gordura_pct ?? null;
  const pesoEntao = valorEmJanela(historico, agoraMs, diasAtras, 3, (p) => p.peso);
  const bfEntao = valorEmJanela(historico, agoraMs, diasAtras, 3, (p) => p.gordura_pct);
  const pesoDelta =
    pesoAgora != null && pesoEntao != null
      ? Math.round((pesoAgora - pesoEntao) * 100) / 100
      : null;
  const bfDelta =
    bfAgora != null && bfEntao != null
      ? Math.round((bfAgora - bfEntao) * 100) / 100
      : null;
  return {
    peso: { entao: pesoEntao, agora: pesoAgora, delta: pesoDelta },
    bf: { entao: bfEntao, agora: bfAgora, delta: bfDelta },
    diasAtras,
  };
}

export function progressoMeta(
  meta: Meta,
  historico: CorpoRealPonto[],
  agora = new Date(),
): ProgressoMeta {
  // historico vem mais-recente-primeiro (corpoRealRecente).
  const comPeso = historico.filter((p) => p.peso != null);
  const comBf = historico.filter((p) => p.gordura_pct != null);
  const pesoAtual = comPeso[0]?.peso ?? null;
  const bfAtual = comBf[0]?.gordura_pct ?? null;

  let pctCaminho: number | null = null;
  if (bfAtual != null && meta.bf_inicial !== meta.bf_alvo) {
    const pct = ((meta.bf_inicial - bfAtual) / (meta.bf_inicial - meta.bf_alvo)) * 100;
    pctCaminho = Math.max(0, Math.min(100, Math.round(pct)));
  } else if (pesoAtual != null && comPeso.length > 1) {
    // Fallback: sem BF ainda registrado — usa o peso mais antigo da janela
    // como proxy de "início" (aproximado; some assim que houver BF real).
    const pesoInicial = comPeso[comPeso.length - 1].peso as number;
    if (pesoInicial !== meta.peso_alvo) {
      const pct = ((pesoInicial - pesoAtual) / (pesoInicial - meta.peso_alvo)) * 100;
      pctCaminho = Math.max(0, Math.min(100, Math.round(pct)));
    }
  }

  const agoraMs = agora.getTime();
  const janela = (diasAtrasIni: number, diasAtrasFim: number) =>
    comPeso.filter((p) => {
      const t = new Date(p.ts).getTime();
      return t <= agoraMs - diasAtrasIni * MS_DIA && t > agoraMs - diasAtrasFim * MS_DIA;
    });
  const mRecente = mediaPeso(janela(0, 7));
  const mAnterior = mediaPeso(janela(7, 14));
  const tendenciaSemanalKg =
    mRecente != null && mAnterior != null
      ? Math.round((mRecente - mAnterior) * 100) / 100
      : null;

  const semana = semanaPrograma(meta, agora);
  return {
    diasRestantes: diasRestantes(meta, agora),
    semanaAtual: semana.semana,
    totalSemanas: semana.total,
    pesoAtual,
    bfAtual,
    pctCaminho,
    tendenciaSemanalKg,
    ritmoNecessarioKg: RITMO_NECESSARIO_KG_SEMANA,
  };
}
