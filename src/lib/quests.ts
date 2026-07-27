// ============================================================
// Quests / sidequests — camada VR SECUNDÁRIA.
// ------------------------------------------------------------
// v11: quests podem ser AUTO (avaliadas contra logs) ou MANUAIS (marca via
// botão — usadas pra TKD e exercícios específicos do dia).
// v11.4: pool de TKD expandido pra chutes + esquivas + poomsae + sparring
// drills. Quests TKD aparecem TODO DIA (não só nos dias de sessão TKD com
// o sabum) — a ideia é praticar em casa também.
// ============================================================

import type { Familia } from "@/lib/types";
import { AGUA_META } from "@/lib/protocolo";
import { programaDoDia } from "@/lib/programa";

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

// v11.4: Pool grande de "moves"/drills TKD com formato de quest.
// Cada template define reps + xp + template de descrição.
interface TkdMoveTemplate {
  id_base: string;
  descricao: (reps: number) => string;
  reps_min: number;
  reps_max: number;
  xp: number;
}

const TKD_POOL: TkdMoveTemplate[] = [
  // Chutes (kicks) básicos
  { id_base: "dollyo",     descricao: (r) => `Fazer ${r} Dollyo Chagi (chute circular)`, reps_min: 5, reps_max: 10, xp: 12 },
  { id_base: "ap_chagi",   descricao: (r) => `Fazer ${r} Ap Chagi (chute frontal)`,       reps_min: 5, reps_max: 12, xp: 10 },
  { id_base: "yeop",       descricao: (r) => `Fazer ${r} Yeop Chagi (chute lateral)`,     reps_min: 5, reps_max: 10, xp: 12 },
  { id_base: "bandal",     descricao: (r) => `Fazer ${r} Bandal Chagi (meio-chute)`,      reps_min: 5, reps_max: 10, xp: 10 },
  { id_base: "dwit",       descricao: (r) => `Fazer ${r} Dwit Chagi (chute pra trás)`,    reps_min: 3, reps_max: 6,  xp: 14 },
  { id_base: "neryeo",     descricao: (r) => `Fazer ${r} Neryeo Chagi (chute descida)`,   reps_min: 3, reps_max: 8,  xp: 14 },
  { id_base: "naeryo",     descricao: (r) => `Fazer ${r} Naeryo Chagi (chute machado)`,   reps_min: 3, reps_max: 6,  xp: 14 },
  { id_base: "tibbit",     descricao: (r) => `Fazer ${r} Tibbit Chagi (giro completo)`,   reps_min: 2, reps_max: 5,  xp: 16 },
  { id_base: "twio",       descricao: (r) => `Fazer ${r} Twio Chagi (chute com salto)`,   reps_min: 2, reps_max: 4,  xp: 16 },

  // Defesa / esquiva
  { id_base: "esquivas",   descricao: (r) => `Fazer ${r} esquivas laterais (sparring drill)`, reps_min: 5, reps_max: 12, xp: 12 },
  { id_base: "esquivas_recuo", descricao: (r) => `${r} esquivas com recuo + contra-ataque`,   reps_min: 3, reps_max: 8,  xp: 14 },
  { id_base: "arae_makki", descricao: (r) => `${r} Arae Makki (defesa baixa)`,             reps_min: 5, reps_max: 12, xp: 8  },
  { id_base: "momtong_makki", descricao: (r) => `${r} Momtong Makki (defesa média)`,        reps_min: 5, reps_max: 12, xp: 8  },
  { id_base: "olgul_makki", descricao: (r) => `${r} Olgul Makki (defesa alta)`,             reps_min: 5, reps_max: 12, xp: 8  },

  // Poomsae
  { id_base: "poomsae_1", descricao: (r) => `Repetir Poomsae Taegeuk 1 ${r}×`,             reps_min: 1, reps_max: 3,  xp: 15 },
  { id_base: "poomsae_2", descricao: (r) => `Repetir Poomsae Taegeuk 2 ${r}×`,             reps_min: 1, reps_max: 3,  xp: 15 },
  { id_base: "poomsae_3", descricao: (r) => `Repetir Poomsae Taegeuk 3 ${r}×`,             reps_min: 1, reps_max: 3,  xp: 15 },

  // Sparring / rounds
  { id_base: "sparring",  descricao: (r) => `${r}× round(s) de sparring de 2 min`,         reps_min: 1, reps_max: 4,  xp: 20 },
  { id_base: "combos",    descricao: (r) => `${r} combos completos (chute + contra)`,     reps_min: 3, reps_max: 8,  xp: 14 },
  { id_base: "guard",     descricao: (r) => `Segurar guarda alta por ${r}× 30s`,           reps_min: 2, reps_max: 5,  xp: 10 },
  { id_base: "kihap",     descricao: (r) => `${r} kihaps potentes seguidos`,               reps_min: 5, reps_max: 12, xp: 8  },

  // Alongamento / mobilidade (contam pra TKD)
  { id_base: "chute_alto", descricao: (r) => `${r} chutes altos parados (segurar 3s cada)`, reps_min: 3, reps_max: 6, xp: 12 },
  { id_base: "abertura",   descricao: (r) => `Manter abertura de perna por ${r}× 30s`,     reps_min: 2, reps_max: 5,  xp: 10 },
  { id_base: "corda",      descricao: (r) => `${r} min de corda pra aquecer`,               reps_min: 2, reps_max: 5,  xp: 12 },
];

/** v11.4: escolhe 3 quests TKD por dia (determinístico por data), tirando
 *  do pool grande. Aparece TODO dia. */
function tkdQuestsDoDia(dataISO: string): QuestTemplate[] {
  let h = 0;
  for (const c of dataISO) h = (h * 31 + c.charCodeAt(0)) >>> 0;

  const ordenado = [...TKD_POOL].sort((a, b) => {
    const ha = (h + a.id_base.length * 7) % 997;
    const hb = (h + b.id_base.length * 7) % 997;
    return ha - hb;
  });

  return ordenado.slice(0, 3).map((tmpl, i) => {
    let h2 = 0;
    for (const c of dataISO + tmpl.id_base) h2 = (h2 * 31 + c.charCodeAt(0)) >>> 0;
    const range = tmpl.reps_max - tmpl.reps_min + 1;
    const reps = tmpl.reps_min + (h2 % range);
    void i;
    return {
      id: `tkd_${tmpl.id_base}_${reps}`,
      tipo: "tkd" as const,
      descricao: tmpl.descricao(reps),
      xp: tmpl.xp,
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

/** Quests do dia — mix determinístico: 3 base + 3 TKD (SEMPRE) + até 1 musc. */
export function questsDeHoje(dataISO: string): QuestTemplate[] {
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
    ...tkd, // v11.4: 3 TKD sempre — chutes, esquivas, poomsae, sparring drills
  ];
  if (musc) out.push(musc);
  return out;
}
