// ============================================================
// Adaptive Physique RPG — POST /api/phase (PR 4 + PR 5).
// ------------------------------------------------------------
// Ações:
//   - avaliar: roda o engine e grava nova decisão (physique_engine_decision).
//   - decidir: usuário marca uma decisão como aceito/adiado/ignorado.
//     PR5: quando aceito, materializa `nutrition_target` novo se o engine
//     sugeriu kcal diferente do atual. Preserva piso §72.
// ============================================================

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  aplicarDecisaoEmTarget,
  avaliarFaseCut,
  marcarDecisao,
} from "@/lib/physique/data";

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

  // PR5 §20-24: aceito → materializa nutrition_target novo se o engine
  // propôs mudança de kcal. adiado/ignorado NÃO mexem no target.
  let targetAplicado: { id: number; kcal: number } | null = null;
  if (raw.aceito === "aceito") {
    try {
      targetAplicado = await aplicarDecisaoEmTarget(user.id, id);
    } catch {
      /* materialização é tooling — não falha o marcarDecisao */
    }
  }
  return NextResponse.json({ ok: true, target_aplicado: targetAplicado });
}
