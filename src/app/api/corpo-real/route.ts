// Aba-espelho: grava um registro de corpo real. Input DELIBERADO, raro,
// iniciado pelo usuário — única exceção tolerada ao "1 toque" (TRAVA).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    peso?: number;
    cintura?: number;
    gordura_pct?: number;
    descricao?: string;
  };

  const { error } = await supabase.from("corpo_real").insert({
    user_id: user.id,
    peso: body.peso ?? null,
    medidas: body.cintura != null ? { cintura: body.cintura } : null,
    composicao: body.gordura_pct != null ? { gordura_pct: body.gordura_pct } : null,
    descricao: body.descricao ?? null,
  });
  if (error) {
    return NextResponse.json({ error: "falha ao salvar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
