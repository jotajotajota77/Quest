// ============================================================
// API — /api/aquecimento: registra warm-up ou alongamento.
// ------------------------------------------------------------
// POST { tipo: 'aquecimento'|'alongamento', descricao, duracao_min? }
// DELETE ?id=...
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    tipo?: string;
    descricao?: string;
    duracao_min?: number | string;
  };
  const tipo = String(body.tipo ?? "").trim();
  if (tipo !== "aquecimento" && tipo !== "alongamento") {
    return NextResponse.json({ error: "tipo invalido" }, { status: 400 });
  }
  const descricao = String(body.descricao ?? "").trim();
  if (!descricao) {
    return NextResponse.json({ error: "descricao vazia" }, { status: 400 });
  }
  const duracao_min =
    body.duracao_min != null && body.duracao_min !== ""
      ? Math.max(1, Math.min(120, Math.round(Number(body.duracao_min))))
      : null;

  const { error } = await supabase.from("logs_aquecimento").insert({
    user_id: user.id,
    tipo,
    descricao,
    duracao_min,
  });
  if (error) return NextResponse.json({ error: "falha insert" }, { status: 500 });
  return NextResponse.json({ ok: true });
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

  await supabase.from("logs_aquecimento").delete().eq("id", id).eq("user_id", user.id);
  return NextResponse.json({ ok: true });
}
