// ============================================================
// /achievements — v2 (PR11 §75).
// ------------------------------------------------------------
// Server component. Lista de conquistas desbloqueadas + catálogo
// visível pra saber o que falta. Botão "Verificar agora" chama
// reavaliar API.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  achievementsDeUser,
  catalogoAchievements,
  reavaliarAchievements,
} from "@/lib/physique/data";
import AchievementsGrid from "@/components/AchievementsGrid";
import BottomNav from "@/components/BottomNav";

export default async function AchievementsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Reavalia ao abrir — barato. Silencioso em erro.
  try { await reavaliarAchievements(user.id); } catch { /* ok */ }

  const [catalogo, meus] = await Promise.all([
    catalogoAchievements(),
    achievementsDeUser(user.id),
  ]);

  const meusMap = new Map(meus.map((a) => [a.slug, a]));

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Conquistas</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          {meus.length} de {catalogo.length} desbloqueadas.
        </p>
      </header>

      <AchievementsGrid catalogo={catalogo} meus={meusMap} />

      <BottomNav />
    </main>
  );
}
