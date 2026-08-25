// ============================================================
// /checkin/weekly — weekly review skeleton (§41).
// ------------------------------------------------------------
// PR1: só o container. 3 medidas de cintura + agregados básicos.
// O engine que gera `verdict` entra no PR4. Aqui só grava dados.
// ============================================================

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  checkinSemanal,
  garantirFaseAtiva,
} from "@/lib/physique/data";
import { semanaISO } from "@/lib/physique/math";
import CheckinWeeklyForm from "@/components/CheckinWeeklyForm";
import BottomNav from "@/components/BottomNav";

export default async function CheckinWeeklyPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const semana = semanaISO();
  const [fase, atual] = await Promise.all([
    garantirFaseAtiva(user.id),
    checkinSemanal(user.id, semana),
  ]);

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Review semanal</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          Semana <strong>{semana}</strong> · Fase{" "}
          <strong>{fase.type.toUpperCase()}</strong>.
        </p>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 12 }}>
          3 medidas de cintura, agregados da semana. O engine devolve
          &quot;keep course / small adjustment / recovery&quot; a partir do PR4.
        </p>
      </header>

      <CheckinWeeklyForm inicial={atual} semanaIso={semana} />

      <BottomNav />
    </main>
  );
}
