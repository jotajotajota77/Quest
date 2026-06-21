// Entrega ao Web Playback SDK (cliente) um access_token válido, com refresh
// automático server-side. Só o usuário dono recebe o seu próprio token.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido } from "@/lib/spotify/client";

export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "não autenticado" }, { status: 401 });
  }
  const token = await getAccessTokenValido(user.id);
  if (!token) {
    return NextResponse.json({ error: "spotify não conectado" }, { status: 404 });
  }
  return NextResponse.json({ access_token: token });
}
