// Modo Névoa (anti-culpa) — marca o dia como recolhimento declarado.
// NÃO quebra streak; é neutro ao motor de fading (ver data.ts). Input mínimo:
// só a confirmação binária do modal. Sem julgamento.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/data";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const { error } = await supabase.from("dias").upsert({
    user_id: user.id,
    data: hojeISO(),
    fog_mode: true,
    streak_preservado: true,
    atualizado_em: new Date().toISOString(),
  });
  if (error) {
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
