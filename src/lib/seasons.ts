// ============================================================
// Catálogo de Seasons/Eras (v12) — puro, sem I/O.
// ------------------------------------------------------------
// Cada season é uma era estética que dura ~30 dias. Os personagens
// (masculinos, todos jogáveis) aparecem em conceitos de BOY-GROUP dentro
// da season. O soundtrack_theme cita influências de girl group (só
// pra música — nunca aplicado à arte dos personagens).
// ============================================================

export type ConceitoPersonagem =
  | "y2k"           // Y2K boy-group (2000s, wide jeans, óculos)
  | "street"        // urban wear, chains
  | "dark"          // noir, couro, contraste
  | "fresh"         // teen fresh, cores claras
  | "athlete"       // sportcore, jersey
  | "retro"         // 70s/80s, jaqueta jeans
  | "hiphop"        // baggy, snapback
  | "uniform";      // school/military uniform

export type Raridade = "regular" | "rare" | "holo" | "signature";

export interface Season {
  slug: string;
  nome: string;
  conceito_geral: string;
  duracao_dias: number;
  soundtrack_theme: string;   // descritivo, só cita influências (girl group inspirations)
  conceitos_personagens: ConceitoPersonagem[]; // conceitos boy-group disponíveis
  cor_primaria: string;   // hex — usada em border das photocards
  cor_secundaria: string;
}

// v12.5: reduzido de 8 pra 3 seasons (y2k, girlcrush, cyber) — as mais
// icônicas do concept. 2 conceitos por season × 6 personagens = 36 cards
// no catálogo (era 144). Alcançável de colecionar em 3-4 meses de jogo.
export const SEASONS: Season[] = [
  {
    slug: "y2k",
    nome: "Y2K",
    conceito_geral: "millennium bug, wide leg jeans, óculos coloridos, chrome",
    duracao_dias: 30,
    soundtrack_theme: "New Jeans, ILLIT, Kiss Of Life (Y2K bounce)",
    conceitos_personagens: ["y2k", "fresh"],
    cor_primaria: "#7cd9ff",
    cor_secundaria: "#f0a8ff",
  },
  {
    slug: "girlcrush",
    nome: "Girl Crush",
    conceito_geral: "atitude, couro, monocromático, olhar direto",
    duracao_dias: 30,
    soundtrack_theme: "aespa, (G)I-DLE, LE SSERAFIM, ITZY",
    conceitos_personagens: ["dark", "athlete"],
    cor_primaria: "#111111",
    cor_secundaria: "#e63946",
  },
  {
    slug: "cyber",
    nome: "Cyber",
    conceito_geral: "futuro digital, neon, metal escovado",
    duracao_dias: 30,
    soundtrack_theme: "aespa, EVERGLOW, NMIXX, ARTMS",
    conceitos_personagens: ["dark", "uniform"],
    cor_primaria: "#00e5ff",
    cor_secundaria: "#8a2be2",
  },
];

export function seasonPorSlug(slug: string): Season | null {
  return SEASONS.find((s) => s.slug === slug) ?? null;
}

/** Season default pra novos jogadores. */
export const SEASON_INICIAL_SLUG = "y2k";

/** Season que segue a atual (rotação sugerida). */
export function proximaSeason(atual: string): Season {
  const idx = SEASONS.findIndex((s) => s.slug === atual);
  if (idx < 0) return SEASONS[0];
  return SEASONS[(idx + 1) % SEASONS.length];
}
