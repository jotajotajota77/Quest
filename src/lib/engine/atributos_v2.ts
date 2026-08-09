// ============================================================
// Engine — Atributos 5-eixos (v12). Puro, sem I/O.
// ------------------------------------------------------------
// Mapeia atividades → ganho em cada eixo. forca/potencia/resistencia/
// mobilidade/tecnica. Não substitui atributos.forca+stamina do log
// central (esse fluxo continua vivo pro Trainee Level = atributos.xp).
// Este engine só ROTEIA XP dos grupos musculares pros 5 eixos, permitindo
// build progression sem retrabalho.
// ============================================================

import { type GrupoMuscular } from "./mastery";

export const EIXOS_ATRIBUTO = [
  "forca",
  "potencia",
  "resistencia",
  "mobilidade",
  "tecnica",
] as const;

export type Eixo = (typeof EIXOS_ATRIBUTO)[number];

/**
 * Cada grupo muscular contribui pra combinação de eixos ao ganhar XP na
 * mastery. Peso pra CADA grupo somando 1.0.
 *
 * - chest/back: força alta, potência média, resistência baixa.
 * - shoulders: força + mobilidade.
 * - biceps/triceps: força + potência.
 * - lower: força + potência + resistência.
 * - core: força + resistência + mobilidade.
 * - taekwondo: técnica dominante + potência + mobilidade.
 * - danca: mobilidade dominante + resistência + tecnica.
 */
const MAPA_GRUPO_EIXO: Record<GrupoMuscular, Partial<Record<Eixo, number>>> = {
  chest:      { forca: 0.6, potencia: 0.3, resistencia: 0.1 },
  back:       { forca: 0.6, potencia: 0.25, resistencia: 0.15 },
  shoulders:  { forca: 0.5, mobilidade: 0.3, potencia: 0.2 },
  biceps:     { forca: 0.6, potencia: 0.4 },
  triceps:    { forca: 0.55, potencia: 0.45 },
  lower:      { forca: 0.4, potencia: 0.35, resistencia: 0.25 },
  core:       { forca: 0.35, resistencia: 0.35, mobilidade: 0.3 },
  taekwondo:  { tecnica: 0.5, potencia: 0.3, mobilidade: 0.2 },
  danca:      { mobilidade: 0.5, resistencia: 0.3, tecnica: 0.2 },
};

export interface DeltaAtributo {
  eixo: Eixo;
  delta: number;
}

/**
 * Puro: dado ganho de mastery num grupo, devolve o quanto cada eixo ganha.
 * Fator de atenuação (0.4) pra não inflar — 1 nível de mastery ≈ 0.4 pt
 * cumulativo entre eixos, distribuído pelas suas afinidades.
 */
export function distribuirParaAtributos(
  grupo: GrupoMuscular,
  xpMastery: number,
): DeltaAtributo[] {
  const mapa = MAPA_GRUPO_EIXO[grupo];
  const totalAplicado = xpMastery * 0.4;
  const out: DeltaAtributo[] = [];
  for (const [eixo, peso] of Object.entries(mapa)) {
    if (!peso) continue;
    out.push({ eixo: eixo as Eixo, delta: totalAplicado * peso });
  }
  return out;
}

export interface AtributosV2 {
  forca: number;
  potencia: number;
  resistencia: number;
  mobilidade: number;
  tecnica: number;
}

/**
 * Aplica um array de deltas ao snapshot atual dos atributos, arredondando
 * pra int (o DB armazena int).
 */
export function aplicarDeltasAtributos(
  atual: AtributosV2,
  deltas: DeltaAtributo[],
): AtributosV2 {
  const acc = { ...atual };
  for (const { eixo, delta } of deltas) {
    acc[eixo] = Math.max(0, Math.round(acc[eixo] + delta));
  }
  return acc;
}

// ============================================================
// Build resolver (só resolve rótulo — não afeta números)
// ============================================================

export type BuildTrainee = "fighter" | "athlete" | "tank" | "performer" | "balanced";

/** Puro: dado o snapshot, sugere qual build o jogador tá tendendo. */
export function resolverBuild(a: AtributosV2): {
  build: BuildTrainee;
  rotulo: string;
  emoji: string;
  motivo: string;
} {
  const total = a.forca + a.potencia + a.resistencia + a.mobilidade + a.tecnica || 1;
  const forcaPct = a.forca / total;
  const tecnicaPct = a.tecnica / total;
  const potenciaPct = a.potencia / total;
  const resistenciaPct = a.resistencia / total;
  const mobilidadePct = a.mobilidade / total;

  if (tecnicaPct > 0.28 && potenciaPct > 0.2) {
    return {
      build: "fighter",
      rotulo: "Fighter",
      emoji: "🥋",
      motivo: "Alta técnica + potência — perfil de dojang.",
    };
  }
  if (mobilidadePct > 0.28 && resistenciaPct > 0.2) {
    return {
      build: "performer",
      rotulo: "Performer",
      emoji: "🕺",
      motivo: "Mobilidade + resistência — perfil de palco.",
    };
  }
  if (forcaPct > 0.5) {
    return {
      build: "tank",
      rotulo: "Tank",
      emoji: "💪",
      motivo: "Força dominante — perfil de força bruta.",
    };
  }
  if (potenciaPct > 0.3 && resistenciaPct > 0.25) {
    return {
      build: "athlete",
      rotulo: "Athlete",
      emoji: "⚡",
      motivo: "Potência + resistência — perfil atlético.",
    };
  }
  return {
    build: "balanced",
    rotulo: "Balanced",
    emoji: "⚖️",
    motivo: "Distribuição equilibrada — ainda escolhendo o caminho.",
  };
}
