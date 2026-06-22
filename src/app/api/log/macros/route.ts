// Fat Loss Coach (afinamento) — registro rico OPCIONAL de macros.
// Anexa macros a um log de Nutri JÁ criado. Nunca é exigido: o 1-toque já
// aconteceu; isto é a riqueza que "esmaece pra dentro" quando o operante forte.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { coachNutriAtivo } from "@/lib/data";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  // Gate: só aceita se o coach está ativo (operante da Nutri fortaleceu).
  if (!(await coachNutriAtivo(user.id))) {
    return NextResponse.json({ error: "coach inativo" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    logId?: string;
    kcal?: number;
    proteina?: number;
    carbs?: number;
    gordura?: number;
  };
  if (!body.logId) {
    return NextResponse.json({ error: "logId faltando" }, { status: 400 });
  }

  const { error } = await supabase
    .from("logs")
    .update({
      kcal: body.kcal ?? null,
      proteina: body.proteina ?? null,
      carbs: body.carbs ?? null,
      gordura: body.gordura ?? null,
    })
    .eq("id", body.logId)
    .eq("user_id", user.id)
    .in("comportamento", ["nutri_refeicao", "nutri_agua"]);
  if (error) {
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
