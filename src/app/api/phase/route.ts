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
  decidirTransicao,
  marcarDecisao,
  trocarFase,
} from "@/lib/physique/data";
import type { PhysiquePhase } from "@/lib/physique/tipos";

const TIPOS_FASE: PhysiquePhase["type"][] = [
  "cut", "maintenance", "build", "specialization",
  "mini_cut", "recovery", "travel", "custom",
];

interface AvaliarBody {
  action: "avaliar";
}
interface DecidirBody {
  action: "decidir";
  id: number;
  aceito: "aceito" | "adiado" | "ignorado";
}
interface TrocarBody {
  action: "trocar_fase";
  tipo: PhysiquePhase["type"];
  calorie_target?: number;
  protein_target?: number;
  goal?: string;
}
interface DecidirTransicaoBody {
  action: "decidir_transicao";
  transicao_id: number;
  decisao: "aceito" | "adiado" | "ignorado";
}
type Body = AvaliarBody | DecidirBody | TrocarBody | DecidirTransicaoBody;

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "não autenticado" }, { status: 401 });

  const raw = (await request.json().catch(() => null)) as Body | null;
  const validas = ["avaliar", "decidir", "trocar_fase", "decidir_transicao"];
  if (!raw || !validas.includes(raw.action)) {
    return NextResponse.json({ error: "action inválido" }, { status: 400 });
  }

  if (raw.action === "trocar_fase") {
    if (!TIPOS_FASE.includes(raw.tipo)) {
      return NextResponse.json({ error: "tipo inválido" }, { status: 400 });
    }
    const nova = await trocarFase(user.id, raw.tipo, {
      calorie_target: raw.calorie_target,
      protein_target: raw.protein_target,
      goal: raw.goal,
    });
    return NextResponse.json({ ok: true, fase: nova });
  }

  if (raw.action === "decidir_transicao") {
    if (!["aceito", "adiado", "ignorado"].includes(raw.decisao)) {
      return NextResponse.json({ error: "decisao" }, { status: 400 });
    }
    const r = await decidirTransicao(user.id, Number(raw.transicao_id), raw.decisao);
    return NextResponse.json({ ok: true, ...r });
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
