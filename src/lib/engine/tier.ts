// ============================================================
// Ladder de Tier temático — substitui o "Elo: 2" vago.
// ------------------------------------------------------------
// 10 bases × 4 divisões (IV→I) = 40 ranks. O XP TOTAL do jogador alimenta o
// ladder. Atributo continua sendo placar; o tier é a leitura concreta dele.
// ============================================================

export interface Base {
  sigla: string;
  nome: string;
}

export const BASES: Base[] = [
  { sigla: "E", nome: "Recruta" },
  { sigla: "D", nome: "Aprendiz" },
  { sigla: "C", nome: "Operador" },
  { sigla: "B", nome: "Veterano" },
  { sigla: "A", nome: "Especialista" },
  { sigla: "A+", nome: "Elite" },
  { sigla: "S", nome: "Awakened" },
  { sigla: "SS", nome: "Sovereign" },
  { sigla: "SSR", nome: "Mythic" },
  { sigla: "SSR+", nome: "Apex" },
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
    proximoNomeDivisao = `${BASES[nbIdx].nome} ${DIVISOES[ndIdx]}`;
  }

  return {
    rank: r,
    base,
    divisao,
    sigla,
    rotulo: `${sigla} · ${base.nome}`,
    nomeDivisao: `${base.nome} ${divisao}`,
    xpNoRank,
    xpDoRank,
    pctParaProximo: noMax ? 100 : Math.min(100, (xpNoRank / xpDoRank) * 100),
    proximoRotulo,
    proximoNomeDivisao,
  };
}
