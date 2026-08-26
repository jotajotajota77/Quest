// ============================================================
// POST /api/priority — set tier de músculo (PR 8, V-Taper).
// ------------------------------------------------------------
// Body: { muscle_group: string, tier: 's'|'a'|'b'|'c', ordem?: number }
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { definirPriority, type PriorityTier } from "@/lib/physique/data";

const TIERS: PriorityTier[] = ["s", "a", "b", "c"];

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    muscle_group?: string;
    tier?: string;
    ordem?: number;
  };
  const grupo = String(body.muscle_group ?? "").trim();
  const tier = body.tier as PriorityTier;
  if (!grupo || !TIERS.includes(tier)) {
    return NextResponse.json({ error: "params" }, { status: 400 });
  }
  await definirPriority(user.id, grupo, tier, Number(body.ordem ?? 0));
  return NextResponse.json({ ok: true });
}
