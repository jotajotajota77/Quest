// ============================================================
// Programa de treino v12.PR3 v2 — cutting 31 dias (10/08 → 09/09/2026).
// ------------------------------------------------------------
// Prioridades v2: PEITO (3× exposures) + ABS com carga (4×) +
// ombro lateral (V-taper 4× exposures). Mantém 7× musc + dança
// diária + TKD seg/qua/sex.
//
// A · Push #1 — Peito↑ + Ombro + Tríceps                 (seg · TKD noite)
// B · Pull    — Costas + Bíceps + Post deltoide          (ter · HARD)
// C · Legs    — Pernas + Glúteo + Panturrilha + Core     (qua · TKD noite)
// D · Push #2 — Peito↑ 2 + Ombro + ABS pesado #1         (qui · HARD)
// E · Arms    — Ombro/braço leve + ABS #2                (sex · TKD noite)
// F · Chest+  — Peito 3 + Ombro lateral + ABS #3         (sáb · 45 min)
// G · Regen   — Mobilidade + Core circuit + Cardio Z2    (dom)
// ============================================================

export type TipoSessao =
  | "musculacao"
  | "tkd"
  | "danca"
  | "cardio"
  | "mobilidade";

export interface Exercicio {
  nome: string;
  series?: string;
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
  tkd_moves?: string[];
  editavel: boolean;
}

export interface DiaPrograma {
  dia_semana: string;
  sessoes: Sessao[];
  observacao?: string;
}

// SEG · A · Push #1 (Peito↑ + Ombro + Tríceps) — TKD à noite
const SEG: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino A · Push #1 (Peito↑ + Ombro + Tríceps)",
    descricao: "Carga média — TKD à noite. Primeira dose de peito superior da semana.",
    duracao_min: 55,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (halter, 30°)", series: "4 × 6-10", descanso_seg: 120, nota: "RIR 2 · principal do peito da sem · escápula presa" },
      { nome: "Supino reto (máquina)", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · seguro pra progredir" },
      { nome: "Crucifixo inclinado (polia)", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · amplitude > carga" },
      { nome: "Desenvolvimento halter", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2" },
      { nome: "Elevação lateral", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · V-taper prioridade" },
      { nome: "Tríceps corda", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · abre no final" },
      { nome: "Tríceps testa", series: "2 × 8-12", descanso_seg: 75, nota: "opcional" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
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

// TER · B · Pull (Costas + Bíceps + Post deltoide) — HARD
const TER: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino B · Pull (Costas + Bíceps + Post)",
    descricao: "HARD. Sem TKD → puxa pesado. Volume alto pra dorsal (V-taper).",
    duracao_min: 65,
    editavel: true,
    exercicios: [
      { nome: "Barra fixa pronada", series: "4 × AMRAP", descanso_seg: 120, nota: "RIR 1 · se 12+, cinta com peso" },
      { nome: "Remada curvada (barra)", series: "4 × 6-10", descanso_seg: 120, nota: "RIR 2 · espessura" },
      { nome: "Puxada supinada", series: "3 × 8-12", descanso_seg: 90, nota: "RIR 2 · foco V" },
      { nome: "Remada unilateral (halter)", series: "3 × 10-12 (cada)", descanso_seg: 60, nota: "RIR 1 · cotovelo colado" },
      { nome: "Face pull (corda)", series: "4 × 15-20", descanso_seg: 45, nota: "RIR 1 · post deltoide 1º" },
      { nome: "Rosca direta", series: "3 × 8-10", descanso_seg: 75, nota: "RIR 1" },
      { nome: "Rosca martelo", series: "3 × 10-12", descanso_seg: 60, nota: "RIR 1 · braquial" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
];

// QUA · C · Legs + Core técnico — TKD à noite
const QUA: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino C · Legs + Core técnico (TKD à noite)",
    descricao: "Carga média — TKD à noite. Técnica > PR. Pallof press pra core anti-rotação.",
    duracao_min: 60,
    editavel: true,
    exercicios: [
      { nome: "Agachamento livre", series: "4 × 6-8", descanso_seg: 120, nota: "RIR 2-3 · nunca falha em TKD-day" },
      { nome: "Leg press 45°", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · quadríceps" },
      { nome: "Stiff (halter)", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2 · base do chute" },
      { nome: "Cadeira flexora", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · pausa 1s no topo" },
      { nome: "Elevação de quadril", series: "3 × 10-12", descanso_seg: 60, nota: "RIR 1 · glúteo · pausa 1s" },
      { nome: "Panturrilha em pé", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · pausa embaixo" },
      { nome: "Pallof press (polia)", series: "3 × 10 (cada)", descanso_seg: 45, nota: "RIR 1 · anti-rotação · core técnico" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
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

// QUI · D · Push #2 (Peito↑ 2 + Ombro + ABS pesado) — HARD
const QUI: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino D · Push #2 + ABS pesado (dia forte de peito+abs)",
    descricao: "HARD. 2º estímulo peito superior · ABS com CARGA — tratado como músculo, não circuito.",
    duracao_min: 65,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (barra)", series: "4 × 8-10", descanso_seg: 120, nota: "RIR 2 · 2º peito superior" },
      { nome: "Peck deck (foco superior)", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · isolador" },
      { nome: "Desenvolvimento arnold", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · rota completa" },
      { nome: "Elevação lateral (polia baixa)", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · unilateral" },
      { nome: "Face pull", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · post 2º" },
      { nome: "Crunch na polia (com peso)", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · ab COM carga = ab que cresce · progride toda semana" },
      { nome: "Elevação de pernas (barra)", series: "3 × 8-12", descanso_seg: 60, nota: "RIR 1 · ab inferior · pausa embaixo" },
      { nome: "Cable woodchopper", series: "3 × 10 (cada)", descanso_seg: 45, nota: "RIR 1 · oblíquo com carga" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
];

// SEX · E · Arms leve + ABS #2 — TKD à noite
const SEX: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino E · Shoulders/Arms leve + ABS #2",
    descricao: "Carga leve — TKD à noite. Ab dinâmico (ab wheel + reverse crunch).",
    duracao_min: 50,
    editavel: true,
    exercicios: [
      { nome: "Desenvolvimento halter", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2 · único composto do dia" },
      { nome: "Elevação lateral", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · varia halter/polia/máquina" },
      { nome: "Crucifixo invertido (peck deck)", series: "3 × 12-15", descanso_seg: 45, nota: "RIR 1 · post deltoide" },
      { nome: "Rosca scott", series: "3 × 8-12", descanso_seg: 60, nota: "RIR 1" },
      { nome: "Rosca martelo (corda)", series: "3 × 12", descanso_seg: 60, nota: "RIR 1 · braquial" },
      { nome: "Tríceps corda", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1" },
      { nome: "Ab wheel (rollout)", series: "3 × 6-10", descanso_seg: 60, nota: "RIR 1 · joelho no chão até dominar" },
      { nome: "Reverse crunch", series: "3 × 12-15", descanso_seg: 45, nota: "RIR 1 · ab inferior dinâmico" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
  {
    hora: "20:00-22:00",
    tipo: "tkd",
    titulo: "Taekwondo · dojang do sunbaenim",
    descricao: "Programa do sabum. Foco típico de sexta: kicking combo + poomsae completo.",
    duracao_min: 120,
    editavel: false,
    tkd_moves: ["Neryeo Chagi", "Dollyo Chagi (combos)", "Poomsae Taegeuk 2", "Poomsae Taegeuk 3"],
  },
];

// SÁB · F · Peito 3º + Ombro + ABS #3
const SAB: Sessao[] = [
  {
    hora: "05:00-06:00",
    tipo: "musculacao",
    titulo: "Treino F · Chest+ (Peito 3º + Ombro + ABS #3)",
    descricao: "45 min cirúrgicos. 3ª dose de peito + 5 séries dedicadas ao ombro lateral + prancha com carga.",
    duracao_min: 45,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (máquina)", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · 3ª exposure peito superior" },
      { nome: "Crossover polia alta", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · foco fibras médias" },
      { nome: "Elevação lateral (halter)", series: "5 × 12-15", descanso_seg: 45, nota: "RIR 1 · 5 SÉRIES DEDICADAS · meta: 12kg limpo" },
      { nome: "Face pull", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · post 3º da sem" },
      { nome: "Mergulho paralela", series: "3 × 8-12", descanso_seg: 90, nota: "RIR 1-2 · peito baixo + tríceps" },
      { nome: "Prancha com peso (nas costas)", series: "3 × 30-45s", descanso_seg: 45, nota: "core estático com carga · progride +2,5kg quando bater 45s" },
      { nome: "Panturrilha sentado", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · sóleo" },
    ],
  },
  { hora: "após musculação", tipo: "danca", titulo: "Dança K-pop · 30 min", descricao: "Coreografia do dia.", duracao_min: 30, editavel: true },
];

// DOM · G · Mobilidade + Core circuit + Cardio Z2
const DOM: Sessao[] = [
  {
    hora: "livre (90 min total)",
    tipo: "cardio",
    titulo: "Treino G · Cardio Z2 (45-60 min)",
    descricao: "Caminhada em subida, bike ou trote leve. Zona 2 (conversa possível). Queima gordura sem impacto na recuperação.",
    duracao_min: 55,
    editavel: true,
  },
  {
    hora: "seguido do cardio",
    tipo: "mobilidade",
    titulo: "Core circuito + mobilidade TKD",
    descricao: "3 rounds de core + rotina de mobilidade TKD.",
    duracao_min: 30,
    editavel: true,
    exercicios: [
      { nome: "Prancha", series: "3 × 45s" },
      { nome: "Prancha lateral", series: "3 × 30s (cada)" },
      { nome: "Dead bug", series: "3 × 10" },
      { nome: "Bird dog", series: "3 × 10" },
      { nome: "Hollow hold", series: "3 × 20s" },
      { nome: "Mobilidade TKD (90/90 · cossack · frog · WGS)", series: "15 min" },
    ],
  },
  { hora: "à tarde/noite", tipo: "danca", titulo: "Dança longa · 30-60 min", descricao: "Sessão livre — coreo nova sem pressão.", duracao_min: 45, editavel: true },
];

const PROGRAMA_SEMANAL: Record<number, DiaPrograma> = {
  0: { dia_semana: "Domingo", sessoes: DOM, observacao: "Treino G · regenerativo" },
  1: { dia_semana: "Segunda", sessoes: SEG },
  2: { dia_semana: "Terça", sessoes: TER },
  3: { dia_semana: "Quarta", sessoes: QUA },
  4: { dia_semana: "Quinta", sessoes: QUI },
  5: { dia_semana: "Sexta", sessoes: SEX },
  6: { dia_semana: "Sábado", sessoes: SAB, observacao: "Treino F · acessório curto" },
};

export function programaDoDia(dow: number): DiaPrograma {
  return PROGRAMA_SEMANAL[dow];
}

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
    const dow = dt.getUTCDay();
    out.push({ data: iso, dia: PROGRAMA_SEMANAL[dow] });
  }
  return out;
}

export function tkdMovesDoDia(dow: number): string[] {
  const dia = PROGRAMA_SEMANAL[dow];
  const tkd = dia.sessoes.find((s) => s.tipo === "tkd");
  return tkd?.tkd_moves ?? [];
}

export const LABEL_TIPO_SESSAO: Record<TipoSessao, string> = {
  musculacao: "Musculação",
  tkd: "Taekwondo",
  danca: "Dança",
  cardio: "Cardio",
  mobilidade: "Mobilidade",
};

export const ICO_TIPO_SESSAO: Record<TipoSessao, string> = {
  musculacao: "🏋️",
  tkd: "🥋",
  danca: "💃",
  cardio: "🏃",
  mobilidade: "🧘",
};

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

export const DOW_TO_SPLIT_KEY: Record<number, ProgramaSplitKey> = {
  0: "prog_dom_yoga_danca",
  1: "prog_seg_push",
  2: "prog_ter_pull",
  3: "prog_qua_legs",
  4: "prog_qui_upper2",
  5: "prog_sex_shoulders_arms",
  6: "prog_sab_cardio_core",
};

export const LABEL_PROGRAMA_SPLIT: Record<ProgramaSplitKey, string> = {
  prog_seg_push: "SEG · A · Push #1 (peito↑ + ombro + tríceps)",
  prog_ter_pull: "TER · B · Pull (costas + bíceps)",
  prog_qua_legs: "QUA · C · Legs + core técnico (TKD noite)",
  prog_qui_upper2: "QUI · D · Push #2 + ABS pesado",
  prog_sex_shoulders_arms: "SEX · E · Arms leve + ABS #2",
  prog_sab_cardio_core: "SÁB · F · Peito 3º + ombro + ABS #3",
  prog_dom_yoga_danca: "DOM · G · Regen (cardio Z2 + core + mob)",
};

export function exerciciosDoPrograma(): Array<{ nome: string; grupo: string; split: ProgramaSplitKey; ordem: number }> {
  const out: Array<{ nome: string; grupo: string; split: ProgramaSplitKey; ordem: number }> = [];
  for (const dow of [1, 2, 3, 4, 5, 6, 0]) {
    const key = DOW_TO_SPLIT_KEY[dow];
    const dia = PROGRAMA_SEMANAL[dow];
    let ordem = 0;
    for (const sessao of dia.sessoes) {
      if (!sessao.exercicios || sessao.exercicios.length === 0) continue;
      for (const ex of sessao.exercicios) {
        out.push({ nome: ex.nome, grupo: inferGrupo(ex.nome, sessao.tipo), split: key, ordem: ordem++ });
      }
    }
  }
  return out;
}

function inferGrupo(nome: string, tipoSessao: string): string {
  const n = nome.toLowerCase();
  if (tipoSessao === "cardio") return "cardio";
  if (tipoSessao === "mobilidade") return "core";
  if (n.includes("supino") || n.includes("crucifixo inclin") || n.includes("crossover") || n.includes("peck") || n.includes("mergulho")) return "peito";
  if (n.includes("puxada") || n.includes("remada") || n.includes("barra fixa") || n.includes("pulldown") || n.includes("pullover")) return "costas";
  if (n.includes("desenvolvimento") || n.includes("arnold") || n.includes("elevação lateral") || n.includes("elevação frontal") || n.includes("crucifixo invertido") || n.includes("face pull")) return "ombro";
  if (n.includes("rosca")) return "biceps";
  if (n.includes("tríceps")) return "triceps";
  if (n.includes("agachamento") || n.includes("leg press") || n.includes("cadeira extensora") || n.includes("afundo") || n.includes("hack") || n.includes("búlgaro") || n.includes("bulgarian")) return "pernas";
  if (n.includes("stiff") || n.includes("mesa flexora") || n.includes("cadeira flexora") || n.includes("terra") || n.includes("elevação de quadril") || n.includes("hip thrust") || n.includes("adução")) return "posterior";
  if (n.includes("panturrilha")) return "panturrilha";
  if (n.includes("prancha") || n.includes("crunch") || n.includes("ab wheel") || n.includes("woodchopper") || n.includes("dead bug") || n.includes("bird dog") || n.includes("hollow") || n.includes("elevação de pernas") || n.includes("rotação russa") || n.includes("abdominal") || n.includes("pallof") || n.includes("reverse crunch") || n.includes("mobilidade")) return "core";
  return "core";
}
