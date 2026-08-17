// ============================================================
// API — /api/saber (Fase 1). Actions:
//   iniciar_sessao       — cria linha em saber_sessao, devolve id
//   registrar_producao   — grava resposta livre + autonota (0-3)
//   finalizar_sessao     — fecha a sessão com minutos + esforço + fronteiras
// XP/faixa/boss/painel: NADA aqui (é Fase 2).
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    ordem?: string;
    sessao_id?: number;
    item_id?: number;
    texto?: string;
    autonota?: number;
    lente?: string;
    minutos?: number;
    esforco?: number;
    fronteiras?: string;
    interrompida?: boolean;
  };

  if (body.action === "iniciar_sessao") {
    const ordem = ["didatica", "cronologica", "projeto"].includes(String(body.ordem))
      ? String(body.ordem)
      : "didatica";
    const { data, error } = await supabase
      .from("saber_sessao")
      .insert({ user_id: user.id, ordem_usada: ordem })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, sessao_id: data.id });
  }

  if (body.action === "registrar_producao") {
    const itemId = Number(body.item_id);
    const texto = String(body.texto ?? "").trim();
    const autonota = Number(body.autonota);
    if (!itemId || !texto) {
      return NextResponse.json({ error: "item_id + texto" }, { status: 400 });
    }
    if (!(autonota >= 0 && autonota <= 3)) {
      return NextResponse.json({ error: "autonota 0-3" }, { status: 400 });
    }
    const { error } = await supabase.from("saber_producao").insert({
      user_id: user.id,
      item_id: itemId,
      texto,
      autonota,
      lente: body.lente ? String(body.lente) : null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "finalizar_sessao") {
    const id = Number(body.sessao_id);
    if (!id) return NextResponse.json({ error: "sessao_id" }, { status: 400 });
    const minutos = body.minutos ? Math.max(1, Math.min(240, Math.round(Number(body.minutos)))) : null;
    const esforco = body.esforco != null ? Math.max(1, Math.min(5, Math.round(Number(body.esforco)))) : null;
    const { error } = await supabase
      .from("saber_sessao")
      .update({
        finalizada_em: new Date().toISOString(),
        minutos,
        esforco,
        fronteiras: body.fronteiras ? String(body.fronteiras).slice(0, 2000) : null,
        interrompida: Boolean(body.interrompida),
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "ação inválida" }, { status: 400 });
}
