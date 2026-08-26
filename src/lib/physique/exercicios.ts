// ============================================================
// Adaptive Physique RPG — catálogo de exercícios (PR2, §12-13).
// ------------------------------------------------------------
// Espelho client-side do `exercise_definition` seedado na 0036.
// A UI usa daqui pra descobrir o metric_type sem round-trip.
// A tabela do banco é a fonte da verdade em queries; este mapa é o
// fallback determinístico pra rendering + validação.
// ============================================================

export type MetricType =
  | "weight_reps"
  | "bw_reps"
  | "bw_assisted"
  | "bw_weighted"
  | "time"
  | "distance"
  | "duration"
  | "interval"
  | "custom";

export interface SerieCampos {
  peso?: number | null;
  reps?: number | null;
  seconds?: number | null;
  assist_kg?: number | null;
  bodyweight_used_kg?: number | null;
  distance_m?: number | null;
  intensity?: number | null;
  rir?: number | null;
  rpe?: number | null;
}

// Mapa nome → metric_type. Chaves em lowercase sem acento pra bater
// com `normalizar(nomeExercicio)`.
const METRIC_POR_NOME: Record<string, MetricType> = {
  "supino reto": "weight_reps",
  "supino inclinado": "weight_reps",
  "supino maquina": "weight_reps",
  "crucifixo": "weight_reps",
  "crossover": "weight_reps",
  "flexao": "bw_reps",
  "barra fixa": "bw_reps",
  "puxada": "weight_reps",
  "pulldown": "weight_reps",
  "remada curvada": "weight_reps",
  "remada baixa": "weight_reps",
  "remada unilateral": "weight_reps",
  "levantamento terra": "weight_reps",
  "encolhimento (trapezio)": "weight_reps",
  "encolhimento": "weight_reps",
  "desenvolvimento": "weight_reps",
  "desenvolvimento maquina": "weight_reps",
  "arnold press": "weight_reps",
  "elevacao lateral": "weight_reps",
  "elevacao frontal": "weight_reps",
  "face pull": "weight_reps",
  "rosca direta": "weight_reps",
  "rosca martelo": "weight_reps",
  "rosca scott": "weight_reps",
  "rosca alternada": "weight_reps",
  "rosca concentrada": "weight_reps",
  "triceps corda": "weight_reps",
  "triceps testa": "weight_reps",
  "triceps frances": "weight_reps",
  "triceps coice": "weight_reps",
  "mergulho": "bw_reps",
  "agachamento": "weight_reps",
  "leg press": "weight_reps",
  "hack squat": "weight_reps",
  "afundo": "weight_reps",
  "cadeira extensora": "weight_reps",
  "stiff": "weight_reps",
  "mesa flexora": "weight_reps",
  "cadeira flexora": "weight_reps",
  "terra romeno": "weight_reps",
  "panturrilha em pe": "weight_reps",
  "panturrilha sentado": "weight_reps",
  "panturrilha no leg": "weight_reps",
  "crunch na polia": "weight_reps",
  "abdominal": "bw_reps",
  "abdominal declinado": "bw_reps",
  "elevacao de pernas": "bw_reps",
  "prancha": "time",
  "prancha lateral": "time",
  "ab wheel": "bw_reps",
  "dead bug": "bw_reps",
  "rotacao russa": "weight_reps",
  "cable woodchopper": "weight_reps",
  "esteira": "duration",
  "bike": "duration",
  "corda": "duration",
  "eliptico": "duration",
  "remo": "distance",
  "hiit": "interval",
};

export function metricTypeDe(nomeExercicio: string): MetricType {
  const k = normalizar(nomeExercicio);
  // 1) match exato.
  const exato = METRIC_POR_NOME[k];
  if (exato) return exato;
  // 2) contains — cobre "Supino inclinado (halter, 30°)" → "supino inclinado",
  //    "Barra fixa pronada" → "barra fixa", "Prancha lateral" → "prancha".
  //    Ordena por chave mais longa primeiro pra evitar match parcial ruim
  //    ("supino" bateria antes de "supino inclinado").
  const chaves = Object.keys(METRIC_POR_NOME).sort((a, b) => b.length - a.length);
  for (const key of chaves) {
    if (k.includes(key)) return METRIC_POR_NOME[key];
  }
  // 3) heurísticas por palavra-chave em nomes NÃO cadastrados.
  if (/\b(prancha|plank)\b/.test(k)) return "time";
  if (/\b(pallof|dead bug|hollow hold|wall sit)\b/.test(k)) return "time";
  if (/\b(esteira|bike|corda|eliptico|hiit|caminhada|corrida)\b/.test(k)) return "duration";
  if (/\b(barra fixa|pull[- ]?up|chin[- ]?up|dip|paralel|flexao|push[- ]?up|abdominal|crunch|leg raise|eleva.*pernas|hip thrust|glute bridge|ab wheel)\b/.test(k)) return "bw_reps";
  return "weight_reps";
}

/** Rótulo humano curto do tipo. */
export const METRIC_LABEL: Record<MetricType, string> = {
  weight_reps: "kg × reps",
  bw_reps: "peso corporal × reps",
  bw_assisted: "assistido × reps",
  bw_weighted: "com carga × reps",
  time: "tempo (s)",
  distance: "distância (m)",
  duration: "duração (s)",
  interval: "intervalo",
  custom: "livre",
};

/**
 * Formata uma série pra histórico. Retorna string curta, tipo:
 *   weight_reps → "60kg × 8"
 *   bw_reps    → "8 reps"
 *   bw_weighted→ "+15kg × 5"
 *   bw_assisted→ "-25kg × 8"
 *   time       → "45s"
 *   distance   → "1200m"
 *   duration   → "20min"
 *   interval   → "8 × 30s"
 */
export function formatarSerie(metric: MetricType, s: SerieCampos): string {
  switch (metric) {
    case "weight_reps":
      return `${s.peso ?? "–"}kg × ${s.reps ?? "–"}`;
    case "bw_reps":
      return `${s.reps ?? "–"} reps`;
    case "bw_weighted":
      return `+${s.peso ?? "–"}kg × ${s.reps ?? "–"}`;
    case "bw_assisted":
      return `-${s.assist_kg ?? "–"}kg × ${s.reps ?? "–"}`;
    case "time":
      return `${s.seconds ?? "–"}s`;
    case "distance":
      return `${s.distance_m ?? "–"}m`;
    case "duration": {
      const sec = s.seconds ?? 0;
      return sec >= 60 ? `${Math.round(sec / 60)}min` : `${sec}s`;
    }
    case "interval":
      return `${s.reps ?? "–"} × ${s.seconds ?? "–"}s`;
    case "custom":
      return s.reps != null ? `${s.reps} × ${s.intensity ?? "?"}` : `intensidade ${s.intensity ?? "?"}`;
  }
}

/**
 * Determina se uma série é PR comparada ao melhor histórico.
 * Cada metric_type tem sua própria dimensão de PR — PR3 vai lidar com
 * PRs multidimensionais; aqui é a heurística mínima do PR2.
 */
export function ehPr(metric: MetricType, atual: SerieCampos, melhor: SerieCampos | null): boolean {
  if (!melhor) {
    // primeira série do exercício conta como marco de base — mas não
    // como PR real (evita o "PR de +5kg" da prancha).
    return false;
  }
  switch (metric) {
    case "weight_reps":
    case "bw_weighted":
      return (atual.peso ?? -Infinity) >= (melhor.peso ?? -Infinity);
    case "bw_reps":
      return (atual.reps ?? -Infinity) > (melhor.reps ?? -Infinity);
    case "time":
    case "duration":
      return (atual.seconds ?? -Infinity) > (melhor.seconds ?? -Infinity);
    case "distance":
      return (atual.distance_m ?? -Infinity) > (melhor.distance_m ?? -Infinity);
    case "bw_assisted":
      // Menos assistência com mesma ou mais reps = PR.
      if ((atual.reps ?? -Infinity) < (melhor.reps ?? -Infinity)) return false;
      return (atual.assist_kg ?? Infinity) < (melhor.assist_kg ?? Infinity);
    case "interval":
    case "custom":
      // PR3 lida com isso.
      return false;
  }
}

function normalizar(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();
}
