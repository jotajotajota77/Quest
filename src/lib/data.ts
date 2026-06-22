// Acesso a dados server-side compartilhado pelas rotas/loops.
import type {
  Atributos,
  Comportamento,
  Esquema,
  Familia,
  LogRow,
  Personagem,
  ScheduleState,
  TreinoExercicio,
  TreinoSerie,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { familiaDe } from "@/lib/comportamentos";
import type { SinalRobustez } from "@/lib/engine/gates";

const NUTRI: Comportamento[] = ["nutri_refeicao", "nutri_agua"];

/** Garante que existe linha de atributos para o usuário (os 4 atributos). */
export async function garantirAtributos(userId: string): Promise<Atributos> {
  const supabase = createClient();
  const { data } = await supabase
    .from("atributos")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data as Atributos;
  const { data: novo } = await supabase
    .from("atributos")
    .insert({ user_id: userId })
    .select("*")
    .single();
  return novo as Atributos;
}

/** Garante schedule_state de uma família (inicia em CRF). Só Nutri usa. */
export async function garantirSchedule(
  userId: string,
  comportamento: Familia,
): Promise<ScheduleState> {
  const supabase = createClient();
  const { data } = await supabase
    .from("schedule_state")
    .select("*")
    .eq("user_id", userId)
    .eq("comportamento", comportamento)
    .maybeSingle();
  if (data) return data as ScheduleState;
  const { data: novo } = await supabase
    .from("schedule_state")
    .insert({
      user_id: userId,
      comportamento,
      esquema_atual: "CRF" as Esquema,
      nivel_afinamento: 0,
    })
    .select("*")
    .single();
  return novo as ScheduleState;
}

/** Personagem protagonista de hoje (ou null se nenhum selecionado). */
export async function personagemDoDia(
  userId: string,
): Promise<Personagem | null> {
  const supabase = createClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: sel } = await supabase
    .from("selecao_diaria")
    .select("personagem_id")
    .eq("user_id", userId)
    .eq("data", hoje)
    .maybeSingle();
  if (!sel) return null;
  const { data: p } = await supabase
    .from("personagens")
    .select("*")
    .eq("id", sel.personagem_id)
    .maybeSingle();
  return (p as Personagem) ?? null;
}

/**
 * Janela móvel das últimas N latências (min) da NUTRI, para o fading.
 * Dias de NÉVOA são NEUTROS ao motor (TRAVA 5): excluídos da janela.
 */
export async function ultimasLatenciasNutri(
  userId: string,
  n = 12,
): Promise<number[]> {
  const supabase = createClient();
  const fog = await diasNevoaSet(userId);
  const { data } = await supabase
    .from("vw_logs_latencia")
    .select("ts, latencia_seg")
    .eq("user_id", userId)
    .in("comportamento", NUTRI)
    .order("ts", { ascending: false })
    .limit(n * 3);
  const out: number[] = [];
  for (const r of data ?? []) {
    if (fog.has((r.ts as string).slice(0, 10))) continue; // névoa = neutro
    out.push((r.latencia_seg as number) / 60);
    if (out.length >= n) break;
  }
  return out;
}

/** Quantos registros de NUTRI houve desde a última música (faixa_cheia). */
export async function registrosNutriDesdeUltimaMusica(
  userId: string,
): Promise<number> {
  const supabase = createClient();
  const { data: ultima } = await supabase
    .from("historico_reforco")
    .select("ts")
    .eq("user_id", userId)
    .eq("tipo_reforco", "faixa_cheia")
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();

  let query = supabase
    .from("logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("comportamento", NUTRI);
  if (ultima?.ts) query = query.gt("ts", ultima.ts);
  const { count } = await query;
  return count ?? 0;
}

/** Histórico recente de uma família (para a aba do comportamento). */
export async function historicoFamilia(
  userId: string,
  comportamentos: Comportamento[],
  limit = 20,
): Promise<LogRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .in("comportamento", comportamentos)
    .order("ts", { ascending: false })
    .limit(limit);
  return (data ?? []) as LogRow[];
}

// ============================================================
// Porteiro de robustez (TRAVA 5): lê perturbação das OUTRAS abas.
// ------------------------------------------------------------
// Janela de 21 dias. Um "dia ruim natural" = dia em que a rotina de outra aba
// furou (zero logs não-nutri) no MEIO de dias ativos. A dieta "sobreviveu" se,
// nesse dia ruim, ainda houve registro de nutri.
// ============================================================
export async function sinalRobustez(userId: string): Promise<SinalRobustez> {
  const supabase = createClient();
  const desde = new Date(Date.now() - 21 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("logs")
    .select("ts, comportamento")
    .eq("user_id", userId)
    .gte("ts", desde)
    .order("ts", { ascending: true });

  const logs = (data ?? []) as Pick<LogRow, "ts" | "comportamento">[];

  // dia (YYYY-MM-DD) → contagem nutri vs outros
  const dias = new Map<string, { nutri: number; outros: number }>();
  for (const l of logs) {
    const dia = l.ts.slice(0, 10);
    const d = dias.get(dia) ?? { nutri: 0, outros: 0 };
    if (familiaDe(l.comportamento) === "nutri") d.nutri++;
    else d.outros++;
    dias.set(dia, d);
  }

  const datasComOutros = [...dias.entries()]
    .filter(([, v]) => v.outros > 0)
    .map(([k]) => k)
    .sort();

  // Precisa de pelo menos dois dias com atividade de outras abas para que faça
  // sentido falar em "dia ruim no meio da rotina".
  if (datasComOutros.length < 2) {
    return { houvePerturbacao: false, dietaSobreviveu: false };
  }

  const inicio = new Date(`${datasComOutros[0]}T00:00:00Z`).getTime();
  const fim = new Date(
    `${datasComOutros[datasComOutros.length - 1]}T00:00:00Z`,
  ).getTime();

  // Dias de névoa são NEUTROS (TRAVA 5): nem perturbação, nem prova de robustez.
  const fog = await diasNevoaSet(userId);

  let houvePerturbacao = false;
  let dietaSobreviveu = false;
  for (let t = inicio; t <= fim; t += 86_400_000) {
    const dia = new Date(t).toISOString().slice(0, 10);
    if (fog.has(dia)) continue; // recolhimento declarado ≠ dia ruim natural
    const d = dias.get(dia) ?? { nutri: 0, outros: 0 };
    if (d.outros === 0) {
      houvePerturbacao = true; // rotina de outra aba furou nesse dia
      if (d.nutri > 0) dietaSobreviveu = true; // mas a dieta segurou
    }
  }

  return { houvePerturbacao, dietaSobreviveu };
}

// ============================================================
// Espinha v2: streak, modo névoa, daily spin, foco do dia.
// ============================================================

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Conjunto de dias (YYYY-MM-DD) declarados como névoa. */
export async function diasNevoaSet(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dias")
    .select("data")
    .eq("user_id", userId)
    .eq("fog_mode", true);
  return new Set((data ?? []).map((r) => r.data as string));
}

/** Conjunto de dias com pelo menos um log (últimos ~120 dias). */
export async function diasComLogSet(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const desde = new Date(Date.now() - 120 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("logs")
    .select("ts")
    .eq("user_id", userId)
    .gte("ts", desde);
  return new Set((data ?? []).map((r) => (r.ts as string).slice(0, 10)));
}

/** Quantos registros o usuário fez hoje. */
export async function registrosHoje(userId: string): Promise<number> {
  const supabase = createClient();
  const inicio = `${hojeISO()}T00:00:00.000Z`;
  const { count } = await supabase
    .from("logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("ts", inicio);
  return count ?? 0;
}

/** A linha de hoje em `dias` (fog/foco), criando se preciso. */
export async function diaDeHoje(
  userId: string,
): Promise<{ fog_mode: boolean; foco_do_dia: string | null }> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dias")
    .select("fog_mode, foco_do_dia")
    .eq("user_id", userId)
    .eq("data", hojeISO())
    .maybeSingle();
  return data ?? { fog_mode: false, foco_do_dia: null };
}

/** Recompensa do daily spin de hoje, se já girou. */
export async function spinDeHoje(
  userId: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("daily_spin")
    .select("recompensa")
    .eq("user_id", userId)
    .eq("data", hojeISO())
    .maybeSingle();
  return (data?.recompensa as Record<string, unknown>) ?? null;
}

// ============================================================
// Módulo de treino rico (TRAVA 6): plano + séries (PR/histórico).
// ============================================================

/** O plano do usuário (exercícios por split). */
export async function planoTreino(userId: string): Promise<TreinoExercicio[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("treino_exercicios")
    .select("*")
    .eq("user_id", userId)
    .order("split", { ascending: true })
    .order("ordem", { ascending: true });
  return (data ?? []) as TreinoExercicio[];
}

/** Séries recentes (histórico por exercício + detecção de PR no cliente). */
export async function seriesRecentes(
  userId: string,
  limit = 60,
): Promise<TreinoSerie[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("treino_series")
    .select("*")
    .eq("user_id", userId)
    .order("ts", { ascending: false })
    .limit(limit);
  return (data ?? []) as TreinoSerie[];
}

// ============================================================
// Afinamento (todo derivado — sem migration).
// ============================================================

/**
 * Coach da Nutri está ATIVO? (TRAVA 1: esmaece pra dentro só quando o operante
 * fortalece). Critério: o esquema da Nutri já afinou além de CRF
 * (nivel_afinamento >= 1) — prova de que o comportamento estabilizou.
 */
export async function coachNutriAtivo(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("schedule_state")
    .select("nivel_afinamento")
    .eq("user_id", userId)
    .eq("comportamento", "nutri")
    .maybeSingle();
  return (data?.nivel_afinamento ?? 0) >= 1;
}

/** Resumo passivo de macros dos últimos 7 dias (só logs que têm macro). */
export async function resumoMacrosNutri(userId: string): Promise<{
  nComMacros: number;
  mediaKcal: number | null;
  mediaProteina: number | null;
}> {
  const supabase = createClient();
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("logs")
    .select("kcal, proteina")
    .eq("user_id", userId)
    .in("comportamento", NUTRI)
    .gte("ts", desde)
    .not("kcal", "is", null);
  const linhas = data ?? [];
  if (linhas.length === 0)
    return { nComMacros: 0, mediaKcal: null, mediaProteina: null };
  const somaK = linhas.reduce((a, r) => a + (Number(r.kcal) || 0), 0);
  const somaP = linhas.reduce((a, r) => a + (Number(r.proteina) || 0), 0);
  return {
    nComMacros: linhas.length,
    mediaKcal: Math.round(somaK / linhas.length),
    mediaProteina: Math.round(somaP / linhas.length),
  };
}

/** Data (YYYY-MM-DD) da última atividade ANTES de hoje (p/ jackpot de comeback). */
export async function ultimaAtividadeAntesDeHoje(
  userId: string,
): Promise<string | null> {
  const supabase = createClient();
  const inicioHoje = `${hojeISO()}T00:00:00.000Z`;
  const { data } = await supabase
    .from("logs")
    .select("ts")
    .eq("user_id", userId)
    .lt("ts", inicioHoje)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.ts ? (data.ts as string).slice(0, 10) : null;
}

/** Quantos logs de uma família o usuário tem no total (p/ unlock de leitura). */
export async function contarFamilia(
  userId: string,
  comportamentos: Comportamento[],
): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("comportamento", comportamentos);
  return count ?? 0;
}

/** Logs dos últimos 7 dias (para o analisador semanal). */
export async function logs7Dias(userId: string): Promise<LogRow[]> {
  const supabase = createClient();
  const desde = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .gte("ts", desde);
  return (data ?? []) as LogRow[];
}

// ── Tela Nutri (design replicado): refeições de hoje com macros ──
export async function nutriHoje(userId: string): Promise<LogRow[]> {
  const supabase = createClient();
  const inicio = `${hojeISO()}T00:00:00.000Z`;
  const { data } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .in("comportamento", NUTRI)
    .gte("ts", inicio)
    .order("ts", { ascending: false });
  return (data ?? []) as LogRow[];
}

// ── Tela Treino (design replicado): séries de hoje (linhas por exercício) ──
export async function seriesDeHoje(userId: string): Promise<TreinoSerie[]> {
  const supabase = createClient();
  const inicio = `${hojeISO()}T00:00:00.000Z`;
  const { data } = await supabase
    .from("treino_series")
    .select("*")
    .eq("user_id", userId)
    .gte("ts", inicio)
    .order("ts", { ascending: true });
  return (data ?? []) as TreinoSerie[];
}

// ── Roster (v4): desbloqueados + dono do atributo (p/ imagens contextuais) ──
export async function rosterDesbloqueado(): Promise<Personagem[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("personagens")
    .select("*")
    .eq("desbloqueado", true)
    .order("ordem", { ascending: true });
  return (data ?? []) as Personagem[];
}

/** Personagem desbloqueado dono de um atributo/família (p/ fallback de hero). */
export function donoDoAtributo(
  roster: Personagem[],
  familia: Familia,
): Personagem | null {
  return roster.find((p) => p.comportamento_alvo === familia) ?? null;
}

// ── Protocolo diário (v4) ──
export async function familiasLogadasHoje(userId: string): Promise<Set<Familia>> {
  const supabase = createClient();
  const inicio = `${hojeISO()}T00:00:00.000Z`;
  const { data } = await supabase
    .from("logs")
    .select("comportamento")
    .eq("user_id", userId)
    .gte("ts", inicio);
  const set = new Set<Familia>();
  for (const r of data ?? []) set.add(familiaDe(r.comportamento as Comportamento));
  return set;
}

export async function trackersHoje(userId: string): Promise<{
  agua_count: number;
  sono_ok: boolean;
  passos_ok: boolean;
  sem_alcool: boolean;
}> {
  const supabase = createClient();
  const { data } = await supabase
    .from("protocolo_diario")
    .select("trackers_leves")
    .eq("user_id", userId)
    .eq("data", hojeISO())
    .maybeSingle();
  const t = (data?.trackers_leves as Record<string, unknown>) ?? {};
  return {
    agua_count: Number(t.agua_count ?? 0),
    sono_ok: Boolean(t.sono_ok),
    passos_ok: Boolean(t.passos_ok),
    sem_alcool: Boolean(t.sem_alcool),
  };
}

export async function diaFinalizado(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("dias")
    .select("finalizado")
    .eq("user_id", userId)
    .eq("data", hojeISO())
    .maybeSingle();
  return Boolean(data?.finalizado);
}

// ── food_db (v4): catálogo consultável ──
import type { Alimento, CategoriaAlimento } from "@/lib/alimentos";

export async function listarFoodDb(): Promise<Alimento[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("food_db")
    .select("*")
    .order("nome", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id as string,
    nome: r.nome as string,
    cat: r.categoria as CategoriaAlimento,
    kcal: Number(r.kcal),
    p: Number(r.proteina),
    c: Number(r.carbo),
    g: Number(r.gordura),
  }));
}

export async function categoriasFood(): Promise<Map<string, string>> {
  const supabase = createClient();
  const { data } = await supabase.from("food_db").select("id, categoria");
  return new Map((data ?? []).map((r) => [r.id as string, r.categoria as string]));
}

// ── Fat Loss Coach (v4): 30 dias de logs ricos + peso atual ──
export async function logsNutri30(userId: string): Promise<LogRow[]> {
  const supabase = createClient();
  const desde = new Date(Date.now() - 30 * 86_400_000).toISOString();
  const { data } = await supabase
    .from("logs")
    .select("*")
    .eq("user_id", userId)
    .in("comportamento", NUTRI)
    .gte("ts", desde)
    .not("kcal", "is", null);
  return (data ?? []) as LogRow[];
}

export async function pesoAtual(userId: string): Promise<number | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("corpo_real")
    .select("peso")
    .eq("user_id", userId)
    .not("peso", "is", null)
    .order("ts", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.peso != null ? Number(data.peso) : null;
}

// ── Quests (v4): avalia contra o dia, credita XP uma vez por quest ──
import { questsDeHoje, type QuestCtx } from "@/lib/quests";
import { tierDeXp } from "@/lib/engine/tier";

export interface QuestView {
  quest_id: string;
  tipo: string;
  descricao: string;
  xp: number;
  completa: boolean;
}

export async function avaliarQuests(
  userId: string,
  ctx: QuestCtx,
): Promise<QuestView[]> {
  const supabase = createClient();
  const data = hojeISO();
  const templates = questsDeHoje(data);

  const { data: existentes } = await supabase
    .from("quests")
    .select("quest_id, estado")
    .eq("user_id", userId)
    .eq("data", data);
  const estadoPorId = new Map(
    (existentes ?? []).map((r) => [r.quest_id as string, r.estado as string]),
  );

  let xpGanho = 0;
  const view: QuestView[] = [];

  for (const t of templates) {
    const jaCompleta = estadoPorId.get(t.id) === "completa";
    const completaAgora = t.concluida(ctx);
    const novaCompleta = completaAgora && !jaCompleta;
    if (novaCompleta) xpGanho += t.xp;

    // upsert do estado (cria a linha se não existir; marca completa quando for).
    await supabase.from("quests").upsert({
      user_id: userId,
      data,
      quest_id: t.id,
      tipo: t.tipo,
      descricao: t.descricao,
      xp: t.xp,
      estado: completaAgora || jaCompleta ? "completa" : "aberta",
    });

    view.push({
      quest_id: t.id,
      tipo: t.tipo,
      descricao: t.descricao,
      xp: t.xp,
      completa: completaAgora || jaCompleta,
    });
  }

  if (xpGanho > 0) {
    const attr = await garantirAtributos(userId);
    const novoXp = attr.xp + xpGanho;
    const tier = tierDeXp(novoXp);
    await supabase
      .from("atributos")
      .update({
        xp: novoXp,
        tier_base: tier.base.sigla,
        tier_divisao: tier.rank % 4,
        atualizado_em: new Date().toISOString(),
      })
      .eq("user_id", userId);
  }

  return view;
}

// ── Sessões de treino do dia (v4) ──
export async function sessoesDeHoje(
  userId: string,
): Promise<{ split: string; finalizada: boolean }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("treino_sessoes")
    .select("split, finalizada")
    .eq("user_id", userId)
    .eq("data", hojeISO());
  return (data ?? []).map((r) => ({
    split: r.split as string,
    finalizada: Boolean(r.finalizada),
  }));
}
