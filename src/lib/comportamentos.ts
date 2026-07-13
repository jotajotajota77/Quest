// ============================================================
// Mapa dos comportamentos → família, atributo e POLÍTICA DE REFORÇO.
// ------------------------------------------------------------
// Aqui mora a ASSIMETRIA DE REFORÇO (TRAVA 2): cada família recebe o que a
// função dela exige. Só a Nutri tem motor de instalação (Spotify-CRF + fading
// + porteiro). Não unifique sob o mesmo motor "por simetria".
// ============================================================

import type { Atributo, Comportamento, Familia } from "@/lib/types";

export interface ConfigFamilia {
  label: string;
  atributo: Atributo;
  /** Motor de instalação (Spotify-CRF + fading + porteiro). Só Nutri. */
  motorInstalacao: boolean;
  /**
   * Papel do Spotify nesta família:
   *  - 'reward' : recompensa esmaecível (Nutri) — passa pelo fading.
   *  - 'none'   : sem Spotify como mecânica (Treino).
   */
  spotify: "reward" | "none";
  comportamentos: Comportamento[];
}

export const FAMILIAS: Record<Familia, ConfigFamilia> = {
  // Operante FORTE confirmado → camada universal apenas (não desperdiça reforço).
  treino: {
    label: "Treino",
    atributo: "forca",
    motorInstalacao: false,
    spotify: "none",
    comportamentos: ["treino"],
  },
  // Operante FRÁGIL confirmado → camada universal + motor de instalação completo.
  nutri: {
    label: "Nutri",
    atributo: "stamina",
    motorInstalacao: true,
    spotify: "reward",
    comportamentos: ["nutri_refeicao", "nutri_agua"],
  },
};

export const LABEL_COMPORTAMENTO: Record<Comportamento, string> = {
  treino: "Registrar treino",
  nutri_refeicao: "Registrar refeição",
  nutri_agua: "Água",
  cardio: "Cardio",
  volei: "Vôlei",
  resistencia: "Resistência",
};

export const LABEL_ATRIBUTO: Record<Atributo, string> = {
  forca: "Força",
  stamina: "Stamina",
};

export function familiaDe(c: Comportamento): Familia {
  // Nutri + fontes abertas de Stamina agregam na família nutri (atributo
  // Stamina). O motor de instalação (Spotify) NÃO segue a família: é gated só
  // em nutri_refeicao/nutri_agua no loop central (ver /api/log).
  if (
    c === "nutri_refeicao" ||
    c === "nutri_agua" ||
    c === "cardio" ||
    c === "volei" ||
    c === "resistencia"
  ) {
    return "nutri";
  }
  return c as Familia;
}

/** Comportamento dispara o motor de instalação (Spotify-CRF)? Só Nutri real. */
export function disparaMotorNutri(c: Comportamento): boolean {
  return c === "nutri_refeicao" || c === "nutri_agua";
}

export function atributoDe(c: Comportamento): Atributo {
  return FAMILIAS[familiaDe(c)].atributo;
}

export const FAMILIAS_ORDEM: Familia[] = ["treino", "nutri"];
