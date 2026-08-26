// ============================================================
// /phase — Physique Engine dashboard (PR4, §42, §88).
// ------------------------------------------------------------
// Mostra: fase ativa, target vigente, última decisão do engine.
// Sem loops de reforço. Nada de "+XP por perder peso" (§27, §65).
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  garantirFaseAtiva,
  garantirTargetAtivo,
  historicoFases,
  transicoesPendentes,
  ultimaDecisaoEngine,
} from "@/lib/physique/data";
import PhaseDashboard from "@/components/PhaseDashboard";
import PhaseTimeline from "@/components/PhaseTimeline";
import PhaseTransitions from "@/components/PhaseTransitions";
import BottomNav from "@/components/BottomNav";

export default async function PhasePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [fase, target, decisao, historico, transicoes] = await Promise.all([
    garantirFaseAtiva(user.id),
    garantirTargetAtivo(user.id),
    ultimaDecisaoEngine(user.id),
    historicoFases(user.id),
    transicoesPendentes(user.id),
  ]);

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Fase</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          Engine determinístico. Sem IA. Você aceita, adia ou ignora — nada é
          aplicado sozinho.
        </p>
      </header>

      <PhaseDashboard
        fase={fase}
        target={target}
        decisao={decisao}
      />

      {transicoes.length > 0 && (
        <PhaseTransitions transicoes={transicoes} />
      )}

      <PhaseTimeline historico={historico} />

      <BottomNav />
    </main>
  );
}
