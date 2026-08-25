// ============================================================
// Adaptive Physique RPG — POST /api/phase (PR 4).
// ------------------------------------------------------------
// Ações:
//   - avaliar: roda o engine e grava nova decisão (physique_engine_decision).
//   - decidir: usuário marca uma decisão como aceito/adiado/ignorado.
//
// PR4 NÃO aplica automaticamente mudanças em nutrition_target. O engine
// propõe, o usuário decide (§88). Se aceito = 'aceito', PR5 vai
// materializar a mudança (fora do escopo aqui).
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { avaliarFaseCut, marcarDecisao } from "@/lib/physique/data";

interface AvaliarBody {
  action: "avaliar";
}
interface DecidirBody {
  action: "decidir";
  id: number;
  aceito: "aceito" | "adiado" | "ignorado";
}
type Body = AvaliarBody | DecidirBody;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const raw = (await request.json().catch(() => null)) as Body | null;
  if (!raw || (raw.action !== "avaliar" && raw.action !== "decidir")) {
    return NextResponse.json({ error: "action inválido" }, { status: 400 });
  }

  if (raw.action === "avaliar") {
    try {
      const r = await avaliarFaseCut(user.id);
      return NextResponse.json({ ok: true, ...r });
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "falha engine" },
        { status: 500 },
      );
    }
  }

  const id = Number(raw.id);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "id inválido" }, { status: 400 });
  }
  if (!["aceito", "adiado", "ignorado"].includes(raw.aceito)) {
    return NextResponse.json({ error: "aceito inválido" }, { status: 400 });
  }
  await marcarDecisao(user.id, id, raw.aceito);
  return NextResponse.json({ ok: true });
}
