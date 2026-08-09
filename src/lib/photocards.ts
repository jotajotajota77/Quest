// ============================================================
// Catálogo de Photocards (v12) — puro, sem I/O.
// ------------------------------------------------------------
// Cada photocard é 1 personagem × 1 season × 1 conceito boy-group.
// item_id (chave no colecao_item) segue: 'photocard:{personagem}:{season}:{conceito}'.
//
// IMPORTANTE: os personagens que aparecem em card são todos MASCULINOS
// (mestres + Sanha, todos jogáveis). Girl-group inspira apenas
// soundtrack_theme das seasons (lib/seasons.ts).
// ============================================================

import { SEASONS, type ConceitoPersonagem, type Raridade } from "./seasons";

/** Slug dos personagens jogáveis. Bate com personagens.slug no DB. */
export const PERSONAGENS_JOGAVEIS = [
  "ryuki-han",
  "ji-seok-moon",
  "hujin-kim",
  "sanhee-park",
  "chan-ho-lee",
  "sanha",
] as const;

export type PersonagemSlug = (typeof PERSONAGENS_JOGAVEIS)[number];

export interface Photocard {
  id: string;                    // 'photocard:ryuki-han:y2k:y2k'
  personagem: PersonagemSlug;
  season: string;                // slug da season
  conceito: ConceitoPersonagem;
  raridade: Raridade;
  numero_serie: number;          // 1..N dentro da season
  flavor_quote: string;
}

/** Frase curta por conceito (boy-group), usada no verso da card. */
const FLAVOR_POR_CONCEITO: Record<ConceitoPersonagem, string> = {
  y2k: "millennium boy, sem medo do que já passou.",
  street: "o asfalto ensina antes do sabum.",
  dark: "não é sombra — é preparo.",
  fresh: "o ar tem cor quando a base tá firme.",
  athlete: "jersey não é fantasia — é uniforme de guerra.",
  retro: "o que virou clássico começou sendo teimosia.",
  hiphop: "cadência é postura em movimento.",
  uniform: "disciplina veste bem.",
};

/**
 * Gera o catálogo estático. Para cada season, cria 1 card por personagem
 * por conceito disponível dessa season. Raridade é atribuída de forma
 * determinística por posição (evita loot inflado).
 */
function gerarCatalogo(): Photocard[] {
  const out: Photocard[] = [];
  for (const season of SEASONS) {
    let serie = 1;
    for (const personagem of PERSONAGENS_JOGAVEIS) {
      for (const conceito of season.conceitos_personagens) {
        const raridade = raridadeDeterministica(personagem, season.slug, conceito);
        out.push({
          id: `photocard:${personagem}:${season.slug}:${conceito}`,
          personagem,
          season: season.slug,
          conceito,
          raridade,
          numero_serie: serie++,
          flavor_quote: FLAVOR_POR_CONCEITO[conceito],
        });
      }
    }
  }
  return out;
}

/** Distribui raridade via hash — 60/25/12/3 aproximado. */
function raridadeDeterministica(
  personagem: string,
  season: string,
  conceito: string,
): Raridade {
  const key = `${personagem}:${season}:${conceito}`;
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const bucket = h % 100;
  if (bucket < 3) return "signature";
  if (bucket < 15) return "holo";
  if (bucket < 40) return "rare";
  return "regular";
}

export const PHOTOCARDS: Photocard[] = gerarCatalogo();

/** Lookup rápido por id. */
const PHOTOCARDS_POR_ID = new Map(PHOTOCARDS.map((p) => [p.id, p]));

export function photocardPorId(id: string): Photocard | null {
  return PHOTOCARDS_POR_ID.get(id) ?? null;
}

export function photocardsDaSeason(seasonSlug: string): Photocard[] {
  return PHOTOCARDS.filter((p) => p.season === seasonSlug);
}

export function photocardsDoPersonagem(slug: PersonagemSlug): Photocard[] {
  return PHOTOCARDS.filter((p) => p.personagem === slug);
}

// ============================================================
// Sorteio de photocards nos drops
// ============================================================

/** Boss semanal derrotado → 1 photocard REGULAR aleatória da season atual. */
export function sortearBossDrop(
  seasonSlug: string,
  seed: number,
): Photocard | null {
  const pool = photocardsDaSeason(seasonSlug).filter((p) => p.raridade === "regular");
  if (pool.length === 0) return null;
  return pool[seed % pool.length];
}

/** PR real de musculação → 1 photocard HOLO do personagem daquele grupo. */
export function sortearHoloPorPersonagem(
  personagem: PersonagemSlug,
  seasonSlug: string,
  seed: number,
): Photocard | null {
  const pool = PHOTOCARDS.filter(
    (p) => p.personagem === personagem && p.season === seasonSlug && p.raridade === "holo",
  );
  if (pool.length === 0) {
    // fallback: qualquer holo do personagem em qualquer season
    const wide = PHOTOCARDS.filter(
      (p) => p.personagem === personagem && p.raridade === "holo",
    );
    if (wide.length === 0) return null;
    return wide[seed % wide.length];
  }
  return pool[seed % pool.length];
}

/** Quest secreta cumprida → 1 photocard RARE aleatória da season atual. */
export function sortearRareDrop(
  seasonSlug: string,
  seed: number,
): Photocard | null {
  const pool = photocardsDaSeason(seasonSlug).filter((p) => p.raridade === "rare");
  if (pool.length === 0) return null;
  return pool[seed % pool.length];
}

/** Boss do Ato derrotado → SIGNATURE sorteada (single-source drop). */
export function sortearSignature(
  seasonSlug: string,
  seed: number,
): Photocard | null {
  const pool = photocardsDaSeason(seasonSlug).filter((p) => p.raridade === "signature");
  if (pool.length === 0) {
    // fallback: qualquer signature global
    const wide = PHOTOCARDS.filter((p) => p.raridade === "signature");
    return wide[seed % wide.length] ?? null;
  }
  return pool[seed % pool.length];
}

/** Duplicata: cada duplicata vira N shards. Raridade escala. */
export const SHARDS_POR_DUPLICATA: Record<Raridade, number> = {
  regular: 3,
  rare: 6,
  holo: 12,
  signature: 30,
};

/** 10 shards trocam por 1 card qualquer da season atual (aleatória). */
export const SHARDS_PARA_TROCA = 10;
