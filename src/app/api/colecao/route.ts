// ============================================================
// API — /api/colecao (v12 PR3).
// ------------------------------------------------------------
// POST { action: "marcar_visto", item_ids?: string[] }
//   Marca drops NOVOS (visto=false) como já vistos. Sem item_ids, marca
//   todos os pendentes do usuário. Chamado da /colecao no primeiro render
//   pra apagar o badge NEW depois que o usuário viu a página.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { marcarColecaoVista } from "@/lib/data";

export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: string;
    item_ids?: string[];
  };

  if (body.action === "marcar_visto") {
    const ids = Array.isArray(body.item_ids)
      ? body.item_ids.filter((s) => typeof s === "string" && s.length > 0)
      : undefined;
    await marcarColecaoVista(user.id, ids);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "ação inválida" }, { status: 400 });
}
