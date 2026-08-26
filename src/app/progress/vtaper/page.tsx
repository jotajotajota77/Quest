// ============================================================
// /progress/vtaper — V-Taper Skill Tree (PR 8, §10, §16, §39, §100).
// ------------------------------------------------------------
// Server component. Cada nó da tree = grupo muscular com:
//   - Nível de mastery + XP.
//   - Tier S/A/B/C (editável via chip).
//   - Sinal visual de S-tier (foco máximo).
//
// V-Taper prioriza: back_width, shoulders_side (largura), depois
// upper_chest, back_thickness, shoulders_rear.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarMasteryMusculo } from "@/lib/data";
import { prioritiesDe } from "@/lib/physique/data";
import { GRUPOS_MUSCULARES, GRUPOS_VTAPER } from "@/lib/engine/mastery";
import VTaperTree from "@/components/VTaperTree";
import BottomNav from "@/components/BottomNav";

export default async function VTaperPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [masteries, priorities] = await Promise.all([
    carregarMasteryMusculo(user.id),
    prioritiesDe(user.id),
  ]);

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>V-Taper</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          Skill tree. S-tier = foco máximo. Toque no chip pra mudar o tier.
        </p>
      </header>

      <VTaperTree
        masteries={masteries.map((m) => ({
          grupo: m.grupo,
          nivel: m.nivel,
          xp: m.xp,
          xpNoNivel: m.xpNoNivel,
          xpPraProximo: m.xpPraProximo,
          pctPraProximo: m.pctPraProximo,
        }))}
        priorities={priorities}
        gruposTodos={[...GRUPOS_MUSCULARES]}
        gruposVtaper={[...GRUPOS_VTAPER]}
      />

      <BottomNav />
    </main>
  );
}
