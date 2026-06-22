// Atualiza os TRACKERS LEVES do protocolo (água/sono/passos/álcool). 1-toque.
// Alimentam só o %/streak do protocolo — não dão XP/atributo.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/data";
import { AGUA_META } from "@/lib/protocolo";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { action?: string };
  const data = hojeISO();

  const { data: row } = await supabase
    .from("protocolo_diario")
    .select("trackers_leves")
    .eq("user_id", user.id)
    .eq("data", data)
    .maybeSingle();

  const t = {
    agua_count: 0,
    sono_ok: false,
    passos_ok: false,
    sem_alcool: false,
    ...((row?.trackers_leves as Record<string, unknown>) ?? {}),
  } as { agua_count: number; sono_ok: boolean; passos_ok: boolean; sem_alcool: boolean };

  switch (body.action) {
    case "agua":
      t.agua_count = Math.min(AGUA_META + 4, t.agua_count + 1);
      break;
    case "agua_reset":
      t.agua_count = 0;
      break;
    case "sono":
      t.sono_ok = !t.sono_ok;
      break;
    case "passos":
      t.passos_ok = !t.passos_ok;
      break;
    case "alcool":
      t.sem_alcool = !t.sem_alcool;
      break;
    default:
      return NextResponse.json({ error: "ação inválida" }, { status: 400 });
  }

  const { error } = await supabase.from("protocolo_diario").upsert({
    user_id: user.id,
    data,
    trackers_leves: t,
    atualizado_em: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "falha" }, { status: 500 });
  return NextResponse.json({ ok: true, trackers: t });
}
