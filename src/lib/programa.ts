// ============================================================
// Programa de treino v12.PR3 — cutting 31 dias (10/08 → 09/09/2026).
// ------------------------------------------------------------
// Layout FIXO da semana (7× musculação + dança diária + TKD seg/qua/sex):
//   Seg-Sex 05:00-06:45 → musculação + dança 30 min
//   Sáb 05:00-06:00 → musculação acessório curto (F) + dança
//   Dom livre 60-90 min → mobilidade + core + cardio Z2 (G) + dança longa
//   Seg/Qua/Sex 20:00-22:00 → taekwondo com sunbaenim (não editável)
//
// A–G segue o Personal-Trainer plan de 31 dias:
//   A · Push (Peito↑ + Ombro + Tríceps) — TKD noite (médio)
//   B · Pull (Costas + Bíceps + Post) — HARD
//   C · Legs (Pernas + Glúteo + Panturrilha) — TKD noite (RIR 2-3, unilateral)
//   D · Upper 2 (Peito↑ 2 + Ombro + Core) — HARD
//   E · Shoulders/Arms leve + Costas 2 — TKD noite (LEVE)
//   F · Ombros/Braços acessório — 30-40 min, foco V-taper
//   G · Mobilidade + Core + Cardio Z2 — regenerativo
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
// SEGUNDA · Treino A · Push (Peito↑ + Ombro + Tríceps)
// TKD à noite → carga média, RIR 2, 45–55 min.
// ────────────────────────────────────────────────────────
const SEG: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino A · Push (Peito↑ + Ombro + Tríceps)",
    descricao: "Carga média — TKD à noite. Prioridade: peito superior + deltoide lateral.",
    duracao_min: 55,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (halter)", series: "4 × 6-10", descanso_seg: 120, nota: "RIR 2 · escápula presa" },
      { nome: "Supino reto (máquina)", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2" },
      { nome: "Crucifixo inclinado (polia)", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · amplitude" },
      { nome: "Desenvolvimento halter", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2" },
      { nome: "Elevação lateral", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · PRIORIDADE V-taper" },
      { nome: "Tríceps corda", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · abre no final" },
      { nome: "Tríceps testa", series: "2 × 8-12", descanso_seg: 75, nota: "opcional se sobrar tempo" },
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
// TERÇA · Treino B · Pull (Costas + Bíceps + Post. deltoide)
// Sem TKD → dia mais pesado da semana, RIR 1-2, 55-65 min.
// ────────────────────────────────────────────────────────
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
      { nome: "Pullover na polia", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · dorsal isolado" },
      { nome: "Face pull (corda)", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · post. deltoide" },
      { nome: "Rosca direta", series: "3 × 8-10", descanso_seg: 75, nota: "RIR 1" },
      { nome: "Rosca martelo", series: "3 × 10-12", descanso_seg: 60, nota: "RIR 1 · braquial" },
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
// QUARTA · Treino C · Legs (Pernas + Glúteo + Panturrilha)
// TKD à noite → RIR 2-3 no composto pesado. Nunca destruir pernas.
// ────────────────────────────────────────────────────────
const QUA: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino C · Legs (foco unilateral · TKD à noite)",
    descricao: "Carga média — TKD à noite. Técnica > PR. Base pros kicks.",
    duracao_min: 60,
    editavel: true,
    exercicios: [
      { nome: "Agachamento livre", series: "4 × 6-8", descanso_seg: 120, nota: "RIR 2-3 · nunca falha em TKD-day" },
      { nome: "Leg press 45°", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · pés médios · quadríceps" },
      { nome: "Stiff (halter)", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2 · base do chute" },
      { nome: "Cadeira flexora", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · pausa 1s no topo" },
      { nome: "Elevação de quadril", series: "3 × 10-12", descanso_seg: 60, nota: "RIR 1 · glúteo · pausa 1s" },
      { nome: "Adução na máquina", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · adutores · kick lateral" },
      { nome: "Panturrilha em pé", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · pausa embaixo" },
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
// QUINTA · Treino D · Upper 2 (Peito↑ 2 + Ombro + Core)
// Sem TKD → HARD. Core direto com carga (crunch polia + elevação pernas).
// ────────────────────────────────────────────────────────
const QUI: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino D · Upper 2 + Core (com carga)",
    descricao: "HARD. 2º estímulo peito superior. Core tratado como músculo — crunch polia com peso.",
    duracao_min: 65,
    editavel: true,
    exercicios: [
      { nome: "Supino inclinado (barra)", series: "4 × 8-10", descanso_seg: 120, nota: "RIR 2 · 2º peito superior" },
      { nome: "Peck deck (foco superior)", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1 · isolador" },
      { nome: "Desenvolvimento halter", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · arnold ok" },
      { nome: "Elevação lateral (polia baixa)", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · unilateral · tensão contínua" },
      { nome: "Face pull", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · post 2º" },
      { nome: "Puxada supinada", series: "3 × 10-12", descanso_seg: 75, nota: "RIR 1 · equilíbrio push/pull" },
      { nome: "Crunch na polia (com peso)", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · ab COM carga = ab que cresce" },
      { nome: "Elevação de pernas (barra)", series: "3 × 8-12", descanso_seg: 60, nota: "RIR 1 · ab inferior" },
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
// SEXTA · Treino E · Shoulders/Arms leve + Costas 2
// TKD à noite → LEVE. Chega no dojang com sistema descansado.
// ────────────────────────────────────────────────────────
const SEX: Sessao[] = [
  {
    hora: "05:00-06:45",
    tipo: "musculacao",
    titulo: "Treino E · Shoulders/Arms leve + Costas 2",
    descricao: "Carga leve — TKD à noite. Braço + ombro isolador. Um composto só.",
    duracao_min: 50,
    editavel: true,
    exercicios: [
      { nome: "Desenvolvimento halter", series: "3 × 8-10", descanso_seg: 90, nota: "RIR 2 · único composto" },
      { nome: "Elevação lateral", series: "4 × 12-15", descanso_seg: 45, nota: "RIR 1 · varia halter/polia/máquina" },
      { nome: "Puxada aberta", series: "3 × 10-12", descanso_seg: 75, nota: "RIR 1 · costas 2 leve" },
      { nome: "Crucifixo invertido (peck deck)", series: "3 × 12-15", descanso_seg: 45, nota: "RIR 1 · post deltoide" },
      { nome: "Rosca scott", series: "3 × 8-12", descanso_seg: 60, nota: "RIR 1" },
      { nome: "Rosca martelo (corda)", series: "3 × 12", descanso_seg: 60, nota: "RIR 1 · braquial" },
      { nome: "Tríceps corda", series: "3 × 12-15", descanso_seg: 60, nota: "RIR 1" },
      { nome: "Tríceps francês (halter)", series: "3 × 10-12", descanso_seg: 60, nota: "RIR 1 · cabeça longa" },
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
// SÁBADO · Treino F · Ombros/Braços acessório
// Standalone 30–40 min. Volume extra pra V-taper.
// ────────────────────────────────────────────────────────
const SAB: Sessao[] = [
  {
    hora: "05:00-06:00",
    tipo: "musculacao",
    titulo: "Treino F · Ombros/Braços acessório (curto)",
    descricao: "30-40 min cirúrgicos. 5 séries dedicadas ao lateral. Foco V-taper.",
    duracao_min: 40,
    editavel: true,
    exercicios: [
      { nome: "Desenvolvimento arnold", series: "3 × 10-12", descanso_seg: 90, nota: "RIR 2 · aquece ombro" },
      { nome: "Elevação lateral (halter)", series: "5 × 12-15", descanso_seg: 45, nota: "RIR 1 · 5 SÉRIES DEDICADAS · meta: 12kg limpo em 31d" },
      { nome: "Face pull", series: "4 × 15-20", descanso_seg: 45, nota: "RIR 1 · post 3º da sem" },
      { nome: "Crucifixo invertido (banco 30°)", series: "3 × 15", descanso_seg: 45, nota: "RIR 1 · peito no chão" },
      { nome: "Rosca 21 (7+7+7)", series: "2 × 21", descanso_seg: 90, nota: "RIR 1 · estímulo diferente" },
      { nome: "Mergulho paralela", series: "3 × 8-12", descanso_seg: 90, nota: "RIR 1-2 · peso corporal" },
      { nome: "Panturrilha sentado", series: "3 × 15-20", descanso_seg: 45, nota: "RIR 1 · sóleo" },
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
// DOMINGO · Treino G · Mobilidade + Core + Cardio Z2
// Regenerativo. Sem musculação de força — só manutenção.
// ────────────────────────────────────────────────────────
const DOM: Sessao[] = [
  {
    hora: "livre (90 min total)",
    tipo: "cardio",
    titulo: "Treino G · Cardio Z2 (45-60 min)",
    descricao:
      "Caminhada em subida, bike ou trote leve. Zona 2 = dá pra conversar em frases. Queima gordura sem impacto na recuperação.",
    duracao_min: 55,
    editavel: true,
  },
  {
    hora: "seguido do cardio",
    tipo: "mobilidade",
    titulo: "Core circuito + mobilidade global",
    descricao: "3 rounds de core + rotina de mobilidade TKD (§11 do plano).",
    duracao_min: 30,
    editavel: true,
    exercicios: [
      { nome: "Prancha", series: "3 × 45s", nota: "core estabilizador" },
      { nome: "Prancha lateral", series: "3 × 30s (cada)", nota: "oblíquo" },
      { nome: "Dead bug", series: "3 × 10", nota: "controle lombar" },
      { nome: "Bird dog", series: "3 × 10", nota: "coordenação" },
      { nome: "Pallof press", series: "3 × 10 (cada)", nota: "anti-rotação" },
      { nome: "Mobilidade TKD (90/90 · cossack · frog · WGS)", series: "15 min" },
    ],
  },
  {
    hora: "à tarde/noite",
    tipo: "danca",
    titulo: "Dança longa · 30-60 min",
    descricao:
      "Sessão longa de dança K-pop (aba /danca). Aproveita pra tirar coreo nova sem pressão do relógio.",
    duracao_min: 45,
    editavel: true,
  },
];

// ────────────────────────────────────────────────────────
// PROGRAMA SEMANAL FIXO
// ────────────────────────────────────────────────────────
const PROGRAMA_SEMANAL: Record<number, DiaPrograma> = {
  0: { dia_semana: "Domingo", sessoes: DOM, observacao: "Treino G · regenerativo" },
  1: { dia_semana: "Segunda", sessoes: SEG },
  2: { dia_semana: "Terça", sessoes: TER },
  3: { dia_semana: "Quarta", sessoes: QUA },
  4: { dia_semana: "Quinta", sessoes: QUI },
  5: { dia_semana: "Sexta", sessoes: SEX },
  6: { dia_semana: "Sábado", sessoes: SAB, observacao: "Treino F · acessório curto" },
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
// v12 PR3: SAB deixou de ser "cardio_core" — agora é ombros/braços acessório
// (treino F). Mantivemos a chave por compatibilidade com dados históricos.
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

/** Label amigável do split do programa. v12 PR3: labels refletem o novo A-G. */
export const LABEL_PROGRAMA_SPLIT: Record<ProgramaSplitKey, string> = {
  prog_seg_push: "SEG · A · Push (peito↑ + ombro + tríceps)",
  prog_ter_pull: "TER · B · Pull (costas + bíceps)",
  prog_qua_legs: "QUA · C · Legs (unilateral, TKD noite)",
  prog_qui_upper2: "QUI · D · Upper 2 + core com carga",
  prog_sex_shoulders_arms: "SEX · E · Shoulders/arms leve",
  prog_sab_cardio_core: "SÁB · F · Ombro/braço acessório",
  prog_dom_yoga_danca: "DOM · G · Mobilidade + cardio Z2",
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
  if (n.includes("supino") || n.includes("crucifixo inclin") || n.includes("crossover") || n.includes("peck") || n.includes("mergulho")) return "peito";
  if (n.includes("puxada") || n.includes("remada") || n.includes("barra fixa") || n.includes("pulldown") || n.includes("pullover")) return "costas";
  if (n.includes("desenvolvimento") || n.includes("arnold") || n.includes("elevação lateral") || n.includes("elevação frontal") || n.includes("crucifixo invertido") || n.includes("face pull")) return "ombro";
  if (n.includes("rosca")) return "biceps";
  if (n.includes("tríceps")) return "triceps";
  if (n.includes("agachamento") || n.includes("leg press") || n.includes("cadeira extensora") || n.includes("afundo") || n.includes("hack") || n.includes("búlgaro") || n.includes("bulgarian")) return "pernas";
  if (n.includes("stiff") || n.includes("mesa flexora") || n.includes("cadeira flexora") || n.includes("terra") || n.includes("elevação de quadril") || n.includes("hip thrust") || n.includes("adução")) return "posterior";
  if (n.includes("panturrilha")) return "panturrilha";
  if (n.includes("prancha") || n.includes("crunch") || n.includes("ab wheel") || n.includes("cable woodchopper") || n.includes("dead bug") || n.includes("bird dog") || n.includes("elevação de pernas") || n.includes("rotação russa") || n.includes("abdominal") || n.includes("pallof") || n.includes("mobilidade")) return "core";
  return "core";
}
