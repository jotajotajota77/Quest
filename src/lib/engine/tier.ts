// ============================================================
// Ladder de Faixa TKD (v10) — substitui o E→SSR+ genérico.
// ------------------------------------------------------------
// 10 bases (10º kup → 1º dan) × 4 divisões (IV→I) = 40 ranks. O XP TOTAL
// do jogador alimenta o ladder — cada base equivale a uma faixa canônica
// do Taekwondo. Divisões são substeps dentro da mesma faixa.
// ============================================================

export interface Base {
  sigla: string;
  nome: string;
}

export const BASES: Base[] = [
  { sigla: "10K", nome: "Faixa Branca" },
  { sigla: "9K",  nome: "Faixa Amarela" },
  { sigla: "8K",  nome: "Amarela ponta verde" },
  { sigla: "7K",  nome: "Faixa Verde" },
  { sigla: "6K",  nome: "Verde ponta azul" },
  { sigla: "5K",  nome: "Faixa Azul" },
  { sigla: "4K",  nome: "Azul ponta vermelha" },
  { sigla: "3K",  nome: "Faixa Vermelha" },
  { sigla: "2K",  nome: "Vermelha ponta preta" },
  { sigla: "1D",  nome: "Faixa Preta · 1º dan" },
];

const DIVISOES = ["IV", "III", "II", "I"]; // 4 por base
export const TOTAL_RANKS = BASES.length * DIVISOES.length; // 40

/** XP cumulativo necessário para alcançar o rank de índice r (0 = E-IV). */
export function xpParaRank(r: number): number {
  if (r <= 0) return 0;
  // curva suave: cedo é rápido (instalar), depois alonga.
  return 20 * r * (r + 1); // r=1→40, 2→120, 3→240, … 39→31200
}

export interface Tier {
  rank: number; // 0..39
  base: Base;
  divisao: string; // 'IV'|'III'|'II'|'I'
  sigla: string; // ex.: 'C-III'
  rotulo: string; // ex.: 'C-III · Operador'
  nomeDivisao: string; // ex.: 'Operador III' (nome por extenso, reforçador)
  xpNoRank: number; // xp acima do piso do rank atual
  xpDoRank: number; // tamanho do rank atual (piso→próximo)
  pctParaProximo: number; // 0..100
  proximoRotulo: string | null; // sigla do próximo (ex.: 'C-II')
  proximoNomeDivisao: string | null; // ex.: 'Operador II'
}

export function tierDeXp(xp: number): Tier {
  let r = 0;
  while (r + 1 < TOTAL_RANKS && xp >= xpParaRank(r + 1)) r++;

  const baseIdx = Math.floor(r / DIVISOES.length);
  const divIdx = r % DIVISOES.length;
  const base = BASES[baseIdx];
  const divisao = DIVISOES[divIdx];
  const sigla = `${base.sigla}-${divisao}`;

  const piso = xpParaRank(r);
  const teto = xpParaRank(r + 1);
  const xpNoRank = xp - piso;
  const xpDoRank = Math.max(1, teto - piso);
  const noMax = r + 1 >= TOTAL_RANKS;

  let proximoRotulo: string | null = null;
  let proximoNomeDivisao: string | null = null;
  if (!noMax) {
    const nbIdx = Math.floor((r + 1) / DIVISOES.length);
    const ndIdx = (r + 1) % DIVISOES.length;
    proximoRotulo = `${BASES[nbIdx].sigla}-${DIVISOES[ndIdx]}`;
    proximoNomeDivisao = `${BASES[nbIdx].nome} · ${DIVISOES[ndIdx]}`;
  }

  return {
    rank: r,
    base,
    divisao,
    sigla,
    rotulo: `${base.nome} · ${divisao}`,
    nomeDivisao: `${base.nome} · ${divisao}`,
    xpNoRank,
    xpDoRank,
    pctParaProximo: noMax ? 100 : Math.min(100, (xpNoRank / xpDoRank) * 100),
    proximoRotulo,
    proximoNomeDivisao,
  };
}
