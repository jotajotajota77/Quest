// Recebe o code do Spotify, troca por tokens e volta para a home.
// O redirect final é RELATIVO à própria request (mesmo host do callback) —
// não depende de NEXT_PUBLIC_APP_URL, que se desatualizado mandava pra
// localhost e deixava a tela em branco após autorizar.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trocarCodePorToken } from "@/lib/spotify/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const erroOAuth = request.nextUrl.searchParams.get("error");
  const destino = (status: string) =>
    NextResponse.redirect(new URL(`/home?spotify=${status}`, request.url));

  if (erroOAuth) return destino("negado"); // usuário recusou no Spotify

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !code) return destino("erro");
  try {
    await trocarCodePorToken(user.id, code);
    return destino("ok");
  } catch {
    return destino("erro");
  }
}
