// ============================================================
// API — /api/tkd: registra sessão de taekwondo.
// ------------------------------------------------------------
// POST { descricao, duracao_min?, notas? }
// DELETE ?id=...
//
// v12 PR3: cada sessão registrada aplica também dano no boss semanal
// (3 HP, matching o multiplicador de calcularBossProgresso) e XP direto
// no grupo 'taekwondo' de mastery_musculo.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  aplicarXpDominio,
  personagemDoDia,
  aplicarDanoBoss,
  aplicarMasteryDireta,
} from "@/lib/data";

const XP_POR_SESSAO = 20;
const DANO_BOSS_POR_SESSAO = 3;
const MASTERY_XP_POR_SESSAO = 25;

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

  // v12 PR3: mastery de TKD sempre (independente do mestre do dia).
  let masteryTkd: { xp: number; nivel: number } | null = null;
  try {
    masteryTkd = await aplicarMasteryDireta(user.id, "taekwondo", MASTERY_XP_POR_SESSAO);
  } catch {
    /* mastery é cosmético — não falha o registro */
  }

  // v12 PR3: cada sessão desce 3 HP no boss semanal.
  let bossRecompensa: {
    derrotou: boolean;
    xp?: number;
    shards?: number;
    photocardId?: string | null;
  } = { derrotou: false };
  try {
    const r = await aplicarDanoBoss(user.id, DANO_BOSS_POR_SESSAO);
    bossRecompensa = {
      derrotou: r.derrotou,
      xp: r.recompensa?.xp,
      shards: r.recompensa?.shards,
      photocardId: r.recompensa?.photocardId ?? null,
    };
  } catch {
    /* boss é tooling — não falha o registro */
  }

  return NextResponse.json({
    ok: true,
    xp_ganho,
    mastery: masteryTkd,
    boss: bossRecompensa,
  });
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
