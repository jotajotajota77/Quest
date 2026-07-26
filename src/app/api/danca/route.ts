// ============================================================
// API — /api/danca: registra sessão de dança.
// ------------------------------------------------------------
// POST {musica, spotify_url?, duracao_min?, nota?}
// Também: se o mestre do dia tem dominio='danca', adiciona XP no domínio.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aplicarXpDominio, personagemDoDia } from "@/lib/data";

const XP_POR_SESSAO = 15;

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    musica?: string;
    spotify_url?: string;
    duracao_min?: number | string;
    nota?: string;
  };

  const musica = String(body.musica ?? "").trim();
  if (!musica) {
    return NextResponse.json({ error: "musica vazia" }, { status: 400 });
  }
  const spotify_url = String(body.spotify_url ?? "").trim() || null;
  const duracao_min =
    body.duracao_min != null && body.duracao_min !== ""
      ? Math.max(1, Math.min(240, Math.round(Number(body.duracao_min))))
      : null;
  const nota = String(body.nota ?? "").trim() || null;

  const { error } = await supabase.from("logs_danca").insert({
    user_id: user.id,
    musica,
    spotify_url,
    duracao_min,
    nota,
  });
  if (error) {
    return NextResponse.json({ error: "falha insert" }, { status: 500 });
  }

  // Se o mestre do dia é de dança, adiciona XP no domínio.
  const mestre = await personagemDoDia(user.id);
  let xp_ganho = 0;
  if (mestre?.dominio === "danca") {
    await aplicarXpDominio(user.id, "danca", XP_POR_SESSAO);
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

  await supabase.from("logs_danca").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
