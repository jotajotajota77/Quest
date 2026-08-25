// ============================================================
// Adaptive Physique RPG — tipos (PR1).
// ------------------------------------------------------------
// Camada de tipos alinhada ao schema (migrations 0031-0034).
// Mantida separada de `src/lib/types.ts` (legado v12) para não vazar
// concerns do RPG antigo no engine novo. As telas antigas continuam
// usando `types.ts`; as novas (/checkin, /progresso, etc) usam daqui.
// ============================================================

export type PhysiquePhaseType =
  | "cut"
  | "maintenance"
  | "build"
  | "specialization"
  | "mini_cut"
  | "recovery"
  | "travel"
  | "custom";

export type PhysiquePhaseStatus = "ativa" | "concluida" | "abandonada";

export type BodyMeasurementKind =
  | "weight"
  | "waist"
  | "chest"
  | "arm"
  | "thigh"
  | "hip"
  | "neck"
  | "bf_pct"
  | "shoulder"
  | "forearm"
  | "calf";

export type BodyMeasurementUnit = "kg" | "cm" | "pct" | "lb" | "in";

export type BodyMeasurementMethod =
  | "bioimpedance"
  | "caliper"
  | "tape"
  | "scale"
  | "photo_estimate"
  | "self_report";

export type Humor = "otimo" | "normal" | "cansado" | "destruido";

export type WeeklyVerdict =
  | "keep_course"
  | "small_adjustment"
  | "recovery"
  | "phase_review";

export type ProgressPhotoAngle =
  | "front"
  | "side"
  | "back"
  | "relaxed"
  | "flexed"
  | "lat_spread"
  | "side_chest";

export interface PhysiquePhase {
  id: number;
  user_id: string;
  type: PhysiquePhaseType;
  status: PhysiquePhaseStatus;
  started_at: string;              // ISO date
  ended_at: string | null;
  calorie_target: number | null;
  calorie_range_min: number | null;
  calorie_range_max: number | null;
  calorie_target_min_floor: number | null;
  protein_target: number | null;
  protein_range_min: number | null;
  protein_range_max: number | null;
  target_rate: number | null;      // % peso/semana
  target_weight_optional: number | null;
  target_waist_optional: number | null;
  target_bf_optional: number | null;
  goal_description: string | null;
  decision_notes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface BodyMeasurement {
  id: number;
  user_id: string;
  taken_at: string;                // ISO timestamp
  kind: BodyMeasurementKind;
  value_numeric: number;
  unit: BodyMeasurementUnit;
  method: BodyMeasurementMethod | null;
  note: string | null;
  phase_id: number | null;
  criado_em: string;
}

export interface DailyCheckin {
  id: number;
  user_id: string;
  data: string;                    // ISO date
  peso_kg: number | null;
  sono_h: number | null;
  sono_qualidade: number | null;   // 1-5
  fome: number | null;             // 0-10
  energia: number | null;          // 0-10
  dor: number | null;              // 0-10
  stress: number | null;           // 0-10
  treino_previsto: boolean;
  tkd_previsto: boolean;
  danca_prevista: boolean;
  humor: Humor | null;
  nota: string | null;
  criado_em: string;
}

export interface DailyCheckinInput {
  data?: string;                   // default hoje
  peso_kg?: number | null;
  sono_h?: number | null;
  sono_qualidade?: number | null;
  fome?: number | null;
  energia?: number | null;
  dor?: number | null;
  stress?: number | null;
  treino_previsto?: boolean;
  tkd_previsto?: boolean;
  danca_prevista?: boolean;
  humor?: Humor | null;
  nota?: string | null;
}

export interface WeeklyCheckin {
  id: number;
  user_id: string;
  semana_iso: string;              // ex '2026-W32'
  peso_medio_kg: number | null;
  peso_delta_pct: number | null;
  cintura_medida_1: number | null;
  cintura_medida_2: number | null;
  cintura_medida_3: number | null;
  cintura_media_cm: number | null; // GENERATED
  cintura_delta_cm: number | null;
  treino_sessoes: number | null;
  prs_batidos: number | null;
  proteina_pct: number | null;
  calorias_pct: number | null;
  sono_h_medio: number | null;
  fome_media: number | null;
  tkd_sessoes: number | null;
  danca_sessoes: number | null;
  foto_ids: number[];
  verdict: WeeklyVerdict | null;
  verdict_justificativa: string | null;
  verdict_aceito_em: string | null;
  phase_id: number | null;
  criado_em: string;
}

export interface WeeklyCheckinInput {
  semana_iso?: string;             // default = ISO week de hoje
  cintura_medida_1?: number | null;
  cintura_medida_2?: number | null;
  cintura_medida_3?: number | null;
  proteina_pct?: number | null;
  calorias_pct?: number | null;
  fome_media?: number | null;
  sono_h_medio?: number | null;
  tkd_sessoes?: number | null;
  danca_sessoes?: number | null;
  foto_ids?: number[];
}

export interface ProgressPhoto {
  id: number;
  user_id: string;
  taken_at: string;
  angle: ProgressPhotoAngle;
  storage_path: string;
  thumb_path: string | null;
  weight_kg: number | null;
  waist_cm: number | null;
  bf_est_pct: number | null;
  note: string | null;
  phase_id: number | null;
  criado_em: string;
}
