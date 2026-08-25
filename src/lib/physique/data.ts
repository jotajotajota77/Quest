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
import { mediaCintura, mediaMovel, semanaISO, type Ponto } from "./math";
import { decideCut, type CutInput, type DecisionResult } from "./engine";
import {
  calcReadiness,
  sinalSonoRuim,
  type ReadinessInput,
  type ReadinessResult,
  type Veredicto,
} from "./readiness";

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

// ---------- physique_engine_decision + nutrition_target (PR4) ----------

export interface EngineDecisionRow {
  id: number;
  criado_em: string;
  decision: DecisionResult["decision"];
  reason: string | null;
  confidence: number | null;
  signals: DecisionResult["signals"];
  aceito: "pendente" | "aceito" | "adiado" | "ignorado" | "expirado";
  decidido_em: string | null;
}

export async function ultimaDecisaoEngine(userId: string): Promise<EngineDecisionRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("physique_engine_decision")
    .select("id, criado_em, decision, reason, confidence, signals, aceito, decidido_em")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as EngineDecisionRow | null) ?? null;
}

export async function targetVigente(userId: string): Promise<{
  id: number;
  kcal: number;
  kcal_range_min: number;
  kcal_range_max: number;
  protein_g: number;
  origem: string | null;
} | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("nutrition_target")
    .select("id, kcal, kcal_range_min, kcal_range_max, protein_g, origem")
    .eq("user_id", userId)
    .eq("ativo", true)
    .maybeSingle();
  return (data as {
    id: number;
    kcal: number;
    kcal_range_min: number;
    kcal_range_max: number;
    protein_g: number;
    origem: string | null;
  } | null) ?? null;
}

/**
 * Se ainda não existe nutrition_target ativo, cria um a partir da fase
 * ativa (calorie_target / protein_target). Idempotente.
 */
export async function garantirTargetAtivo(userId: string) {
  const existente = await targetVigente(userId);
  if (existente) return existente;
  const supabase = createClient();
  const fase = await garantirFaseAtiva(userId);
  const kcal = fase.calorie_target ?? 1900;
  const protein = fase.protein_target ?? 135;
  const { data, error } = await supabase
    .from("nutrition_target")
    .insert({
      user_id: userId,
      phase_id: fase.id,
      kcal,
      kcal_range_min: fase.calorie_range_min ?? Math.round(kcal * 0.95),
      kcal_range_max: fase.calorie_range_max ?? Math.round(kcal * 1.05),
      protein_g: protein,
      protein_range_min: fase.protein_range_min ?? Math.round(protein * 0.9),
      protein_range_max: fase.protein_range_max ?? Math.round(protein * 1.15),
      origem: "inicial",
      ativo: true,
    })
    .select("id, kcal, kcal_range_min, kcal_range_max, protein_g, origem")
    .single();
  if (error) throw error;
  return data;
}

/**
 * Monta o CutInput a partir do estado atual do usuário, roda o engine
 * e grava a decisão. NÃO aplica mudanças em nutrition_target — só
 * registra a proposta (§88: usuário aceita/adia/ignora).
 */
export async function avaliarFaseCut(userId: string): Promise<{
  fase: PhysiquePhase;
  input: CutInput;
  resultado: DecisionResult;
  decisaoId: number;
}> {
  const supabase = createClient();
  const fase = await garantirFaseAtiva(userId);
  const target = await garantirTargetAtivo(userId);

  // Peso: pontos das últimas 21 medições pra montar 2 janelas de 7d.
  const pesos = await ultimasMedicoes(userId, "weight", 30);
  const pontos: Ponto[] = pesos.map((m) => ({ ts: m.taken_at, valor: Number(m.value_numeric) }));
  const hoje = new Date();
  const semanaPassada = new Date(hoje);
  semanaPassada.setDate(semanaPassada.getDate() - 7);
  const media7d_atual = mediaMovel(pontos, 7, hoje);
  const media7d_passada = mediaMovel(pontos, 7, semanaPassada);

  // Cintura: últimos 2 weekly_checkin.
  const { data: weeklyLast } = await supabase
    .from("weekly_checkin")
    .select("cintura_media_cm, sono_h_medio, fome_media")
    .eq("user_id", userId)
    .order("semana_iso", { ascending: false })
    .limit(2);
  const wArr = (weeklyLast ?? []) as {
    cintura_media_cm: number | null;
    sono_h_medio: number | null;
    fome_media: number | null;
  }[];
  const cinturaAtual = wArr[0]?.cintura_media_cm ?? null;
  const cinturaPassada = wArr[1]?.cintura_media_cm ?? null;
  const cintura_delta_cm =
    cinturaAtual != null && cinturaPassada != null
      ? Number((cinturaAtual - cinturaPassada).toFixed(1))
      : null;

  // Daily checkins últimos 7d — média sono + fome (fallback do weekly).
  const { data: dailies } = await supabase
    .from("daily_checkin")
    .select("data, sono_h, fome, treino_previsto")
    .eq("user_id", userId)
    .gte("data", isoDaysAgo(7))
    .order("data", { ascending: false });
  const arr = (dailies ?? []) as {
    data: string;
    sono_h: number | null;
    fome: number | null;
    treino_previsto: boolean;
  }[];
  const sono_h_medio =
    wArr[0]?.sono_h_medio ?? mediaDe(arr.map((d) => d.sono_h));
  const fome_media =
    wArr[0]?.fome_media ?? mediaDe(arr.map((d) => d.fome));

  // Aderência: % dias com daily_checkin registrado nos últimos 14 dias.
  const { count: countCheckins } = await supabase
    .from("daily_checkin")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("data", isoDaysAgo(14));
  const aderencia_pct = countCheckins != null ? Math.min(100, (countCheckins / 14) * 100) : null;

  // Performance delta: comparação leve de PRs vigentes vs semana passada.
  // Como PR3 acaba de entrar, aqui usa uma heurística: nº de PRs batidos
  // nas últimas 2 sem vs. as 2 sem anteriores. Positivo = melhorando.
  const performance_delta_pct = await performanceDeltaSimples(userId);

  // Dias na fase.
  const dias_na_fase = Math.max(
    0,
    Math.floor((hoje.getTime() - new Date(fase.started_at).getTime()) / 86400000),
  );

  const input: CutInput = {
    media7d_atual,
    media7d_passada,
    cintura_delta_cm,
    performance_delta_pct,
    sono_h_medio,
    fome_media,
    aderencia_pct,
    dias_na_fase,
    kcal_min_floor: fase.calorie_target_min_floor ?? null,
    kcal_target_atual: target?.kcal ?? fase.calorie_target ?? null,
    bf_estimado_pct: null,
    bf_target_pct: fase.target_bf_optional ?? null,
    cintura_delta_total_cm: null,
  };

  const resultado = decideCut(input);

  const { data: inserted, error } = await supabase
    .from("physique_engine_decision")
    .insert({
      user_id: userId,
      phase_id: fase.id,
      decision: resultado.decision,
      signals: resultado.signals as unknown as Record<string, unknown>,
      reason: resultado.reason,
      confidence: resultado.confidence,
    })
    .select("id")
    .single();
  if (error) throw error;

  return {
    fase,
    input,
    resultado,
    decisaoId: (inserted?.id as number) ?? 0,
  };
}

export async function marcarDecisao(
  userId: string,
  id: number,
  aceito: "aceito" | "adiado" | "ignorado",
): Promise<void> {
  const supabase = createClient();
  await supabase
    .from("physique_engine_decision")
    .update({ aceito, decidido_em: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", userId);
}

/**
 * PR5 §20-24. Se a decisão sugere kcal diferente do target atual,
 * desativa o atual e cria um novo `nutrition_target` com o kcal proposto.
 * O piso §72 já foi respeitado pelo engine (ajustarComPiso).
 *
 * Retorna null quando a decisão não muda kcal (ex.: keep_course).
 */
export async function aplicarDecisaoEmTarget(
  userId: string,
  decisaoId: number,
): Promise<{ id: number; kcal: number } | null> {
  const supabase = createClient();
  const { data: dec } = await supabase
    .from("physique_engine_decision")
    .select("id, decision, signals")
    .eq("id", decisaoId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!dec) return null;
  const signals = (dec.signals ?? {}) as Record<string, number | null>;

  // Só small_adjustment altera kcal em PR5. Outras decisões (keep, watch,
  // recovery, phase_review, recovery_check) mantêm target atual.
  if (dec.decision !== "small_adjustment") return null;

  const atual = await targetVigente(userId);
  if (!atual) return null;

  // O engine sugere -125 kcal em small_adjustment. Vale reler o signal
  // e aplicar o mesmo delta respeitando piso — mais barato do que
  // persistir o kcal_target_sugerido na linha.
  const piso = signals.kcal_min_floor;
  const novoKcal = piso != null && atual.kcal - 125 < piso ? piso : atual.kcal - 125;
  if (novoKcal >= atual.kcal) return null;

  const fase = await faseAtiva(userId);

  // Desativa target atual.
  await supabase
    .from("nutrition_target")
    .update({ ativo: false, encerrado_em: new Date().toISOString() })
    .eq("id", atual.id)
    .eq("user_id", userId);

  // Insere novo. Mantém proteína e ranges proporcionais.
  const { data: novo, error } = await supabase
    .from("nutrition_target")
    .insert({
      user_id: userId,
      phase_id: fase?.id ?? null,
      kcal: Math.round(novoKcal),
      kcal_range_min: Math.round(novoKcal * 0.97),
      kcal_range_max: Math.round(novoKcal * 1.03),
      protein_g: atual.protein_g,
      protein_range_min: Math.round(atual.protein_g * 0.9),
      protein_range_max: Math.round(atual.protein_g * 1.15),
      origem: "engine",
      ativo: true,
    })
    .select("id, kcal")
    .single();
  if (error) throw error;
  return { id: novo.id as number, kcal: novo.kcal as number };
}

// ---------- helpers internos ao módulo ----------

function isoDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function mediaDe(vals: (number | null)[]): number | null {
  const nums = vals.filter((v): v is number => typeof v === "number");
  if (nums.length === 0) return null;
  return Number((nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2));
}

async function performanceDeltaSimples(userId: string): Promise<number | null> {
  const supabase = createClient();
  const now = new Date();
  const cut2sem = new Date(now); cut2sem.setDate(cut2sem.getDate() - 14);
  const cut4sem = new Date(now); cut4sem.setDate(cut4sem.getDate() - 28);
  const { count: recentes } = await supabase
    .from("personal_record")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("batido_em", cut2sem.toISOString());
  const { count: anteriores } = await supabase
    .from("personal_record")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("batido_em", cut4sem.toISOString())
    .lt("batido_em", cut2sem.toISOString());
  if (recentes == null || anteriores == null) return null;
  if (anteriores === 0) return recentes > 0 ? 5 : 0;
  return Number((((recentes - anteriores) / Math.max(anteriores, 1)) * 100).toFixed(1));
}

// ---------- readiness_snapshot (PR6) ----------

export interface ReadinessRow {
  id: number;
  data: string;
  score: number;
  componentes: ReadinessResult["componentes"];
  veredicto: Veredicto;
  criado_em: string;
  atualizado_em: string;
}

export async function ultimoReadiness(userId: string): Promise<ReadinessRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("readiness_snapshot")
    .select("id, data, score, componentes, veredicto, criado_em, atualizado_em")
    .eq("user_id", userId)
    .order("data", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as ReadinessRow | null) ?? null;
}

export async function historicoReadiness(userId: string, dias = 14): Promise<ReadinessRow[]> {
  const supabase = createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);
  const { data } = await supabase
    .from("readiness_snapshot")
    .select("id, data, score, componentes, veredicto, criado_em, atualizado_em")
    .eq("user_id", userId)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: true });
  return (data ?? []) as ReadinessRow[];
}

/**
 * Retorna as horas de sono dos últimos 7 dias (ordenado do mais recente
 * pro mais antigo). Usado por `sinalSonoRuim` pra decidir banner na home.
 */
export async function sonoUltimos7(userId: string): Promise<(number | null)[]> {
  const supabase = createClient();
  const desde = new Date();
  desde.setDate(desde.getDate() - 7);
  const { data } = await supabase
    .from("daily_checkin")
    .select("data, sono_h")
    .eq("user_id", userId)
    .gte("data", desde.toISOString().slice(0, 10))
    .order("data", { ascending: false });
  return (data ?? []).map((r) => (r.sono_h as number | null) ?? null);
}

/**
 * Monta o input de readiness a partir do daily_checkin de hoje +
 * proxies de performance/carga. Upsert em readiness_snapshot
 * (unique user + data). Chamado por POST /api/checkin daily.
 */
export async function recalcularReadinessDoDia(
  userId: string,
  dia?: string,
): Promise<ReadinessRow | null> {
  const supabase = createClient();
  const data = dia ?? new Date().toISOString().slice(0, 10);
  const daily = await checkinDoDia(userId, data);
  // Sem daily do dia? Nada a gravar.
  if (!daily) return null;

  // Fadiga subjetiva = ponderado de humor + stress (10 = destruído).
  const fadigaFromHumor = ({
    otimo: 1,
    normal: 4,
    cansado: 7,
    destruido: 10,
  } as const)[daily.humor ?? "normal"] ?? 4;
  const fadiga = daily.stress != null
    ? Math.round((fadigaFromHumor + daily.stress) / 2)
    : fadigaFromHumor;

  // Performance recente: reaproveita a heurística do engine CUT.
  const performance_pct = await performanceDeltaSimples(userId);

  // Carga semana atual: aproximação simples = nº de séries últimos 7d
  // dividido por 50 (proxy do teto saudável). Capado em 1.
  const desde = new Date();
  desde.setDate(desde.getDate() - 7);
  const { count: seriesSemana } = await supabase
    .from("treino_series")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("ts", desde.toISOString());
  const carga_semana_pct = seriesSemana == null ? null : Math.min(1, seriesSemana / 50);

  const input: ReadinessInput = {
    sono_h: daily.sono_h,
    sono_qualidade: daily.sono_qualidade,
    fome: daily.fome,
    dor: daily.dor,
    performance_pct,
    carga_semana_pct,
    fadiga_subjetiva: fadiga,
  };

  const r = calcReadiness(input);

  const { data: row, error } = await supabase
    .from("readiness_snapshot")
    .upsert(
      {
        user_id: userId,
        data,
        score: r.score,
        componentes: r.componentes as unknown as Record<string, unknown>,
        veredicto: r.veredicto,
        atualizado_em: new Date().toISOString(),
      },
      { onConflict: "user_id,data" },
    )
    .select("id, data, score, componentes, veredicto, criado_em, atualizado_em")
    .single();
  if (error) throw error;
  return row as ReadinessRow;
}

/**
 * Sinal composto pra banner de home: "recovery advised" se
 *   - último readiness < 50, OU
 *   - >=3 noites de sono <5h nos últimos 7 dias (§17).
 */
export async function precisaRecoveryBanner(userId: string): Promise<{
  precisa: boolean;
  motivo: string | null;
  score: number | null;
}> {
  const [ult, sonos] = await Promise.all([
    ultimoReadiness(userId),
    sonoUltimos7(userId),
  ]);
  if (ult && ult.score < 50) {
    return { precisa: true, motivo: `readiness ${ult.score}`, score: ult.score };
  }
  if (sinalSonoRuim(sonos)) {
    return { precisa: true, motivo: "3+ noites <5h", score: ult?.score ?? null };
  }
  return { precisa: false, motivo: null, score: ult?.score ?? null };
}

// ---------- helpers ----------

function unidadeDefault(kind: BodyMeasurementKind): string {
  if (kind === "weight") return "kg";
  if (kind === "bf_pct") return "pct";
  return "cm";
}
