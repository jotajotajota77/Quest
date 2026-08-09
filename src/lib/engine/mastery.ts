// ============================================================
// Engine — Muscle Mastery (v12). Puro, sem I/O.
// ------------------------------------------------------------
// Cada grupo muscular tem XP próprio. Uma série de supino, por exemplo,
// distribui XP em chest (principal), triceps (auxiliar) e shoulders
// (estabilizador) segundo pesos fixos por exercício.
//
// I/O em lib/data.ts (aplicarMasteryPorSerie).
// ============================================================

/** Grupos musculares canônicos. Bate com mastery_musculo.grupo. */
export const GRUPOS_MUSCULARES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "lower",
  "core",
  "taekwondo",
  "danca",
] as const;

export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number];

/**
 * Threshold XP para subir do nível N pro N+1. Curva mais lenta que faixa
 * de domínio — mastery é a métrica FINA (por músculo), então precisa ser
 * mais generosa no começo pra dar sensação de progresso rápido.
 *
 * Nível 1 → 2: 40, 2 → 3: 90, 3 → 4: 160, ...
 * Fórmula: 40 + (n-1) * 50 * (n-1) — cumulativo cresce ~ n^3.
 */
export function xpParaNivel(nivelAtual: number): number {
  if (nivelAtual < 1) return 40;
  return 40 + (nivelAtual - 1) * 50 * (nivelAtual - 1);
}

export interface MasteryEstado {
  grupo: GrupoMuscular;
  xp: number;
  nivel: number;
}

export interface MasteryResolvida extends MasteryEstado {
  xpNoNivel: number;
  xpPraProximo: number;
  pctPraProximo: number;
}

/** Puro: dado xp+nivel atuais, resolve o display. */
export function masteryResolvida(m: {
  grupo: GrupoMuscular;
  xp: number;
  nivel: number;
}): MasteryResolvida {
  const proximo = xpParaNivel(m.nivel);
  return {
    ...m,
    xpNoNivel: m.xp,
    xpPraProximo: proximo,
    pctPraProximo: Math.min(100, (m.xp / proximo) * 100),
  };
}

/** Puro: aplica xpAdd, sobe múltiplos níveis se preciso. */
export function aplicarXpMastery(
  atual: { nivel: number; xp: number },
  xpAdd: number,
): { nivel: number; xp: number } {
  let nivel = atual.nivel;
  let xp = atual.xp + Math.max(0, Math.round(xpAdd));
  while (xp >= xpParaNivel(nivel)) {
    xp -= xpParaNivel(nivel);
    nivel += 1;
  }
  return { nivel, xp };
}

// ============================================================
// Mapeamento exercício → distribuição de XP por grupo
// ============================================================

/**
 * Distribuição por exercício. Chave é match parcial (case insensitive) contra
 * o `nome` da série. Ordem importa: pega o primeiro match.
 *
 * A soma dos pesos por linha deve dar 1.0. XP total distribuído é sempre
 * XP_BASE_POR_SERIE * pesoEsforco (via aplicarMasteryPorSerie).
 */
type Distrib = Partial<Record<GrupoMuscular, number>>;

const MAPA_EXERCICIO: Array<{ padrao: RegExp; distrib: Distrib }> = [
  // Peito
  { padrao: /supino inclin/i, distrib: { chest: 0.7, triceps: 0.2, shoulders: 0.1 } },
  { padrao: /supino declin/i, distrib: { chest: 0.7, triceps: 0.2, shoulders: 0.1 } },
  { padrao: /supino reto|supino( |$)|bench press/i, distrib: { chest: 0.6, triceps: 0.25, shoulders: 0.15 } },
  { padrao: /peck deck|crossover|voador|fly/i, distrib: { chest: 0.85, shoulders: 0.15 } },
  { padrao: /mergulho|dip|paralela/i, distrib: { chest: 0.5, triceps: 0.4, shoulders: 0.1 } },
  { padrao: /flex(ã|a)o|push[- ]up/i, distrib: { chest: 0.55, triceps: 0.25, shoulders: 0.15, core: 0.05 } },

  // Costas
  { padrao: /barra fixa|pull[- ]up|chin[- ]up/i, distrib: { back: 0.7, biceps: 0.25, core: 0.05 } },
  { padrao: /puxada|lat pulldown/i, distrib: { back: 0.75, biceps: 0.25 } },
  { padrao: /remada curvada|barbell row/i, distrib: { back: 0.7, biceps: 0.2, shoulders: 0.1 } },
  { padrao: /remada|row/i, distrib: { back: 0.75, biceps: 0.2, shoulders: 0.05 } },
  { padrao: /pullover/i, distrib: { back: 0.6, chest: 0.3, triceps: 0.1 } },

  // Ombros
  { padrao: /desenvolvimento militar|overhead press|ohp/i, distrib: { shoulders: 0.65, triceps: 0.25, chest: 0.1 } },
  { padrao: /desenvolvimento (halter|dumbbell)/i, distrib: { shoulders: 0.7, triceps: 0.2, chest: 0.1 } },
  { padrao: /eleva(ç|c)(ã|a)o lateral|lateral raise/i, distrib: { shoulders: 1.0 } },
  { padrao: /eleva(ç|c)(ã|a)o frontal|front raise/i, distrib: { shoulders: 0.9, chest: 0.1 } },
  { padrao: /face pull|pull apart/i, distrib: { shoulders: 0.7, back: 0.3 } },
  { padrao: /encolhimento|shrug/i, distrib: { shoulders: 0.5, back: 0.5 } },

  // Bíceps
  { padrao: /rosca direta|curl( |$)/i, distrib: { biceps: 1.0 } },
  { padrao: /rosca martelo|hammer curl/i, distrib: { biceps: 0.85, /* antebraço não mapeado */ } },
  { padrao: /rosca scott|preacher curl/i, distrib: { biceps: 1.0 } },
  { padrao: /rosca/i, distrib: { biceps: 1.0 } },

  // Tríceps
  { padrao: /tr(í|i)ceps( |$)|triceps pushdown|triceps corda|triceps francês|triceps testa/i, distrib: { triceps: 1.0 } },
  { padrao: /kickback/i, distrib: { triceps: 1.0 } },

  // Lower
  { padrao: /agachamento livre|back squat/i, distrib: { lower: 0.85, core: 0.15 } },
  { padrao: /agachamento( |$)|squat/i, distrib: { lower: 0.9, core: 0.1 } },
  { padrao: /leg press/i, distrib: { lower: 1.0 } },
  { padrao: /stiff|romanian dead|rdl|good morning/i, distrib: { lower: 0.7, back: 0.2, core: 0.1 } },
  { padrao: /levantamento terra|deadlift/i, distrib: { lower: 0.55, back: 0.3, core: 0.15 } },
  { padrao: /cadeira extensora|leg extension/i, distrib: { lower: 1.0 } },
  { padrao: /cadeira flexora|leg curl|mesa flexora/i, distrib: { lower: 1.0 } },
  { padrao: /panturrilha|calf/i, distrib: { lower: 1.0 } },
  { padrao: /avanço|lunge/i, distrib: { lower: 0.9, core: 0.1 } },
  { padrao: /búlgaro|bulgarian split/i, distrib: { lower: 0.85, core: 0.15 } },
  { padrao: /goblet|hip thrust|glute bridge/i, distrib: { lower: 0.9, core: 0.1 } },

  // Core
  { padrao: /abdominal|crunch|prancha|plank|elevação de pernas|leg raise|russian twist|ab wheel/i, distrib: { core: 1.0 } },

  // Cardio/genérico → sem grupo específico
];

/**
 * Retorna a distribuição de XP por grupo pra uma série, ou null se não
 * reconhecer. Chamador decide o que fazer com null (não credita mastery).
 */
export function distribuicaoDoExercicio(nomeExercicio: string): Distrib | null {
  const nome = nomeExercicio.trim();
  if (!nome) return null;
  for (const { padrao, distrib } of MAPA_EXERCICIO) {
    if (padrao.test(nome)) return distrib;
  }
  return null;
}

/**
 * XP base por série. Uma série de intensidade média entrega ~15 XP total,
 * distribuídos entre os grupos. Peso e reps aumentam o multiplicador.
 */
export const XP_BASE_POR_SERIE = 15;

/**
 * Multiplicador por peso/reps. Uma série leve (≤10kg × 10 reps) rende ~1x;
 * séries pesadas escalam suavemente. Sem peso (peso corporal) usa reps × 0.8.
 */
export function multiplicadorDaSerie(peso: number | null, reps: number | null): number {
  const r = reps ?? 10;
  const p = peso ?? 0;
  if (p === 0) return Math.max(0.4, Math.min(1.6, (r / 10) * 0.8));
  // Log-scale suave: 10kg=1, 40kg=1.6, 100kg=2.4, 200kg=3.1
  const escalaPeso = 1 + Math.log10(Math.max(1, p / 10)) * 0.7;
  const escalaReps = Math.max(0.7, Math.min(1.4, r / 10));
  return Math.max(0.5, Math.min(4, escalaPeso * escalaReps));
}

export interface DeltaMastery {
  grupo: GrupoMuscular;
  xp: number;
}

/**
 * Puro: pra uma série (nome + peso + reps), retorna array de {grupo, xp} pra
 * creditar. Vazio se exercício não reconhecido.
 */
export function xpDaSerie(
  nomeExercicio: string,
  peso: number | null,
  reps: number | null,
): DeltaMastery[] {
  const distrib = distribuicaoDoExercicio(nomeExercicio);
  if (!distrib) return [];
  const total = XP_BASE_POR_SERIE * multiplicadorDaSerie(peso, reps);
  const out: DeltaMastery[] = [];
  for (const [grupo, peso_grupo] of Object.entries(distrib)) {
    if (!peso_grupo) continue;
    out.push({
      grupo: grupo as GrupoMuscular,
      xp: Math.round(total * peso_grupo),
    });
  }
  return out;
}
