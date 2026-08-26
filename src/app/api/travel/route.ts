// ============================================================
// POST /api/travel — inicia/encerra viagem (PR10, §23).
// ------------------------------------------------------------
// action: 'iniciar' | 'encerrar'.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { encerrarTravel, iniciarTravel } from "@/lib/physique/data";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as {
    action?: string;
    termina_em?: string;
    proteina_min?: number;
    reentry_dias?: number;
  };
  const action = String(body.action ?? "");

  if (action === "iniciar") {
    const r = await iniciarTravel(user.id, {
      termina_em: body.termina_em,
      proteina_min: body.proteina_min,
    });
    return NextResponse.json({ ok: true, travel: r });
  }
  if (action === "encerrar") {
    await encerrarTravel(user.id, Number(body.reentry_dias ?? 3));
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "action inválido" }, { status: 400 });
}
