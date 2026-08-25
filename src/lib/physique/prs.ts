// ============================================================
// Adaptive Physique RPG — PR Engine multidimensional (PR3, §54-57).
// ------------------------------------------------------------
// Server-side. Recebe uma série gravada + metric_type e devolve a
// lista de PRs que foram batidos naquela série. Não escreve — quem
// escreve é o chamador (POST /api/treino) via `registrarPrs`.
//
// Regra §57: um PR é sempre por (nome, metric_type, tipo). Prancha
// (time) e puxada (weight_reps) NUNCA competem pelo mesmo PR.
// ============================================================

import { createClient } from "@/lib/supabase/server";
import type { MetricType, SerieCampos } from "./exercicios";

export type TipoPr = "carga" | "reps" | "volume" | "tempo" | "distancia";

export interface PrCandidato {
  tipo: TipoPr;
  valor: number;
  reps_no_top: number | null;
  peso_no_top: number | null;
  seconds_no_top: number | null;
}

/**
 * Retorna quais dimensões de PR são aplicáveis pra este metric_type.
 * bw_assisted e interval e custom não geram PR direto (PR4 se precisar).
 */
export function tiposDePrDe(metric: MetricType): TipoPr[] {
  switch (metric) {
    case "weight_reps":
      return ["carga", "reps", "volume"];
    case "bw_weighted":
      return ["carga", "reps"];
    case "bw_reps":
      return ["reps"];
    case "time":
    case "duration":
      return ["tempo"];
    case "distance":
      return ["distancia"];
    case "bw_assisted":
    case "interval":
    case "custom":
      return [];
  }
}

/**
 * Extrai os candidatos a PR de uma série. Cada candidato vira uma
 * comparação contra o histórico.
 */
export function candidatosDeSerie(metric: MetricType, s: SerieCampos): PrCandidato[] {
  const out: PrCandidato[] = [];
  const base = {
    reps_no_top: s.reps ?? null,
    peso_no_top: s.peso ?? null,
    seconds_no_top: s.seconds ?? null,
  };
  for (const tipo of tiposDePrDe(metric)) {
    const valor = valorDePr(tipo, s);
    if (valor === null || !Number.isFinite(valor)) continue;
    out.push({ tipo, valor, ...base });
  }
  return out;
}

function valorDePr(tipo: TipoPr, s: SerieCampos): number | null {
  switch (tipo) {
    case "carga":
      return s.peso ?? null;
    case "reps":
      return s.reps ?? null;
    case "volume":
      return s.peso != null && s.reps != null ? s.peso * s.reps : null;
    case "tempo":
      return s.seconds ?? null;
    case "distancia":
      return s.distance_m ?? null;
  }
}

/**
 * Compara os candidatos contra o melhor histórico (por tipo) e
 * grava um `personal_record` por dimensão que foi batida. Retorna
 * a lista de tipos batidos (pra UI mostrar "PR de carga + PR de volume").
 */
export async function registrarPrs(
  userId: string,
  nome: string,
  metric: MetricType,
  candidatos: PrCandidato[],
  serieId: string | null,
): Promise<TipoPr[]> {
  if (!candidatos.length) return [];
  const supabase = createClient();

  const tipos = candidatos.map((c) => c.tipo);
  const { data: melhores } = await supabase
    .from("personal_record")
    .select("id, tipo, valor")
    .eq("user_id", userId)
    .eq("nome", nome)
    .eq("metric_type", metric)
    .in("tipo", tipos)
    .is("deposed_by_id", null);

  const melhorPorTipo = new Map<TipoPr, { id: number; valor: number }>();
  for (const r of melhores ?? []) {
    melhorPorTipo.set(r.tipo as TipoPr, {
      id: r.id as number,
      valor: Number(r.valor),
    });
  }

  const batidos: TipoPr[] = [];
  const now = new Date().toISOString();

  for (const cand of candidatos) {
    const anterior = melhorPorTipo.get(cand.tipo);
    if (anterior && anterior.valor >= cand.valor) continue;

    const { data: novo, error } = await supabase
      .from("personal_record")
      .insert({
        user_id: userId,
        exercise_slug: null,
        nome,
        metric_type: metric,
        tipo: cand.tipo,
        valor: cand.valor,
        reps_no_top: cand.reps_no_top,
        peso_no_top: cand.peso_no_top,
        seconds_no_top: cand.seconds_no_top,
        batido_em: now,
        serie_id: serieId,
      })
      .select("id")
      .single();
    if (error || !novo) continue;

    if (anterior) {
      await supabase
        .from("personal_record")
        .update({ deposed_by_id: novo.id })
        .eq("id", anterior.id);
    }
    batidos.push(cand.tipo);
  }

  return batidos;
}

/**
 * Últimos PRs vigentes do usuário (deposed_by_id null). Pra badge na
 * ficha do exercício.
 */
export async function prsVigentes(
  userId: string,
  nome: string,
): Promise<{ tipo: TipoPr; valor: number; batido_em: string }[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("personal_record")
    .select("tipo, valor, batido_em")
    .eq("user_id", userId)
    .eq("nome", nome)
    .is("deposed_by_id", null)
    .order("batido_em", { ascending: false });
  return (data ?? []).map((r) => ({
    tipo: r.tipo as TipoPr,
    valor: Number(r.valor),
    batido_em: r.batido_em as string,
  }));
}
