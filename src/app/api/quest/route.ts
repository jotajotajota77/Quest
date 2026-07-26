// ============================================================
// API — /api/quest: marca uma quest do dia como concluída (manual).
// ------------------------------------------------------------
// POST { quest_id: string }
// Só funciona pra quests manuais (tkd/musculação) — as auto (nutri, treino,
// água) são preenchidas pelo motor de logs.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hojeISO } from "@/lib/data";
import { questsDeHoje } from "@/lib/quests";
import { garantirAtributos } from "@/lib/data";
import { tierDeXp } from "@/lib/engine/tier";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { quest_id?: string };
  const questId = String(body.quest_id ?? "").trim();
  if (!questId) return NextResponse.json({ error: "quest_id" }, { status: 400 });

  const data = hojeISO();
  const templates = questsDeHoje(data);
  const t = templates.find((q) => q.id === questId);
  if (!t) return NextResponse.json({ error: "quest not in today" }, { status: 404 });
  if (!t.manual) {
    return NextResponse.json(
      { error: "quest auto — não precisa marcar" },
      { status: 400 },
    );
  }

  // Idempotente: se já tá completa, não credita de novo
  const { data: existente } = await supabase
    .from("quests")
    .select("estado")
    .eq("user_id", user.id)
    .eq("data", data)
    .eq("quest_id", questId)
    .maybeSingle();
  if (existente?.estado === "completa") {
    return NextResponse.json({ ok: true, ja_concluida: true });
  }

  // Marca completa
  await supabase.from("quests").upsert({
    user_id: user.id,
    data,
    quest_id: questId,
    tipo: t.tipo,
    descricao: t.descricao,
    xp: t.xp,
    estado: "completa",
  });

  // Credita XP
  const attr = await garantirAtributos(user.id);
  const novoXp = attr.xp + t.xp;
  const tier = tierDeXp(novoXp);
  await supabase
    .from("atributos")
    .update({
      xp: novoXp,
      tier_base: tier.base.sigla,
      tier_divisao: tier.rank % 4,
      atualizado_em: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  return NextResponse.json({ ok: true, xp_ganho: t.xp });
}
