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

export const SEASONS: Season[] = [
  {
    slug: "y2k",
    nome: "Y2K",
    conceito_geral: "millennium bug, wide leg jeans, óculos coloridos, chrome",
    duracao_dias: 30,
    soundtrack_theme: "New Jeans, ILLIT, Kiss Of Life (Y2K bounce)",
    conceitos_personagens: ["y2k", "fresh", "retro"],
    cor_primaria: "#7cd9ff",
    cor_secundaria: "#f0a8ff",
  },
  {
    slug: "girlcrush",
    nome: "Girl Crush",
    conceito_geral: "atitude, couro, monocromático, olhar direto",
    duracao_dias: 30,
    soundtrack_theme: "aespa, (G)I-DLE, LE SSERAFIM, ITZY",
    conceitos_personagens: ["dark", "street", "athlete"],
    cor_primaria: "#111111",
    cor_secundaria: "#e63946",
  },
  {
    slug: "cyber",
    nome: "Cyber",
    conceito_geral: "futuro digital, neon, metal escovado",
    duracao_dias: 30,
    soundtrack_theme: "aespa, EVERGLOW, NMIXX, ARTMS",
    conceitos_personagens: ["dark", "street", "uniform"],
    cor_primaria: "#00e5ff",
    cor_secundaria: "#8a2be2",
  },
  {
    slug: "summer",
    nome: "Summer",
    conceito_geral: "praia, camisa aberta, gradiente laranja→rosa",
    duracao_dias: 30,
    soundtrack_theme: "TWICE, IVE, fromis_9",
    conceitos_personagens: ["fresh", "athlete", "retro"],
    cor_primaria: "#ff8a4c",
    cor_secundaria: "#ffce4e",
  },
  {
    slug: "hiphop",
    nome: "Hip-Hop",
    conceito_geral: "baggy, snapback, corrente, atitude",
    duracao_dias: 30,
    soundtrack_theme: "BABYMONSTER, MEOVV, 2NE1 (throwback)",
    conceitos_personagens: ["hiphop", "street", "dark"],
    cor_primaria: "#f5a623",
    cor_secundaria: "#3a1c00",
  },
  {
    slug: "uniform",
    nome: "Uniform",
    conceito_geral: "school + military uniform, disciplina, verão coreano",
    duracao_dias: 30,
    soundtrack_theme: "IVE, fromis_9, IZ*ONE (era school)",
    conceitos_personagens: ["uniform", "fresh", "retro"],
    cor_primaria: "#1e3a5f",
    cor_secundaria: "#c8b273",
  },
  {
    slug: "retro",
    nome: "Retro",
    conceito_geral: "80s/70s, jaqueta jeans, sépia, grain",
    duracao_dias: 30,
    soundtrack_theme: "Red Velvet (Cosmic era), TWICE (retro)",
    conceitos_personagens: ["retro", "y2k", "fresh"],
    cor_primaria: "#c68e17",
    cor_secundaria: "#5b3a1e",
  },
  {
    slug: "dark",
    nome: "Dark",
    conceito_geral: "noir, contraste extremo, monocromo",
    duracao_dias: 30,
    soundtrack_theme: "LE SSERAFIM, aespa (dark era)",
    conceitos_personagens: ["dark", "street", "uniform"],
    cor_primaria: "#0a0a0a",
    cor_secundaria: "#7a1f2b",
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
