// ============================================================
// I/O do módulo SABER — Supabase queries.
// ============================================================
import { createClient } from "@/lib/supabase/server";
import type { Conceito, Aresta, Item, MasteryConceito, Camada } from "./tipos";

export async function carregarConceitos(): Promise<Conceito[]> {
  const supabase = createClient();
  const { data } = await supabase.from("saber_conceito").select("*").order("slug");
  return (data ?? []) as Conceito[];
}

export async function carregarArestas(): Promise<Aresta[]> {
  const supabase = createClient();
  const { data } = await supabase.from("saber_prereq").select("*");
  return (data ?? []) as Aresta[];
}

export async function carregarItemsDoConceito(slug: string): Promise<Item[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("saber_item")
    .select("*")
    .eq("conceito", slug)
    .order("camada", { ascending: true });
  return (data ?? []) as Item[];
}

export async function carregarMasteryConceito(userId: string): Promise<MasteryConceito[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("mastery_conceito")
    .select("conceito, xp, nivel")
    .eq("user_id", userId);
  return (data ?? []) as MasteryConceito[];
}

export interface ItemSessao {
  bloco: "aquecimento" | "novo" | "contraprova" | "aplicacao";
  conceito_slug: string;
  conceito_titulo: string;
  item?: Item;
}

/**
 * Monta o roteiro de uma sessão Fase 1:
 *   Aquecimento — nenhum item da Fase 1 (não tem SM-2 rodando ainda)
 *   Novo        — 1 conceito aberto, item camada 2 (explicação de memória)
 *   Contraprova — mesmo conceito, item camada 2 (exemplo + contraexemplo)
 *   Aplicação   — item camada 3 (se existir) ou nova camada 2 (fallback)
 * Retorna array de blocos pra tela renderizar.
 */
export async function montarRoteiroSessao(
  proximoConceito: Conceito,
): Promise<ItemSessao[]> {
  const items = await carregarItemsDoConceito(proximoConceito.slug);
  const item2 = items.find((i) => i.camada === 2);
  const item3 = items.find((i) => i.camada === 3);
  return [
    { bloco: "novo", conceito_slug: proximoConceito.slug, conceito_titulo: proximoConceito.titulo, item: item2 },
    { bloco: "contraprova", conceito_slug: proximoConceito.slug, conceito_titulo: proximoConceito.titulo, item: item2 },
    { bloco: "aplicacao", conceito_slug: proximoConceito.slug, conceito_titulo: proximoConceito.titulo, item: item3 ?? item2 },
  ];
}
