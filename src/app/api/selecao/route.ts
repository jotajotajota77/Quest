// Define o protagonista do dia (hub de seleção). Seleção 100% livre.
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
    personagemId?: string;
  };
  if (!body.personagemId) {
    return NextResponse.json({ error: "personagemId faltando" }, { status: 400 });
  }

  const hoje = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from("selecao_diaria").upsert({
    user_id: user.id,
    data: hoje,
    personagem_id: body.personagemId,
  });
  if (error) {
    return NextResponse.json({ error: "falha ao selecionar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
