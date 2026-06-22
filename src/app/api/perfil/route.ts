// Salva a descrição de perfil (base das dicas de treino + Análise IA). RLS
// own-row. Texto livre; limita o tamanho pra não virar payload gigante.
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
  const body = (await request.json().catch(() => ({}))) as { descricao?: string };
  const descricao = (body.descricao ?? "").slice(0, 2000);

  const { error } = await supabase.from("perfil").upsert({
    user_id: user.id,
    descricao,
    atualizado_em: new Date().toISOString(),
  });
  if (error) return NextResponse.json({ error: "falha ao salvar" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
