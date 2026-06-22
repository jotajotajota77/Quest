// Busca no food_db (catálogo grande) — server-side, limitada. Suporta filtro
// por categoria e termo (ilike). RLS de food_db (select p/ autenticado) vale.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CategoriaAlimento } from "@/lib/alimentos";

export async function GET(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const cat = searchParams.get("cat");
  const q = (searchParams.get("q") ?? "").trim();

  let query = supabase
    .from("food_db")
    .select("id, nome, categoria, kcal, proteina, carbo, gordura")
    .order("nome", { ascending: true })
    .limit(60);
  if (cat) query = query.eq("categoria", cat);
  if (q) query = query.ilike("nome", `%${q}%`);

  const { data } = await query;
  const alimentos = (data ?? []).map((r) => ({
    id: r.id as string,
    nome: r.nome as string,
    cat: r.categoria as CategoriaAlimento,
    kcal: Number(r.kcal),
    p: Number(r.proteina),
    c: Number(r.carbo),
    g: Number(r.gordura),
  }));
  return NextResponse.json({ alimentos });
}
