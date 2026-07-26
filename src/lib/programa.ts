// ============================================================
// Programa de treino v11 (26/07 → 09/09).
// ------------------------------------------------------------
// Layout FIXO da semana baseado nos horários reais do Marcelo:
//   Seg-Sex 05:00-06:45 → musculação + dança 30 min
//   Seg/Qua/Sex 20:00-22:00 → taekwondo com sunbaenim (não editável)
//   Sab-Dom 2h descanso em movimento (cardio/mobilidade/dança longa)
//
// Sem dia de rest total — no máximo "descanso em movimento".
// Zero seleção de preset: um único plano canônico.
// ============================================================

export type TipoSessao =
  | "musculacao"
  | "tkd"
  | "danca"
  | "cardio"
  | "mobilidade";

export interface Exercicio {
  nome: string;
  series?: string; // "4 × 8-10"
  descanso_seg?: number;
  nota?: string;
}

export interface Sessao {
  hora: string;
  tipo: TipoSessao;
  titulo: string;
  descricao: string;
  duracao_min: number;
  exercicios?: Exercicio[];
  tkd_moves?: string[]; // techniques do dia (usadas nas quests)
  editavel: boolean;    // false = TKD com sunbaenim, não muda
}

export interface DiaPrograma {
  dia_semana: string;
  sessoes: Sessao[];
  observacao?: string;
}

// ────────────────────────────────────────────────────────
// SEGUNDA
// ────────────────────────────────────────────────────────
const SEG: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Push · Peito superior + Ombro + Tríceps",
    descricao: "Foco em peito superior (cutting). Composto pesado primeiro.",
    duracao_min: 105,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (halter)", series: "4 × 8-10", descanso_seg: 90 },
      { nome: "Supino reto (barra)", series: "3 × 8-10", descanso_seg: 90 },
      { nome: "Crucifixo inclinado", series: "3 × 12", descanso_seg: 60 },
      { nome: "Crossover polia alta", series: "3 × 12-15", descanso_seg: 60 },
      { nome: "Desenvolvimento militar", series: "4 × 8-10", descanso_seg: 90 },
      { nome: "Elevação lateral", series: "4 × 12-15", descanso_seg: 45 },
      { nome: "Tríceps corda", series: "3 × 12-15", descanso_seg: 60 },
      { nome: "Tríceps testa", series: "3 × 10-12", descanso_seg: 60 },
    ],
  },
  {
    hora: "após musculação",
    tipo: "danca",
    titulo: "Dança K-pop · 30 min",
    descricao: "Coreografia sorteada do dia (aba /danca) ou escolhida por você.",
    duracao_min: 30,
    editavel: true,
  },
  {
    hora: "20:00-22:00",
    tipo: "tkd",
    titulo: "Taekwondo · dojang do sunbaenim",
    descricao: "Programa do sabum. Foco típico de segunda: kicking + poomsae básico.",
    duracao_min: 120,
    editavel: false,
    tkd_moves: ["Ap Chagi", "Dollyo Chagi", "Yeop Chagi", "Poomsae Taegeuk 1"],
  },
];

// ────────────────────────────────────────────────────────
// TERÇA
// ────────────────────────────────────────────────────────
const TER: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Pull · Costas + Bíceps",
    descricao: "Largura + espessura de costas. Volume alto de puxada.",
    duracao_min: 105,
    editavel: true,
    exercicios: [
      { nome: "Barra fixa (peso corporal)", series: "4 × AMRAP", descanso_seg: 90 },
      { nome: "Puxada pronada", series: "4 × 10-12", descanso_seg: 75 },
      { nome: "Remada curvada (barra)", series: "4 × 8-10", descanso_seg: 90 },
      { nome: "Remada unilateral (halter)", series: "3 × 10 (cada)", descanso_seg: 60 },
      { nome: "Pulldown reto (barra)", series: "3 × 12", descanso_seg: 60 },
      { nome: "Rosca direta", series: "4 × 10-12", descanso_seg: 60 },
      { nome: "Rosca martelo", series: "3 × 10-12", descanso_seg: 60 },
    ],
  },
  {
    hora: "após musculação",
    tipo: "danca",
    titulo: "Dança K-pop · 30 min",
    descricao: "Coreografia sorteada do dia (aba /danca) ou escolhida por você.",
    duracao_min: 30,
    editavel: true,
  },
];

// ────────────────────────────────────────────────────────
// QUARTA
// ────────────────────────────────────────────────────────
const QUA: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Legs · Pernas + Glúteo + Panturrilha",
    descricao: "Composto pesado + isolador. Base pra kicks do TKD à noite.",
    duracao_min: 105,
    editavel: true,
    exercicios: [
      { nome: "Agachamento livre", series: "4 × 6-8", descanso_seg: 120 },
      { nome: "Leg press 45°", series: "4 × 10-12", descanso_seg: 90 },
      { nome: "Cadeira extensora", series: "3 × 12-15", descanso_seg: 60 },
      { nome: "Stiff", series: "4 × 10", descanso_seg: 90 },
      { nome: "Mesa flexora", series: "3 × 12", descanso_seg: 60 },
      { nome: "Elevação de quadril (glúteo)", series: "3 × 12", descanso_seg: 60 },
      { nome: "Panturrilha em pé", series: "4 × 15-20", descanso_seg: 45 },
    ],
  },
  {
    hora: "após musculação",
    tipo: "danca",
    titulo: "Dança K-pop · 30 min",
    descricao: "Coreografia sorteada do dia (aba /danca) ou escolhida por você.",
    duracao_min: 30,
    editavel: true,
  },
  {
    hora: "20:00-22:00",
    tipo: "tkd",
    titulo: "Taekwondo · dojang do sunbaenim",
    descricao: "Programa do sabum. Foco típico de quarta: sparring + drills de contra-ataque.",
    duracao_min: 120,
    editavel: false,
    tkd_moves: ["Bandal Chagi", "Momtong Bandae Jireugi", "Dwit Chagi", "Sparring 3×2min"],
  },
];

// ────────────────────────────────────────────────────────
// QUINTA
// ────────────────────────────────────────────────────────
const QUI: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Upper 2 · Peito superior 2º estímulo + Core",
    descricao: "2º estímulo de peito superior + core direto (abs para o V-taper).",
    duracao_min: 105,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (máquina)", series: "4 × 10-12", descanso_seg: 75 },
      { nome: "Peck deck (foco superior)", series: "3 × 12-15", descanso_seg: 60 },
      { nome: "Puxada supinada", series: "3 × 10-12", descanso_seg: 75 },
      { nome: "Face pull", series: "4 × 15", descanso_seg: 45 },
      { nome: "Crunch na polia", series: "4 × 15", descanso_seg: 45 },
      { nome: "Elevação de pernas (barra)", series: "4 × 10-12", descanso_seg: 60 },
      { nome: "Prancha", series: "3 × 60s", descanso_seg: 45 },
    ],
  },
  {
    hora: "após musculação",
    tipo: "danca",
    titulo: "Dança K-pop · 30 min",
    descricao: "Coreografia sorteada do dia (aba /danca) ou escolhida por você.",
    duracao_min: 30,
    editavel: true,
  },
];

// ────────────────────────────────────────────────────────
// SEXTA
// ────────────────────────────────────────────────────────
const SEX: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Ombros + braços · largura",
    descricao: "Ombro em prioridade + volume de braços. Cutting = manter braço cheio.",
    duracao_min: 105,
    editavel: true,
    exercicios: [
      { nome: "Desenvolvimento halter", series: "4 × 8-10", descanso_seg: 90 },
      { nome: "Elevação lateral", series: "5 × 12-15", descanso_seg: 45 },
      { nome: "Elevação frontal (polia)", series: "3 × 12", descanso_seg: 45 },
      { nome: "Crucifixo invertido (peck deck)", series: "4 × 12-15", descanso_seg: 45 },
      { nome: "Rosca scott", series: "3 × 10-12", descanso_seg: 60 },
      { nome: "Rosca martelo (corda)", series: "3 × 12", descanso_seg: 60 },
      { nome: "Tríceps francês (halter)", series: "3 × 10-12", descanso_seg: 60 },
      { nome: "Mergulho paralela", series: "3 × AMRAP", descanso_seg: 90 },
    ],
  },
  {
    hora: "após musculação",
    tipo: "danca",
    titulo: "Dança K-pop · 30 min",
    descricao: "Coreografia sorteada do dia (aba /danca) ou escolhida por você.",
    duracao_min: 30,
    editavel: true,
  },
  {
    hora: "20:00-22:00",
    tipo: "tkd",
    titulo: "Taekwondo · dojang do sunbaenim",
    descricao: "Programa do sabum. Foco típico de sexta: kicking combo + poomsae completo.",
    duracao_min: 120,
    editavel: false,
    tkd_moves: [
      "Neryeo Chagi",
      "Dollyo Chagi (combos)",
      "Poomsae Taegeuk 2",
      "Poomsae Taegeuk 3",
    ],
  },
];

// ────────────────────────────────────────────────────────
// SÁBADO — descanso em movimento
// ────────────────────────────────────────────────────────
const SAB: Sessao[] = [
  {
    hora: "livre (2h total)",
    tipo: "cardio",
    titulo: "Cardio longo · 60-75 min",
    descricao:
      "Corrida leve, caminhada em subida ou bike. Zona 2 (conversa possível). Queima gordura sem impactar recuperação.",
    duracao_min: 70,
    editavel: true,
  },
  {
    hora: "seguida do cardio",
    tipo: "mobilidade",
    titulo: "Core + mobilidade · 30 min",
    descricao: "Circuito curto de core + alongamento ativo (quadril, ombro, coluna).",
    duracao_min: 30,
    editavel: true,
    exercicios: [
      { nome: "Prancha", series: "3 × 45s" },
      { nome: "Prancha lateral", series: "3 × 30s (cada)" },
      { nome: "Dead bug", series: "3 × 10" },
      { nome: "Bird dog", series: "3 × 10" },
      { nome: "Alongamento cadeia posterior", series: "5 min" },
    ],
  },
];

// ────────────────────────────────────────────────────────
// DOMINGO — descanso em movimento
// ────────────────────────────────────────────────────────
const DOM: Sessao[] = [
  {
    hora: "livre (2h total)",
    tipo: "mobilidade",
    titulo: "Yoga + mobilidade · 60 min",
    descricao:
      "Yoga flow ou mobilidade guiada. Foca em abrir quadril (kicks TKD), ombro (push) e coluna. Regenera pra próxima semana.",
    duracao_min: 60,
    editavel: true,
  },
  {
    hora: "após yoga",
    tipo: "danca",
    titulo: "Dança longa · 60 min",
    descricao:
      "Sessão longa de dança K-pop (aba /danca). Aproveita pra tirar coreo nova sem pressão do relógio.",
    duracao_min: 60,
    editavel: true,
  },
];

// ────────────────────────────────────────────────────────
// PROGRAMA SEMANAL FIXO
// ────────────────────────────────────────────────────────
const PROGRAMA_SEMANAL: Record<number, DiaPrograma> = {
  0: { dia_semana: "Domingo", sessoes: DOM, observacao: "Descanso em movimento" },
  1: { dia_semana: "Segunda", sessoes: SEG },
  2: { dia_semana: "Terça", sessoes: TER },
  3: { dia_semana: "Quarta", sessoes: QUA },
  4: { dia_semana: "Quinta", sessoes: QUI },
  5: { dia_semana: "Sexta", sessoes: SEX },
  6: { dia_semana: "Sábado", sessoes: SAB, observacao: "Descanso em movimento" },
};

/** Programa de hoje baseado no dia da semana. */
export function programaDoDia(dow: number): DiaPrograma {
  return PROGRAMA_SEMANAL[dow];
}

/** Retorna todos os dias do programa entre agora e a data alvo (inclusive). */
export function programaAteMeta(
  hojeISO: string,
  metaISO = "2026-09-09",
): { data: string; dia: DiaPrograma }[] {
  const out: { data: string; dia: DiaPrograma }[] = [];
  const [hy, hm, hd] = hojeISO.split("-").map(Number);
  const [my, mm, md] = metaISO.split("-").map(Number);
  const inicio = Date.UTC(hy, hm - 1, hd);
  const fim = Date.UTC(my, mm - 1, md);
  if (fim < inicio) return out;
  for (let t = inicio; t <= fim; t += 86_400_000) {
    const dt = new Date(t);
    const iso = dt.toISOString().slice(0, 10);
    // getUTCDay: 0=Sun..6=Sat — usar direto no PROGRAMA_SEMANAL
    const dow = dt.getUTCDay();
    out.push({ data: iso, dia: PROGRAMA_SEMANAL[dow] });
  }
  return out;
}

/** TKD moves de hoje (usado pelas quests). */
export function tkdMovesDoDia(dow: number): string[] {
  const dia = PROGRAMA_SEMANAL[dow];
  const tkd = dia.sessoes.find((s) => s.tipo === "tkd");
  return tkd?.tkd_moves ?? [];
}

/** Nome amigável do tipo de sessão. */
export const LABEL_TIPO_SESSAO: Record<TipoSessao, string> = {
  musculacao: "Musculação",
  tkd: "Taekwondo",
  danca: "Dança",
  cardio: "Cardio",
  mobilidade: "Mobilidade",
};

/** Emoji do tipo (usado nos cards do programa). */
export const ICO_TIPO_SESSAO: Record<TipoSessao, string> = {
  musculacao: "🏋️",
  tkd: "🥋",
  danca: "💃",
  cardio: "🏃",
  mobilidade: "🧘",
};

// v11: split keys canônicos do programa (usados como `split` na tabela
// treino_exercicios). Prefixados com "prog_" pra distinguir dos antigos.
export const PROGRAMA_SPLIT_KEYS = [
  "prog_seg_push",
  "prog_ter_pull",
  "prog_qua_legs",
  "prog_qui_upper2",
  "prog_sex_shoulders_arms",
  "prog_sab_cardio_core",
  "prog_dom_yoga_danca",
] as const;

export type ProgramaSplitKey = (typeof PROGRAMA_SPLIT_KEYS)[number];

/** Mapa dia da semana (0=Dom..6=Sab) → chave do split do programa. */
export const DOW_TO_SPLIT_KEY: Record<number, ProgramaSplitKey> = {
  0: "prog_dom_yoga_danca",
  1: "prog_seg_push",
  2: "prog_ter_pull",
  3: "prog_qua_legs",
  4: "prog_qui_upper2",
  5: "prog_sex_shoulders_arms",
  6: "prog_sab_cardio_core",
};

/** Label amigável do split do programa (usa o título da sessão de musculação
 *  ou o título principal do dia). */
export const LABEL_PROGRAMA_SPLIT: Record<ProgramaSplitKey, string> = {
  prog_seg_push: "SEG · Push (peito + ombro + tríceps)",
  prog_ter_pull: "TER · Pull (costas + bíceps)",
  prog_qua_legs: "QUA · Legs (pernas + glúteo)",
  prog_qui_upper2: "QUI · Upper 2 + core",
  prog_sex_shoulders_arms: "SEX · Ombros + braços",
  prog_sab_cardio_core: "SAB · Cardio + core (descanso em movimento)",
  prog_dom_yoga_danca: "DOM · Yoga + dança longa (descanso em movimento)",
};

/** Gera as linhas de treino_exercicios pra sincronizar o /treino com o /plano.
 *  Cada exercício de musculação (+ cardio/mobilidade quando aplicável) vira
 *  uma linha com o split do dia. Sábado e domingo entram como referência —
 *  exercícios pequenos, mas ficam disponíveis pra logar. */
export function exerciciosDoPrograma(): Array<{
  nome: string;
  grupo: string;
  split: ProgramaSplitKey;
  ordem: number;
}> {
  const out: Array<{ nome: string; grupo: string; split: ProgramaSplitKey; ordem: number }> = [];
  for (const dow of [1, 2, 3, 4, 5, 6, 0]) {
    const key = DOW_TO_SPLIT_KEY[dow];
    const dia = PROGRAMA_SEMANAL[dow];
    let ordem = 0;
    for (const sessao of dia.sessoes) {
      if (!sessao.exercicios || sessao.exercicios.length === 0) continue;
      for (const ex of sessao.exercicios) {
        out.push({
          nome: ex.nome,
          grupo: inferGrupo(ex.nome, sessao.tipo),
          split: key,
          ordem: ordem++,
        });
      }
    }
  }
  return out;
}

/** Inferência simples de grupo muscular pelo nome do exercício. */
function inferGrupo(nome: string, tipoSessao: string): string {
  const n = nome.toLowerCase();
  if (tipoSessao === "cardio") return "cardio";
  if (tipoSessao === "mobilidade") return "core";
  if (n.includes("supino") || n.includes("crucifixo") || n.includes("crossover") || n.includes("peck")) return "peito";
  if (n.includes("puxada") || n.includes("remada") || n.includes("barra fixa") || n.includes("pulldown") || n.includes("face pull")) return "costas";
  if (n.includes("desenvolvimento") || n.includes("elevação lateral") || n.includes("elevação frontal") || n.includes("crucifixo invertido")) return "ombro";
  if (n.includes("rosca")) return "biceps";
  if (n.includes("tríceps") || n.includes("mergulho")) return "triceps";
  if (n.includes("agachamento") || n.includes("leg press") || n.includes("cadeira extensora") || n.includes("afundo") || n.includes("hack")) return "pernas";
  if (n.includes("stiff") || n.includes("mesa flexora") || n.includes("cadeira flexora") || n.includes("terra") || n.includes("elevação de quadril")) return "posterior";
  if (n.includes("panturrilha")) return "panturrilha";
  if (n.includes("prancha") || n.includes("crunch") || n.includes("ab wheel") || n.includes("cable woodchopper") || n.includes("dead bug") || n.includes("bird dog") || n.includes("elevação de pernas") || n.includes("rotação russa") || n.includes("abdominal") || n.includes("alongamento")) return "core";
  return "core";
}
