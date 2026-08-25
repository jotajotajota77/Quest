// ============================================================
// /checkin — daily check-in minimal (<60s, §40).
// ------------------------------------------------------------
// PR1: server component busca o check-in do dia + fase ativa, delega
// pro client component o formulário. Sem XP, sem gamificação. Só grava.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  checkinDoDia,
  garantirFaseAtiva,
} from "@/lib/physique/data";
import CheckinDailyForm from "@/components/CheckinDailyForm";
import BottomNav from "@/components/BottomNav";

export default async function CheckinDailyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [fase, dia] = await Promise.all([
    garantirFaseAtiva(user.id),
    checkinDoDia(user.id),
  ]);

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Check-in do dia</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          {"< 1 min. Sem julgamento. Fase ativa: "}
          <strong>{fase.type.toUpperCase()}</strong>.
        </p>
      </header>

      <CheckinDailyForm inicial={dia} />

      <BottomNav />
    </main>
  );
}
