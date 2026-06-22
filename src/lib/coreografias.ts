// ============================================================
// Sorteador de coreografia (aba Dança) — TOOLING, não reforço. Tira a paralisia
// de "o que dançar?". Links são de BUSCA (YouTube/TikTok), que não quebram com
// o tempo como um vídeo fixo quebraria.
// ============================================================

export interface Coreografia {
  nome: string;
  estilo: string;
}

export const COREOGRAFIAS: Coreografia[] = [
  // TikTok / virais
  { nome: "Renegade", estilo: "TikTok" },
  { nome: "Say So", estilo: "TikTok" },
  { nome: "Savage", estilo: "TikTok" },
  { nome: "Blinding Lights", estilo: "TikTok" },
  { nome: "About Damn Time", estilo: "TikTok" },
  { nome: "Pedro Pedro Pedro", estilo: "TikTok" },
  { nome: "Makeba", estilo: "TikTok" },
  { nome: "Cupid (Twin Version)", estilo: "TikTok" },
  // Funk / Brasil
  { nome: "Quadradinho de 8", estilo: "Funk" },
  { nome: "Passinho do Romano", estilo: "Funk" },
  { nome: "Vai Malandra", estilo: "Funk" },
  { nome: "Dança do Créu", estilo: "Funk" },
  { nome: "Tá OK", estilo: "Funk" },
  { nome: "Rebola", estilo: "Funk" },
  // Pop
  { nome: "Levitating", estilo: "Pop" },
  { nome: "Single Ladies", estilo: "Pop" },
  { nome: "Uptown Funk", estilo: "Pop" },
  { nome: "Industry Baby", estilo: "Pop" },
  // K-pop
  { nome: "How You Like That", estilo: "K-pop" },
  { nome: "Lalisa", estilo: "K-pop" },
  { nome: "Pink Venom", estilo: "K-pop" },
  { nome: "Ditto", estilo: "K-pop" },
  // Estilos livres / aquecimento
  { nome: "Shuffle dance básico", estilo: "Free style" },
  { nome: "Amapiano / Afrobeat", estilo: "Afro" },
  { nome: "Hip-hop básico", estilo: "Free style" },
  { nome: "Passinho do maloka", estilo: "Funk" },
  { nome: "Forró pé de serra", estilo: "Forró" },
  { nome: "Samba no pé", estilo: "Samba" },
];

const q = (c: Coreografia) => encodeURIComponent(`${c.nome} coreografia`);

export function linkYouTube(c: Coreografia): string {
  return `https://www.youtube.com/results?search_query=${q(c)}`;
}

export function linkTikTok(c: Coreografia): string {
  return `https://www.tiktok.com/search?q=${q(c)}`;
}

/** Sorteia uma coreografia, evitando repetir a anterior. */
export function sortearCoreografia(anterior?: Coreografia | null): Coreografia {
  if (COREOGRAFIAS.length === 1) return COREOGRAFIAS[0];
  let c = COREOGRAFIAS[Math.floor(Math.random() * COREOGRAFIAS.length)];
  while (anterior && c.nome === anterior.nome) {
    c = COREOGRAFIAS[Math.floor(Math.random() * COREOGRAFIAS.length)];
  }
  return c;
}
