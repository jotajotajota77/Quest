// Callback de autenticação do Supabase (magic link / OAuth).
// Surfacia erros: em vez de seguir mudo para /hub (e o middleware ricochetear
// para /login sem explicação), redireciona para /login?erro=... com a causa.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const code = url.searchParams.get("code");
  const erroParam =
    url.searchParams.get("error_description") || url.searchParams.get("error");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;

  const paraLogin = (msg: string) =>
    NextResponse.redirect(`${appUrl}/login?erro=${encodeURIComponent(msg)}`);

  if (erroParam) return paraLogin(erroParam);
  if (!code) return paraLogin("callback sem code (verifique flow PKCE / Site URL)");

  const supabase = createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) return paraLogin(error.message);

  // Sucesso → hub de seleção (TRAVA de UX).
  return NextResponse.redirect(`${appUrl}/hub`);
}
