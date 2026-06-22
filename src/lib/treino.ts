// ============================================================
// Domínio do módulo de treino rico (TRAVA 6) — TOOLING, não reforço.
// ------------------------------------------------------------
// O reforço do treino continua sendo só a camada universal (hit-confirm +
// atributo). Isto aqui é UTILIDADE: plano, variar, PR, glossário. Serve o
// operante forte como ferramenta (alavanca de Premack) — não esmaece nada.
// ============================================================

export type Preset = "ABC" | "UL" | "PPL";

export interface ExercicioPreset {
  nome: string;
  grupo: string; // grupo muscular → base do "Variar"
  split: string; // A/B/C | upper/lower | push/pull/legs
}

export const PRESETS: Record<Preset, { rotulo: string; itens: ExercicioPreset[] }> = {
  ABC: {
    rotulo: "ABC",
    itens: [
      { nome: "Supino reto", grupo: "peito", split: "A" },
      { nome: "Supino inclinado", grupo: "peito", split: "A" },
      { nome: "Tríceps corda", grupo: "triceps", split: "A" },
      { nome: "Tríceps testa", grupo: "triceps", split: "A" },
      { nome: "Barra fixa", grupo: "costas", split: "B" },
      { nome: "Remada curvada", grupo: "costas", split: "B" },
      { nome: "Rosca direta", grupo: "biceps", split: "B" },
      { nome: "Rosca martelo", grupo: "biceps", split: "B" },
      { nome: "Agachamento", grupo: "pernas", split: "C" },
      { nome: "Leg press", grupo: "pernas", split: "C" },
      { nome: "Desenvolvimento", grupo: "ombro", split: "C" },
      { nome: "Elevação lateral", grupo: "ombro", split: "C" },
    ],
  },
  UL: {
    rotulo: "Upper / Lower",
    itens: [
      { nome: "Supino reto", grupo: "peito", split: "upper" },
      { nome: "Remada curvada", grupo: "costas", split: "upper" },
      { nome: "Desenvolvimento", grupo: "ombro", split: "upper" },
      { nome: "Rosca direta", grupo: "biceps", split: "upper" },
      { nome: "Tríceps corda", grupo: "triceps", split: "upper" },
      { nome: "Agachamento", grupo: "pernas", split: "lower" },
      { nome: "Stiff", grupo: "posterior", split: "lower" },
      { nome: "Leg press", grupo: "pernas", split: "lower" },
      { nome: "Cadeira extensora", grupo: "pernas", split: "lower" },
      { nome: "Panturrilha em pé", grupo: "panturrilha", split: "lower" },
    ],
  },
  PPL: {
    rotulo: "Push / Pull / Legs",
    itens: [
      { nome: "Supino reto", grupo: "peito", split: "push" },
      { nome: "Desenvolvimento", grupo: "ombro", split: "push" },
      { nome: "Elevação lateral", grupo: "ombro", split: "push" },
      { nome: "Tríceps corda", grupo: "triceps", split: "push" },
      { nome: "Barra fixa", grupo: "costas", split: "pull" },
      { nome: "Remada curvada", grupo: "costas", split: "pull" },
      { nome: "Rosca direta", grupo: "biceps", split: "pull" },
      { nome: "Rosca martelo", grupo: "biceps", split: "pull" },
      { nome: "Agachamento", grupo: "pernas", split: "legs" },
      { nome: "Stiff", grupo: "posterior", split: "legs" },
      { nome: "Panturrilha em pé", grupo: "panturrilha", split: "legs" },
    ],
  },
};

/** Pool de alternativas por grupo muscular — base do botão "Variar". */
export const ALTERNATIVAS: Record<string, string[]> = {
  peito: ["Supino reto", "Supino inclinado", "Crucifixo", "Crossover", "Flexão", "Supino máquina"],
  costas: ["Barra fixa", "Remada curvada", "Puxada", "Remada baixa", "Remada unilateral", "Pulldown"],
  ombro: ["Desenvolvimento", "Elevação lateral", "Elevação frontal", "Arnold press", "Desenvolvimento máquina"],
  triceps: ["Tríceps corda", "Tríceps testa", "Tríceps francês", "Mergulho", "Tríceps coice"],
  biceps: ["Rosca direta", "Rosca martelo", "Rosca scott", "Rosca alternada", "Rosca concentrada"],
  pernas: ["Agachamento", "Leg press", "Cadeira extensora", "Hack squat", "Afundo"],
  posterior: ["Stiff", "Mesa flexora", "Cadeira flexora", "Terra romeno"],
  panturrilha: ["Panturrilha em pé", "Panturrilha sentado", "Panturrilha no leg"],
};

export function variarExercicio(grupo: string, atual: string): string {
  const pool = (ALTERNATIVAS[grupo] ?? []).filter((n) => n !== atual);
  if (pool.length === 0) return atual;
  return pool[Math.floor(Math.random() * pool.length)];
}

/** Glossário de técnica — opt-in, sem atrito. */
export const GLOSSARIO: { termo: string; def: string }[] = [
  { termo: "Drop-set", def: "Ao falhar, reduz o peso na hora e continua sem descanso." },
  { termo: "Rest-pause", def: "Falhou, descansa 10–15s e arranca mais algumas reps no mesmo peso." },
  { termo: "AMRAP", def: "As Many Reps As Possible — máximo de reps com boa forma na série." },
  { termo: "Myo-reps", def: "Uma série de ativação até quase falhar + mini-séries com pausas curtas." },
  { termo: "Super-série", def: "Dois exercícios seguidos sem descanso entre eles." },
  { termo: "Bi-set", def: "Dois exercícios do mesmo grupo, em sequência, sem pausa." },
  { termo: "RIR / RPE", def: "Reps in Reserve / esforço percebido — quão perto da falha você parou." },
  { termo: "Tempo", def: "Cadência controlada (ex.: 3s descendo) para mais tensão." },
];

export const TEMPOS_DESCANSO = [60, 90, 120, 180];

// Catálogo plano de exercícios disponíveis (montado do zero) — base do
// seletor de "adicionar exercício". Derivado das ALTERNATIVAS + extras.
export interface ExercicioCatalogo {
  nome: string;
  grupo: string;
}

export const CATALOGO: ExercicioCatalogo[] = Object.entries(ALTERNATIVAS)
  .flatMap(([grupo, nomes]) => nomes.map((nome) => ({ nome, grupo })))
  .concat([
    { nome: "Levantamento terra", grupo: "costas" },
    { nome: "Encolhimento (trapézio)", grupo: "costas" },
    { nome: "Abdominal", grupo: "core" },
    { nome: "Prancha", grupo: "core" },
    { nome: "Elevação de pernas", grupo: "core" },
    { nome: "Face pull", grupo: "ombro" },
  ]);

export const GRUPOS = [
  "peito", "costas", "ombro", "biceps", "triceps",
  "pernas", "posterior", "panturrilha", "core",
];
