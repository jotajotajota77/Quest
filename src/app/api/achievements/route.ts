// ============================================================
// POST /api/achievements — reavalia critérios (PR11).
// ------------------------------------------------------------
// Chamado sob demanda (botão "Verificar" ou ao abrir a página).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reavaliarAchievements } from "@/lib/physique/data";

export async function POST() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  const novos = await reavaliarAchievements(user.id);
  return NextResponse.json({ ok: true, novos });
}
