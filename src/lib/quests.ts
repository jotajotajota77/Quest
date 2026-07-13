// ============================================================
// Quests / sidequests — camada VR SECUNDÁRIA. Passiva (avaliada contra o que
// você já fez no dia). Não vira lista de decisões — é reconhecimento.
// ============================================================

import type { Familia } from "@/lib/types";
import { AGUA_META } from "@/lib/protocolo";

export interface QuestCtx {
  nucleo: Set<Familia>;
  trackersFeitos: number;
  aguaCount: number;
  registrosHoje: number;
}

export interface QuestTemplate {
  id: string;
  tipo: "diaria" | "sidequest";
  descricao: string;
  xp: number;
  concluida: (c: QuestCtx) => boolean;
}

const TEMPLATES: QuestTemplate[] = [
  { id: "nutri_hoje", tipo: "diaria", descricao: "Registre Nutri hoje", xp: 10, concluida: (c) => c.nucleo.has("nutri") },
  { id: "treino_hoje", tipo: "diaria", descricao: "Treine hoje", xp: 10, concluida: (c) => c.nucleo.has("treino") },
  { id: "agua_meta", tipo: "diaria", descricao: "Bata a meta de água", xp: 8, concluida: (c) => c.aguaCount >= AGUA_META },
  { id: "protocolo_meio", tipo: "sidequest", descricao: "Complete metade do protocolo", xp: 15, concluida: (c) => c.nucleo.size + c.trackersFeitos >= 3 },
  { id: "combo", tipo: "sidequest", descricao: "Nutri + Treino no mesmo dia", xp: 18, concluida: (c) => c.nucleo.has("nutri") && c.nucleo.has("treino") },
];

/** Quests de hoje: 3 escolhidas deterministicamente pela data (rotação). */
export function questsDeHoje(dataISO: string): QuestTemplate[] {
  // hash simples da data → offset estável no dia
  let h = 0;
  for (const ch of dataISO) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const ordenadas = [...TEMPLATES].sort((a, b) => {
    const ha = (h + a.id.length * 7) % 97;
    const hb = (h + b.id.length * 7) % 97;
    return ha - hb;
  });
  return ordenadas.slice(0, 3);
}
