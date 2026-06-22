// Acesso a dados server-side compartilhado pelas rotas/loops.
import type {
  Atributos,
  Comportamento,
  Esquema,
  Familia,
  LogRow,
  Personagem,
  ScheduleState,
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

/** Janela móvel das últimas N latências (min) da NUTRI, para o fading. */
export async function ultimasLatenciasNutri(
  userId: string,
  n = 12,
): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vw_logs_latencia")
    .select("latencia_seg")
    .eq("user_id", userId)
    .in("comportamento", NUTRI)
    .order("ts", { ascending: false })
    .limit(n);
  return (data ?? []).map((r) => (r.latencia_seg as number) / 60);
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

  let houvePerturbacao = false;
  let dietaSobreviveu = false;
  for (let t = inicio; t <= fim; t += 86_400_000) {
    const dia = new Date(t).toISOString().slice(0, 10);
    const d = dias.get(dia) ?? { nutri: 0, outros: 0 };
    if (d.outros === 0) {
      houvePerturbacao = true; // rotina de outra aba furou nesse dia
      if (d.nutri > 0) dietaSobreviveu = true; // mas a dieta segurou
    }
  }

  return { houvePerturbacao, dietaSobreviveu };
}
