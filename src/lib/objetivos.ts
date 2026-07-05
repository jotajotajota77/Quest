// ============================================================
// Módulo de Objetivos Físicos — ÊNFASE aditiva (não é mecânica nova nem prescrição
// de dieta). Deriva de análise de fotos/medidas do usuário; editável. Framing
// anti-aversivo em todo texto ("a desenvolver", "última a sair", paciência).
// ============================================================

export interface PerfilObjetivos {
  prioridade: string;
  fortes: string[];
  desenvolver: string[];
  gorduraTeimosa: string;
  postura: string;
  meta: string;
}

// Seed atual (editável quando o usuário reavaliar).
export const OBJETIVOS: PerfilObjetivos = {
  prioridade: "Peito — parte alta (inclinado primeiro), sobrecarga progressiva e amplitude",
  fortes: ["Costas (largura, V)", "Ombros", "Braços"],
  desenvolver: ["Peito (está atrás do resto — foco na parte alta)"],
  gorduraTeimosa: "Abdômen baixo (sub-umbilical) + flanco — última região a sair",
  postura: "Leve protração de ombro (empurrar > puxar + tempo em tela) — manter puxar ≥ empurrar nesta fase",
  meta: "Cutting de ~18% → ~12–13% de BF, preservando massa",
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

// Enquadramento anti-pânico do Espelho (só texto, passivo).
export const ESPELHO_FRAMING =
  "Barriga baixa e flanco são os ÚLTIMOS a sair — costas e braços revelam primeiro. " +
  "Se a cintura travar num platô, é o corpo respondendo na ordem normal, não fracasso. Segura o curso.";

// Ênfases passadas à Análise IA (sugestão, nunca prescrição).
export const ENFASE_IA =
  "Prioridade: peito (parte alta / inclinado). Postura: manter puxar ≥ empurrar " +
  "(leve protração de ombro). Objetivo: cutting preservando massa. Considere grupos " +
  "atrasados (peito) e equilíbrio empurrar/puxar ao comentar.";
