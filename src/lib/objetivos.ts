// ============================================================
// Módulo de Objetivos Físicos (v9) — ÊNFASE aditiva (não é mecânica nova nem
// prescrição de dieta). Cutting 17,8%→13% BF até 09/09/2026, físico V-taper.
// Framing anti-aversivo em todo texto ("a desenvolver", "última a sair",
// paciência). Fonte estruturada do objetivo: tabela `meta` (lib/data.ts::
// garantirMeta) — este arquivo é a ÊNFASE textual/estética, não os números.
// ============================================================

export interface PerfilObjetivos {
  prioridade: string;
  fortes: string[];
  desenvolver: string[];
  gorduraTeimosa: string;
  postura: string;
  meta: string;
}

// Seed atual — as 5 prioridades do V-taper, em ordem (Apêndice A).
export const OBJETIVOS: PerfilObjetivos = {
  prioridade: "Peito superior clavicular (inclinado, frequência 2×/semana) — prioridade nº 1",
  fortes: ["Costas (espessura)", "Braços", "Pernas"],
  desenvolver: [
    "Peito superior clavicular",
    "Deltoide lateral (largura de ombro)",
    "Largura de costas / latíssimo (viés vertical, não espessura)",
    "Abdômen (reto abdominal, com sobrecarga — sem oblíquo pesado)",
  ],
  gorduraTeimosa: "Abdômen baixo (sub-umbilical) + flanco — última região a sair",
  postura: "Puxar ≥ empurrar (leve protração de ombro por tempo em tela) — manter nesta fase",
  meta: "Cutting de 17,8% → 13% de BF até 09/09/2026 (~8 semanas), preservando massa, físico V-taper",
};

// Bloco corretivo postural — parte do treino (tooling), não reforço.
export interface ExercicioCorretivo {
  nome: string;
  foco: string;
}

export const BLOCO_POSTURAL: ExercicioCorretivo[] = [
  { nome: "Face pull", foco: "trapézio médio/inferior + rotadores externos" },
  { nome: "Remada (livre ou máquina)", foco: "costas — segura o puxar ≥ empurrar" },
  { nome: "Crucifixo invertido (rear delt)", foco: "deltoide posterior" },
  { nome: "Rotação externa com elástico/cabo", foco: "manguito rotador" },
  { nome: "Extensão torácica / mobilidade", foco: "abre o peitoral, alinha a postura" },
];

// Enquadramento anti-pânico do Espelho (só texto, passivo) — nota V-taper:
// cintura fina é ativo a proteger, nunca sobrecarregar oblíquo.
export const ESPELHO_FRAMING =
  "Barriga baixa e flanco são os ÚLTIMOS a sair — costas e braços revelam primeiro. " +
  "Se a cintura travar num platô, é o corpo respondendo na ordem normal, não fracasso. " +
  "Segura o curso. Cintura fina é um ativo do V-taper — por isso o abdômen é treinado " +
  "com sobrecarga no reto abdominal, evitando oblíquo pesado (que alargaria a cintura).";

// Ênfases passadas à Análise IA (sugestão, nunca prescrição). Resume as 5
// prioridades + a progressão de 8 semanas (semana 4 = deload, 8 = taper)
// pra IA sempre ter esse contexto ao avaliar aderência.
export const ENFASE_IA =
  "Objetivo: cutting 17,8%→13% BF até 09/09/2026, físico V-taper, preservando massa. " +
  "Prioridades nesta ordem: (1) peito superior clavicular — frequência 2×/semana " +
  "(inclinado dominante); (2) deltoide lateral — alto volume/frequência 3–4×, é o que " +
  "cria largura de ombro; (3) largura de costas/latíssimo — viés VERTICAL (puxada aberta/" +
  "barra fixa + pullover/braço reto), não espessura (remada fica em manutenção); " +
  "(4) abdômen — reto abdominal com sobrecarga progressiva, NUNCA oblíquo pesado (alargaria " +
  "a cintura); (5) pernas em manutenção (poupa recuperação no déficit). Progressão " +
  "autorregulada de 8 semanas: sem. 1–2 RIR2 (estabelece cargas), sem. 3 double " +
  "progression, sem. 4 DELOAD (volume -40–50%, RIR3), sem. 5–6 pico de estímulo " +
  "(RIR0–1, drop-sets nas prioridades), sem. 7 semana mais puxada, sem. 8 taper/leve. " +
  "Avalie aderência às prioridades e o timing de deload/taper pela semana atual do " +
  "programa (informada no contexto).";
