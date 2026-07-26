// ============================================================
// Quests / sidequests — camada VR SECUNDÁRIA.
// ------------------------------------------------------------
// v11: quests agora podem ser AUTO (avaliadas contra logs) ou MANUAIS
// (marca via botão — usadas pra TKD e exercícios específicos do dia).
// Quests do dia são um mix: básicas fixas + TKD-flavored do dia + exercício
// específico da musculação do dia.
// ============================================================

import type { Familia } from "@/lib/types";
import { AGUA_META } from "@/lib/protocolo";
import { programaDoDia, tkdMovesDoDia } from "@/lib/programa";

export interface QuestCtx {
  nucleo: Set<Familia>;
  trackersFeitos: number;
  aguaCount: number;
  registrosHoje: number;
}

export interface QuestTemplate {
  id: string;
  tipo: "diaria" | "sidequest" | "tkd" | "musculacao";
  descricao: string;
  xp: number;
  concluida: (c: QuestCtx) => boolean;
  /** Se true, só marca via botão (concluida() nunca dispara). */
  manual?: boolean;
}

// Sempre-válidas (auto-detect)
const BASE: QuestTemplate[] = [
  { id: "nutri_hoje", tipo: "diaria", descricao: "Registre Nutri hoje", xp: 10, concluida: (c) => c.nucleo.has("nutri") },
  { id: "treino_hoje", tipo: "diaria", descricao: "Treine hoje", xp: 10, concluida: (c) => c.nucleo.has("treino") },
  { id: "agua_meta", tipo: "diaria", descricao: "Bata a meta de água", xp: 8, concluida: (c) => c.aguaCount >= AGUA_META },
  { id: "protocolo_meio", tipo: "sidequest", descricao: "Complete metade do protocolo", xp: 15, concluida: (c) => c.nucleo.size + c.trackersFeitos >= 3 },
  { id: "combo", tipo: "sidequest", descricao: "Nutri + Treino no mesmo dia", xp: 18, concluida: (c) => c.nucleo.has("nutri") && c.nucleo.has("treino") },
];

// TKD moves-flavored — só aparecem em dias que têm sessão TKD (seg/qua/sex).
// Descrições geradas dinamicamente a partir dos moves do dia.
function tkdQuestsDoDia(dataISO: string): QuestTemplate[] {
  const [y, m, d] = dataISO.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const moves = tkdMovesDoDia(dow);
  if (moves.length === 0) return [];

  // Pra cada move, uma quest de "faça X reps" — número/xp varia por dia mas
  // fixado por dataISO+move (determinístico).
  return moves.slice(0, 3).map((move, i) => {
    let h = 0;
    for (const c of dataISO + move) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const reps = 3 + (h % 5); // 3-7 reps
    const xp = 10 + i * 2;    // 10/12/14
    return {
      id: `tkd_${move.toLowerCase().replace(/[^a-z0-9]+/g, "_")}_${reps}`,
      tipo: "tkd" as const,
      descricao: `Fazer ${reps} ${move}`,
      xp,
      concluida: () => false,
      manual: true,
    };
  });
}

// Musculação-flavored — pega 1 exercício-alvo do plano do dia. Só nos dias
// com sessão de musculação (seg-sex).
function musculacaoQuestDoDia(dataISO: string): QuestTemplate | null {
  const [y, m, d] = dataISO.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const musc = programaDoDia(dow).sessoes.find((s) => s.tipo === "musculacao");
  if (!musc || !musc.exercicios || musc.exercicios.length === 0) return null;

  // Escolhe determinística um exercício do dia
  let h = 0;
  for (const c of dataISO) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const ex = musc.exercicios[h % musc.exercicios.length];
  const alvoSerie = ex.series ?? "todas as séries";
  return {
    id: `musc_${ex.nome.toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    tipo: "musculacao",
    descricao: `Bater o ${ex.nome} (${alvoSerie})`,
    xp: 12,
    concluida: () => false,
    manual: true,
  };
}

/** Quests do dia — mix determinístico entre BASE + TKD (se hoje é dia TKD) +
 *  musculação (se hoje é dia de treino).
 *  Retorna até 6 quests: 3 base + até 2 TKD + até 1 musculação. */
export function questsDeHoje(dataISO: string): QuestTemplate[] {
  // Rotação das básicas
  let h = 0;
  for (const ch of dataISO) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const baseOrdenada = [...BASE].sort((a, b) => {
    const ha = (h + a.id.length * 7) % 97;
    const hb = (h + b.id.length * 7) % 97;
    return ha - hb;
  });

  const musc = musculacaoQuestDoDia(dataISO);
  const tkd = tkdQuestsDoDia(dataISO);

  const out: QuestTemplate[] = [
    ...baseOrdenada.slice(0, 3),
    ...tkd.slice(0, 2),
  ];
  if (musc) out.push(musc);
  return out;
}
