// Acesso a dados server-side compartilhado pelas rotas/loops.
import type {
  Comportamento,
  Esquema,
  Personagem,
  ScheduleState,
} from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

/** Garante que existe linha de atributos para o usuário. */
export async function garantirAtributos(userId: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("atributos")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (data) return data;
  const { data: novo } = await supabase
    .from("atributos")
    .insert({ user_id: userId })
    .select("*")
    .single();
  return novo;
}

/** Garante schedule_state para um comportamento (inicia em CRF). */
export async function garantirSchedule(
  userId: string,
  comportamento: Comportamento,
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

/** Janela móvel das últimas N latências (segundos) para o fading. */
export async function ultimasLatencias(
  userId: string,
  n = 12,
): Promise<number[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("vw_logs_dieta_latencia")
    .select("latencia_seg")
    .eq("user_id", userId)
    .order("ts", { ascending: false })
    .limit(n);
  return (data ?? []).map((r) => (r.latencia_seg as number) / 60); // → minutos
}

/** Quantos registros houve desde a última música tocada (faixa_cheia). */
export async function registrosDesdeUltimaMusica(
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
    .from("logs_dieta")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  if (ultima?.ts) query = query.gt("ts", ultima.ts);
  const { count } = await query;
  return count ?? 0;
}
