// ============================================================
// Engine — faixa dinâmica por domínio (v10.2).
// ------------------------------------------------------------
// Cada usuário tem 5 rows em `progresso_dominio` (upper/lower/abs/danca/
// taekwondo). Começa em 10º kup (branca), sobe kup ao acumular XP no
// domínio do mestre selecionado no hub. Ao passar do 1º kup, vira preta
// 1º dan e continua subindo em dan.
//
// Puro / sem I/O — recebe estado carregado e devolve estado novo.
// I/O em lib/data.ts (garantirProgressoDominio, aplicarXpDominio).
// ============================================================

/** XP pra passar do kup N pro kup N-1 (index 0 = 10K → 9K, index 9 = 1K → 1D). */
export const KUP_THRESHOLDS = [30, 60, 100, 180, 280, 400, 550, 750, 1000, 1500];

/** XP pra passar do dan N pro dan N+1 (index 0 = 1D → 2D, ..., index 8 = 9D). */
export const DAN_THRESHOLDS = [2500, 4000, 6000, 9000, 13000, 18000, 24000, 32000, 42000];

/** Nome legível da faixa por kup (10 = branca até 1 = último antes de preta). */
export const NOME_POR_KUP: Record<number, string> = {
  10: "Faixa Branca",
  9: "Faixa Amarela",
  8: "Amarela ponta verde",
  7: "Faixa Verde",
  6: "Verde ponta azul",
  5: "Faixa Azul",
  4: "Azul ponta vermelha",
  3: "Faixa Vermelha",
  2: "Vermelha ponta preta",
  1: "1º kup",
};

export const DOMINIOS = ["upper", "lower", "abs", "danca", "taekwondo"] as const;
export type Dominio = (typeof DOMINIOS)[number];

export interface ProgressoDominio {
  user_id: string;
  dominio: string;
  kup: number;
  dan: number;
  xp_no_kup: number;
  atualizado_em: string;
}

export interface FaixaResolvida {
  /** Rótulo legível ("Faixa Verde", "Faixa Preta · 3º dan"). */
  rotulo: string;
  kup: number;   // 10..1 se dan=0; 0 se preta
  dan: number;   // 0 se ainda kup; 1..9 se preta
  xpNoNivel: number;
  xpPraProxima: number;   // 0 se máximo atingido
  pctPraProxima: number;  // 0..100
  atingiuMaxima: boolean; // preta 9º dan
}

/** Resolve o estado exibível da faixa a partir do progresso. */
export function faixaAtual(p: {
  kup: number;
  dan: number;
  xp_no_kup: number;
}): FaixaResolvida {
  const { kup, dan, xp_no_kup } = p;
  if (dan > 0) {
    const atingiuMax = dan > DAN_THRESHOLDS.length;
    const proximo = atingiuMax ? 0 : DAN_THRESHOLDS[dan - 1];
    return {
      rotulo: `Faixa Preta · ${dan}º dan`,
      kup: 0,
      dan,
      xpNoNivel: xp_no_kup,
      xpPraProxima: proximo,
      pctPraProxima: atingiuMax ? 100 : Math.min(100, (xp_no_kup / proximo) * 100),
      atingiuMaxima: atingiuMax,
    };
  }
  const idx = 10 - kup; // 10K → 0, 1K → 9
  const proximo = KUP_THRESHOLDS[idx];
  return {
    rotulo: NOME_POR_KUP[kup] ?? `${kup}º kup`,
    kup,
    dan: 0,
    xpNoNivel: xp_no_kup,
    xpPraProxima: proximo,
    pctPraProxima: Math.min(100, (xp_no_kup / proximo) * 100),
    atingiuMaxima: false,
  };
}

/** Aplica xp e devolve o novo (kup, dan, xp_no_kup) — sobe múltiplos níveis se preciso. */
export function aplicarXp(atual: {
  kup: number;
  dan: number;
  xp_no_kup: number;
}, xpAdd: number): { kup: number; dan: number; xp_no_kup: number } {
  let kup = atual.kup;
  let dan = atual.dan;
  let xp = atual.xp_no_kup + Math.max(0, Math.round(xpAdd));

  // Subida em kup até virar dan
  while (dan === 0 && kup >= 1) {
    const idx = 10 - kup;
    if (idx < 0 || idx >= KUP_THRESHOLDS.length) break;
    const need = KUP_THRESHOLDS[idx];
    if (xp < need) break;
    xp -= need;
    if (kup === 1) {
      dan = 1;
      kup = 0;
      break;
    }
    kup -= 1;
  }
  // Subida em dan
  while (dan >= 1 && dan <= DAN_THRESHOLDS.length) {
    const need = DAN_THRESHOLDS[dan - 1];
    if (xp < need) break;
    xp -= need;
    dan += 1;
  }

  return { kup, dan, xp_no_kup: xp };
}

/** Decodifica faixa_canonica do DB (ex: 'azul_4kup', 'preta_2dan') → {kup, dan}. */
export function decodificarFaixaCanonica(faixa: string | null | undefined): {
  kup: number;
  dan: number;
} {
  if (!faixa) return { kup: 10, dan: 0 };
  const dan = faixa.match(/(\d+)dan/);
  if (dan) return { kup: 0, dan: parseInt(dan[1], 10) };
  const kup = faixa.match(/(\d+)kup/);
  if (kup) return { kup: parseInt(kup[1], 10), dan: 0 };
  return { kup: 10, dan: 0 };
}

/** Usuário alcançou a faixa canônica do mestre? (menor kup = mais alto; dan sempre > kup) */
export function alcancouCanonica(
  atual: { kup: number; dan: number },
  alvo: { kup: number; dan: number },
): boolean {
  if (atual.dan > 0 && alvo.dan === 0) return true;
  if (atual.dan > 0 && alvo.dan > 0) return atual.dan >= alvo.dan;
  if (atual.dan === 0 && alvo.dan > 0) return false;
  return atual.kup <= alvo.kup;
}
