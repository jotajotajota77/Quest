// ============================================================
// Pool de coreografias K-pop + sorteador determinístico por dia.
// Lib pura (não é "use client") pra poder ser importada por server components
// sem problemas de boundary.
// ============================================================

export interface Coreo {
  grupo: string;
  musica: string;
  nivel: string;
}

export const COREOGRAFIAS: Coreo[] = [
  { grupo: "TXT",         musica: "Sugar Rush Ride",           nivel: "médio" },
  { grupo: "NCT DREAM",   musica: "Smoothie",                  nivel: "difícil" },
  { grupo: "ZEROBASEONE", musica: "In Bloom",                  nivel: "médio" },
  { grupo: "TWS",         musica: "Plot Twist",                nivel: "fácil" },
  { grupo: "SEVENTEEN",   musica: "God of Music",              nivel: "difícil" },
  { grupo: "RIIZE",       musica: "Get A Guitar",              nivel: "médio" },
  { grupo: "BOYNEXTDOOR", musica: "Earth, Wind & Fire",        nivel: "fácil" },
  { grupo: "ATEEZ",       musica: "Bouncy (K-Hot Chilli Peppers)", nivel: "difícil" },
  { grupo: "Stray Kids",  musica: "S-Class",                   nivel: "difícil" },
  { grupo: "TWS",         musica: "Hey! (하이!)",              nivel: "médio" },
  { grupo: "TXT",         musica: "Deja Vu",                   nivel: "difícil" },
  { grupo: "NCT",         musica: "STICKER",                   nivel: "difícil" },
  { grupo: "ENHYPEN",     musica: "Bite Me",                   nivel: "médio" },
  { grupo: "RIIZE",       musica: "Impossible",                nivel: "médio" },
  { grupo: "BOYNEXTDOOR", musica: "Serenade",                  nivel: "fácil" },
  { grupo: "Stray Kids",  musica: "God's Menu",                nivel: "difícil" },
];

/** Coreografia do dia (determinística por data ISO). */
export function coreografiaDoDia(iso: string): Coreo {
  let h = 0;
  for (const c of iso) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COREOGRAFIAS[h % COREOGRAFIAS.length];
}
