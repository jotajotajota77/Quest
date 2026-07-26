// ============================================================
// Conquistas / badges permanentes (v11.2).
// ------------------------------------------------------------
// Cada conquista tem um id único, categoria (rótulo), ícone, e uma condição
// de desbloqueio checada contra um ConquistaCtx (números agregados do user).
// Puro / sem I/O — o server carrega o ctx e chama avaliar; UI mostra o que
// tá unlocked + progresso pro que falta.
// ============================================================

export type CategoriaConquista =
  | "streak"
  | "musculacao"
  | "tkd"
  | "danca"
  | "faixa"
  | "meta"
  | "ritual";

export interface ConquistaCtx {
  streakAtual: number;
  streakRecorde: number;
  seriesTotais: number;
  tkdMarcadasTotais: number;
  muscMarcadasTotais: number;
  dancaLogsTotais: number;
  faixaMaxKupTKD: number;      // menor kup = mais alto (10..1); 0 se preta
  faixaMaxDanTKD: number;      // 0 se ainda kup; 1..9 se preta
  maiorFaixaDominio: string;   // rótulo da maior faixa em qualquer domínio
  meta_peso_alcancada: boolean;
  meta_bf_alcancada: boolean;
  primeiraTKD: boolean;
  primeiraDanca: boolean;
  primeiroCardio: boolean;     // via logs comportamento cardio
  cutting_iniciado: boolean;   // meta existe
}

export interface Conquista {
  id: string;
  categoria: CategoriaConquista;
  icone: string;
  titulo: string;
  descricao: string;
  progresso?: (c: ConquistaCtx) => { atual: number; alvo: number } | null;
  desbloqueada: (c: ConquistaCtx) => boolean;
}

export const CONQUISTAS: Conquista[] = [
  // Streak
  {
    id: "streak_7",
    categoria: "streak",
    icone: "🔥",
    titulo: "Chama de 7",
    descricao: "7 dias consecutivos com log.",
    progresso: (c) => ({ atual: Math.min(c.streakRecorde, 7), alvo: 7 }),
    desbloqueada: (c) => c.streakRecorde >= 7,
  },
  {
    id: "streak_30",
    categoria: "streak",
    icone: "🔥",
    titulo: "Fogo de 30",
    descricao: "30 dias consecutivos com log.",
    progresso: (c) => ({ atual: Math.min(c.streakRecorde, 30), alvo: 30 }),
    desbloqueada: (c) => c.streakRecorde >= 30,
  },
  {
    id: "streak_60",
    categoria: "streak",
    icone: "💥",
    titulo: "Incêndio de 60",
    descricao: "60 dias consecutivos — só operante mesmo.",
    progresso: (c) => ({ atual: Math.min(c.streakRecorde, 60), alvo: 60 }),
    desbloqueada: (c) => c.streakRecorde >= 60,
  },

  // Musculação — séries
  {
    id: "musc_100_series",
    categoria: "musculacao",
    icone: "🏋️",
    titulo: "100 séries",
    descricao: "Logue 100 séries de musculação.",
    progresso: (c) => ({ atual: Math.min(c.seriesTotais, 100), alvo: 100 }),
    desbloqueada: (c) => c.seriesTotais >= 100,
  },
  {
    id: "musc_500_series",
    categoria: "musculacao",
    icone: "💪",
    titulo: "500 séries",
    descricao: "Logue 500 séries — volume começa a mostrar.",
    progresso: (c) => ({ atual: Math.min(c.seriesTotais, 500), alvo: 500 }),
    desbloqueada: (c) => c.seriesTotais >= 500,
  },
  {
    id: "musc_1000_series",
    categoria: "musculacao",
    icone: "🏆",
    titulo: "Marca dos 1000",
    descricao: "1000 séries. Você é a rotina agora.",
    progresso: (c) => ({ atual: Math.min(c.seriesTotais, 1000), alvo: 1000 }),
    desbloqueada: (c) => c.seriesTotais >= 1000,
  },
  {
    id: "musc_quest_20",
    categoria: "musculacao",
    icone: "🎯",
    titulo: "20 alvos batidos",
    descricao: "Marque 20 quests de musculação (alvo do dia).",
    progresso: (c) => ({ atual: Math.min(c.muscMarcadasTotais, 20), alvo: 20 }),
    desbloqueada: (c) => c.muscMarcadasTotais >= 20,
  },

  // TKD
  {
    id: "tkd_primeira",
    categoria: "tkd",
    icone: "🥋",
    titulo: "Primeiro Kihap",
    descricao: "Marcou a primeira quest TKD.",
    desbloqueada: (c) => c.primeiraTKD,
  },
  {
    id: "tkd_10",
    categoria: "tkd",
    icone: "🥋",
    titulo: "10 techniques",
    descricao: "Marque 10 quests TKD.",
    progresso: (c) => ({ atual: Math.min(c.tkdMarcadasTotais, 10), alvo: 10 }),
    desbloqueada: (c) => c.tkdMarcadasTotais >= 10,
  },
  {
    id: "tkd_50",
    categoria: "tkd",
    icone: "🐉",
    titulo: "50 techniques",
    descricao: "50 quests TKD — o sabum já te reconhece.",
    progresso: (c) => ({ atual: Math.min(c.tkdMarcadasTotais, 50), alvo: 50 }),
    desbloqueada: (c) => c.tkdMarcadasTotais >= 50,
  },

  // Dança
  {
    id: "danca_primeira",
    categoria: "danca",
    icone: "💃",
    titulo: "Primeira coreo",
    descricao: "Logou a primeira sessão de dança.",
    desbloqueada: (c) => c.primeiraDanca,
  },
  {
    id: "danca_10",
    categoria: "danca",
    icone: "🎵",
    titulo: "10 sessões",
    descricao: "10 sessões de dança logadas.",
    progresso: (c) => ({ atual: Math.min(c.dancaLogsTotais, 10), alvo: 10 }),
    desbloqueada: (c) => c.dancaLogsTotais >= 10,
  },
  {
    id: "danca_50",
    categoria: "danca",
    icone: "✨",
    titulo: "50 palcos",
    descricao: "50 sessões — palco é seu.",
    progresso: (c) => ({ atual: Math.min(c.dancaLogsTotais, 50), alvo: 50 }),
    desbloqueada: (c) => c.dancaLogsTotais >= 50,
  },

  // Faixa TKD
  {
    id: "faixa_amarela",
    categoria: "faixa",
    icone: "🟡",
    titulo: "Faixa Amarela",
    descricao: "9º kup em TKD — passou da branca.",
    desbloqueada: (c) => c.faixaMaxKupTKD > 0 && c.faixaMaxKupTKD <= 9,
  },
  {
    id: "faixa_verde",
    categoria: "faixa",
    icone: "🟢",
    titulo: "Faixa Verde",
    descricao: "7º kup em TKD — meio caminho.",
    desbloqueada: (c) => c.faixaMaxKupTKD > 0 && c.faixaMaxKupTKD <= 7,
  },
  {
    id: "faixa_azul",
    categoria: "faixa",
    icone: "🔵",
    titulo: "Faixa Azul",
    descricao: "5º kup em TKD.",
    desbloqueada: (c) => c.faixaMaxKupTKD > 0 && c.faixaMaxKupTKD <= 5,
  },
  {
    id: "faixa_vermelha",
    categoria: "faixa",
    icone: "🔴",
    titulo: "Faixa Vermelha",
    descricao: "2º kup — última antes da preta.",
    desbloqueada: (c) => c.faixaMaxKupTKD > 0 && c.faixaMaxKupTKD <= 2,
  },
  {
    id: "faixa_preta",
    categoria: "faixa",
    icone: "⚫",
    titulo: "Faixa Preta",
    descricao: "1º dan — desbloqueou o dan.",
    desbloqueada: (c) => c.faixaMaxDanTKD >= 1,
  },

  // Meta / cutting
  {
    id: "cutting_start",
    categoria: "meta",
    icone: "🎯",
    titulo: "Cutting iniciado",
    descricao: "Meta de cutting criada.",
    desbloqueada: (c) => c.cutting_iniciado,
  },
  {
    id: "peso_alvo",
    categoria: "meta",
    icone: "⚖️",
    titulo: "Peso alvo",
    descricao: "Alcançou o peso alvo da meta.",
    desbloqueada: (c) => c.meta_peso_alcancada,
  },
  {
    id: "bf_alvo",
    categoria: "meta",
    icone: "🏅",
    titulo: "BF alvo",
    descricao: "Alcançou o BF alvo — V-taper unlocked.",
    desbloqueada: (c) => c.meta_bf_alcancada,
  },

  // Ritual
  {
    id: "cardio_primeiro",
    categoria: "ritual",
    icone: "🏃",
    titulo: "Primeiro cardio",
    descricao: "Logou o primeiro cardio.",
    desbloqueada: (c) => c.primeiroCardio,
  },
];

/** Devolve conquistas separadas em unlocked / locked com progresso. */
export type ConquistaComProgresso = Omit<Conquista, "progresso"> & {
  progresso: { atual: number; alvo: number } | null;
};

export function classificarConquistas(
  ctx: ConquistaCtx,
  jaDesbloqueadas: Set<string>,
): {
  unlocked: Conquista[];
  novas: Conquista[]; // desbloqueou agora (não estava em jaDesbloqueadas)
  locked: ConquistaComProgresso[];
} {
  const unlocked: Conquista[] = [];
  const novas: Conquista[] = [];
  const locked: ConquistaComProgresso[] = [];
  for (const c of CONQUISTAS) {
    const desbloqAgora = c.desbloqueada(ctx);
    if (desbloqAgora) {
      unlocked.push(c);
      if (!jaDesbloqueadas.has(c.id)) novas.push(c);
    } else {
      const { progresso, ...rest } = c;
      locked.push({ ...rest, progresso: progresso?.(ctx) ?? null });
    }
  }
  return { unlocked, novas, locked };
}

export const LABEL_CATEGORIA: Record<CategoriaConquista, string> = {
  streak: "Chama",
  musculacao: "Musculação",
  tkd: "Taekwondo",
  danca: "Dança",
  faixa: "Faixas",
  meta: "Meta",
  ritual: "Primeiros",
};
