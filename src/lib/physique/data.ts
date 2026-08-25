// ============================================================
// Adaptive Physique RPG — acesso a dados (PR1).
// ------------------------------------------------------------
// Wrappers server-side sobre as tabelas do PR1. Todos os métodos
// exigem userId (RLS já garante isolamento, mas explicitar reforça).
//
// `garantirFaseAtiva()` faz lazy-seed: se o usuário ainda não tem
// nenhuma fase, cria uma CUT herdando `meta` (kcal/protein alvo).
// Isso substitui um seed via SQL — mais seguro pra usuários novos.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type {
  BodyMeasurement,
  BodyMeasurementKind,
  DailyCheckin,
  DailyCheckinInput,
  PhysiquePhase,
  ProgressPhoto,
  WeeklyCheckin,
  WeeklyCheckinInput,
} from "./tipos";
import { mediaCintura, semanaISO } from "./math";

// ---------- physique_phase ----------

export async function faseAtiva(userId: string): Promise<PhysiquePhase | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("physique_phase")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "ativa")
    .maybeSingle();
  return (data as PhysiquePhase | null) ?? null;
}

/**
 * Garante que existe uma fase ativa. Se não existir, cria uma CUT
 * herdando `meta.kcal_alvo` e `meta.proteina_alvo`. Se `meta` também
 * não existir, usa defaults conservadores (1900 kcal / 135 g).
 */
export async function garantirFaseAtiva(userId: string): Promise<PhysiquePhase> {
  const existente = await faseAtiva(userId);
  if (existente) return existente;

  const supabase = createClient();
  const { data: meta } = await supabase
    .from("meta")
    .select("kcal_alvo, proteina_alvo, peso_alvo, cintura_alvo")
    .eq("user_id", userId)
    .maybeSingle();

  const kcal = (meta?.kcal_alvo as number | null) ?? 1900;
  const prot = (meta?.proteina_alvo as number | null) ?? 135;
  const pesoAlvo = (meta?.peso_alvo as number | null) ?? null;
  const cinturaAlvo = (meta?.cintura_alvo as number | null) ?? null;

  const { data: novo, error } = await supabase
    .from("physique_phase")
    .insert({
      user_id: userId,
      type: "cut",
      status: "ativa",
      calorie_target: kcal,
      calorie_range_min: Math.round(kcal * 0.95),
      calorie_range_max: Math.round(kcal * 1.05),
      calorie_target_min_floor: Math.round(kcal * 0.85),
      protein_target: prot,
      protein_range_min: Math.round(prot * 0.9),
      protein_range_max: Math.round(prot * 1.15),
      target_rate: 0.6,
      target_weight_optional: pesoAlvo,
      target_waist_optional: cinturaAlvo,
      goal_description: "Fase inicial CUT herdada de meta.",
    })
    .select("*")
    .single();

  if (error) throw error;
  return novo as PhysiquePhase;
}

// ---------- body_measurement ----------

export async function ultimasMedicoes(
  userId: string,
  kind: BodyMeasurementKind,
  dias = 90,
): Promise<BodyMeasurement[]> {
  const supabase = createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const { data } = await supabase
    .from("body_measurement")
    .select("*")
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("taken_at", desde.toISOString())
    .order("taken_at", { ascending: true });
  return (data ?? []) as BodyMeasurement[];
}

export async function registrarMedicao(
  userId: string,
  entrada: {
    kind: BodyMeasurementKind;
    value: number;
    unit?: string;
    method?: string;
    note?: string;
    taken_at?: string;
    phase_id?: number | null;
  },
): Promise<BodyMeasurement> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("body_measurement")
    .insert({
      user_id: userId,
      kind: entrada.kind,
      value_numeric: entrada.value,
      unit: entrada.unit ?? unidadeDefault(entrada.kind),
      method: entrada.method ?? null,
      note: entrada.note ?? null,
      taken_at: entrada.taken_at ?? new Date().toISOString(),
      phase_id: entrada.phase_id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as BodyMeasurement;
}

// ---------- daily_checkin ----------

export async function ultimoCheckinDiario(userId: string): Promise<DailyCheckin | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_checkin")
    .select("*")
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as DailyCheckin | null) ?? null;
}

export async function checkinDoDia(userId: string, dia?: string): Promise<DailyCheckin | null> {
  const supabase = createClient();
  const data = dia ?? new Date().toISOString().slice(0, 10);
  const { data: row } = await supabase
    .from("daily_checkin")
    .select("*")
    .eq("user_id", userId)
    .eq("data", data)
    .maybeSingle();
  return (row as DailyCheckin | null) ?? null;
}

/**
 * Upsert do check-in do dia. Se `peso_kg` vier, também registra na
 * body_measurement (kind='weight') — o check-in vira o ponto de entrada
 * para o peso (não precisa medir peso separadamente).
 */
export async function salvarCheckinDiario(
  userId: string,
  entrada: DailyCheckinInput,
): Promise<DailyCheckin> {
  const supabase = createClient();
  const data = entrada.data ?? new Date().toISOString().slice(0, 10);
  const payload = {
    user_id: userId,
    data,
    peso_kg: entrada.peso_kg ?? null,
    sono_h: entrada.sono_h ?? null,
    sono_qualidade: entrada.sono_qualidade ?? null,
    fome: entrada.fome ?? null,
    energia: entrada.energia ?? null,
    dor: entrada.dor ?? null,
    stress: entrada.stress ?? null,
    treino_previsto: entrada.treino_previsto ?? false,
    tkd_previsto: entrada.tkd_previsto ?? false,
    danca_prevista: entrada.danca_prevista ?? false,
    humor: entrada.humor ?? null,
    nota: entrada.nota ?? null,
  };

  const { data: row, error } = await supabase
    .from("daily_checkin")
    .upsert(payload, { onConflict: "user_id,data" })
    .select("*")
    .single();
  if (error) throw error;

  if (typeof entrada.peso_kg === "number") {
    const fase = await faseAtiva(userId);
    // silencioso em duplicata: unique (user_id, kind, taken_at)
    await supabase.from("body_measurement").insert({
      user_id: userId,
      kind: "weight",
      value_numeric: entrada.peso_kg,
      unit: "kg",
      method: "scale",
      note: "via checkin diário",
      phase_id: fase?.id ?? null,
      taken_at: new Date(`${data}T12:00:00Z`).toISOString(),
    }).select("id");
  }

  return row as DailyCheckin;
}

// ---------- weekly_checkin ----------

export async function checkinSemanal(userId: string, semana?: string): Promise<WeeklyCheckin | null> {
  const supabase = createClient();
  const sem = semana ?? semanaISO();
  const { data } = await supabase
    .from("weekly_checkin")
    .select("*")
    .eq("user_id", userId)
    .eq("semana_iso", sem)
    .maybeSingle();
  return (data as WeeklyCheckin | null) ?? null;
}

export async function salvarCheckinSemanal(
  userId: string,
  entrada: WeeklyCheckinInput,
): Promise<WeeklyCheckin> {
  const supabase = createClient();
  const sem = entrada.semana_iso ?? semanaISO();
  const fase = await faseAtiva(userId);

  const payload = {
    user_id: userId,
    semana_iso: sem,
    cintura_medida_1: entrada.cintura_medida_1 ?? null,
    cintura_medida_2: entrada.cintura_medida_2 ?? null,
    cintura_medida_3: entrada.cintura_medida_3 ?? null,
    proteina_pct: entrada.proteina_pct ?? null,
    calorias_pct: entrada.calorias_pct ?? null,
    fome_media: entrada.fome_media ?? null,
    sono_h_medio: entrada.sono_h_medio ?? null,
    tkd_sessoes: entrada.tkd_sessoes ?? null,
    danca_sessoes: entrada.danca_sessoes ?? null,
    foto_ids: entrada.foto_ids ?? [],
    phase_id: fase?.id ?? null,
  };

  const { data, error } = await supabase
    .from("weekly_checkin")
    .upsert(payload, { onConflict: "user_id,semana_iso" })
    .select("*")
    .single();
  if (error) throw error;

  // Se as 3 medidas de cintura foram dadas, registra a média na
  // body_measurement.
  const media = mediaCintura(
    payload.cintura_medida_1,
    payload.cintura_medida_2,
    payload.cintura_medida_3,
  );
  if (media != null) {
    await supabase.from("body_measurement").insert({
      user_id: userId,
      kind: "waist",
      value_numeric: media,
      unit: "cm",
      method: "tape",
      note: `média semana ${sem}`,
      phase_id: fase?.id ?? null,
    }).select("id");
  }

  return data as WeeklyCheckin;
}

// ---------- progress_photo ----------

export async function fotosRecentes(userId: string, limit = 12): Promise<ProgressPhoto[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("progress_photo")
    .select("*")
    .eq("user_id", userId)
    .order("taken_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as ProgressPhoto[];
}

// ---------- helpers ----------

function unidadeDefault(kind: BodyMeasurementKind): string {
  if (kind === "weight") return "kg";
  if (kind === "bf_pct") return "pct";
  return "cm";
}
