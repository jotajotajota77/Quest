// ============================================================
// Reset de HISTÓRICO — apaga registros e séries (dados de teste), mantendo o
// XP/atributos/tier acumulados. NÃO toca em `atributos` nem em schedule_state.
// Destrutivo e irreversível: o cliente confirma antes de chamar.
// RLS (own-row) garante que só apaga as linhas do próprio usuário.
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const uid = user.id;

  // Ordem: filhos/independentes primeiro. historico_reforco.log_id é
  // ON DELETE SET NULL, então a ordem com logs é indiferente — apagamos os
  // dois de qualquer forma para não deixar registros órfãos.
  await supabase.from("treino_series").delete().eq("user_id", uid);
  await supabase.from("treino_sessoes").delete().eq("user_id", uid);
  await supabase.from("historico_reforco").delete().eq("user_id", uid);
  await supabase.from("logs").delete().eq("user_id", uid);

  return NextResponse.json({ ok: true });
}
