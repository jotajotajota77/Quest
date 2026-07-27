// ============================================================
// API — /api/tkd: registra sessão de taekwondo.
// ------------------------------------------------------------
// POST { descricao, duracao_min?, notas? }
// DELETE ?id=...
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aplicarXpDominio, personagemDoDia } from "@/lib/data";

const XP_POR_SESSAO = 20;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    descricao?: string;
    duracao_min?: number | string;
    notas?: string;
  };
  const descricao = String(body.descricao ?? "").trim();
  if (!descricao) {
    return NextResponse.json({ error: "descricao vazia" }, { status: 400 });
  }
  const duracao_min =
    body.duracao_min != null && body.duracao_min !== ""
      ? Math.max(1, Math.min(240, Math.round(Number(body.duracao_min))))
      : null;
  const notas = String(body.notas ?? "").trim() || null;

  const { error } = await supabase.from("logs_tkd").insert({
    user_id: user.id,
    descricao,
    duracao_min,
    notas,
  });
  if (error) return NextResponse.json({ error: "falha insert" }, { status: 500 });

  // Se mestre do dia tem dominio = taekwondo, credita XP no domínio
  const mestre = await personagemDoDia(user.id);
  let xp_ganho = 0;
  if (mestre?.dominio === "taekwondo") {
    await aplicarXpDominio(user.id, "taekwondo", XP_POR_SESSAO);
    xp_ganho = XP_POR_SESSAO;
  }

  return NextResponse.json({ ok: true, xp_ganho });
}

export async function DELETE(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id" }, { status: 400 });

  await supabase.from("logs_tkd").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
