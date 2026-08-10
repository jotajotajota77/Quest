// ============================================================
// API — /api/colecao (v12 PR3 + v12.4 interações).
// ------------------------------------------------------------
// POST { action: "marcar_visto", item_ids?: string[] }
//   Marca drops NOVOS (visto=false) como já vistos.
//
// POST { action: "favoritar", item_id: string, favorito: boolean }
//   Toggle favorita. Só 1 photocard favorita por vez (unique index no DB).
//   Se favorito=true, primeiro desfavorita as demais photocards do usuário.
//
// POST { action: "trocar_duplicata", item_id: string }
//   Consome 1 duplicata (quantidade -1) e credita SHARDS_POR_DUPLICATA[raridade].
//   Requer quantidade > 1. Se cair a 1, mantém a "original" e não deleta.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { marcarColecaoVista } from "@/lib/data";
import { photocardPorId, SHARDS_POR_DUPLICATA } from "@/lib/photocards";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    item_id?: string;
    item_ids?: string[];
    favorito?: boolean;
  };

  // ── marcar_visto ──
  if (body.action === "marcar_visto") {
    const ids = Array.isArray(body.item_ids)
      ? body.item_ids.filter((s) => typeof s === "string" && s.length > 0)
      : undefined;
    await marcarColecaoVista(user.id, ids);
    return NextResponse.json({ ok: true });
  }

  // ── favoritar ──
  if (body.action === "favoritar") {
    const itemId = String(body.item_id ?? "");
    const querFavoritar = Boolean(body.favorito);
    if (!itemId) return NextResponse.json({ error: "item_id" }, { status: 400 });

    if (querFavoritar) {
      // Unique index (user_id) where favorito=true and tipo=photocard: desfavorita
      // as demais photocards antes de setar a nova.
      await supabase
        .from("colecao_item")
        .update({ favorito: false })
        .eq("user_id", user.id)
        .eq("tipo", "photocard")
        .neq("item_id", itemId);
    }
    await supabase
      .from("colecao_item")
      .update({ favorito: querFavoritar })
      .eq("user_id", user.id)
      .eq("item_id", itemId);
    return NextResponse.json({ ok: true, favorito: querFavoritar });
  }

  // ── trocar_duplicata ──
  if (body.action === "trocar_duplicata") {
    const itemId = String(body.item_id ?? "");
    if (!itemId) return NextResponse.json({ error: "item_id" }, { status: 400 });

    const { data: item } = await supabase
      .from("colecao_item")
      .select("quantidade, tipo")
      .eq("user_id", user.id)
      .eq("item_id", itemId)
      .maybeSingle();
    if (!item) return NextResponse.json({ error: "item não encontrado" }, { status: 404 });
    if ((item.quantidade as number) <= 1) {
      return NextResponse.json({ error: "sem duplicata" }, { status: 400 });
    }
    if (item.tipo !== "photocard") {
      return NextResponse.json({ error: "só photocard troca por shards" }, { status: 400 });
    }
    const pc = photocardPorId(itemId);
    if (!pc) return NextResponse.json({ error: "catálogo" }, { status: 400 });

    const shardsGanhos = SHARDS_POR_DUPLICATA[pc.raridade];
    const novaQuant = (item.quantidade as number) - 1;

    await supabase
      .from("colecao_item")
      .update({ quantidade: novaQuant })
      .eq("user_id", user.id)
      .eq("item_id", itemId);

    const { data: attr } = await supabase
      .from("atributos")
      .select("shards")
      .eq("user_id", user.id)
      .maybeSingle();
    const atual = (attr?.shards as number) ?? 0;
    await supabase
      .from("atributos")
      .update({ shards: atual + shardsGanhos })
      .eq("user_id", user.id);

    return NextResponse.json({
      ok: true,
      shards_ganhos: shardsGanhos,
      shards_totais: atual + shardsGanhos,
      quantidade_restante: novaQuant,
    });
  }

  return NextResponse.json({ error: "ação inválida" }, { status: 400 });
}
