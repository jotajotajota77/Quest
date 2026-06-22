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
   *  - 'reward'     : recompensa esmaecível (Nutri) — passa pelo fading.
   *  - 'soundtrack' : trilha da atividade (Dança) — toca sempre, não esmaece.
   *  - 'none'       : sem Spotify como mecânica (Treino, Leitura).
   */
  spotify: "reward" | "soundtrack" | "none";
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
  // Não-diagnosticado → universal apenas; Spotify-CRF competiria com a leitura.
  leitura: {
    label: "Leitura",
    atributo: "sabedoria",
    motorInstalacao: false,
    spotify: "none",
    comportamentos: ["leitura"],
  },
  // Reforçador intrínseco → universal + Spotify como trilha (não esmaecível).
  danca: {
    label: "Dança",
    atributo: "destreza",
    motorInstalacao: false,
    spotify: "soundtrack",
    comportamentos: ["danca"],
  },
};

export const LABEL_COMPORTAMENTO: Record<Comportamento, string> = {
  treino: "Registrar treino",
  nutri_refeicao: "Registrar refeição",
  nutri_agua: "Água",
  leitura: "Registrar leitura",
  danca: "Registrar dança",
};

export const LABEL_ATRIBUTO: Record<Atributo, string> = {
  forca: "Força",
  stamina: "Stamina",
  sabedoria: "Sabedoria",
  destreza: "Destreza",
};

export function familiaDe(c: Comportamento): Familia {
  if (c === "nutri_refeicao" || c === "nutri_agua") return "nutri";
  return c as Familia;
}

export function atributoDe(c: Comportamento): Atributo {
  return FAMILIAS[familiaDe(c)].atributo;
}

export const FAMILIAS_ORDEM: Familia[] = ["treino", "nutri", "leitura", "danca"];
