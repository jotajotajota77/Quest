// Callback de autenticação do Supabase (magic link / OAuth).
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  if (code) {
    const supabase = createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }
  // Pós-login cai no hub de seleção (TRAVA de UX), nunca direto na home.
  return NextResponse.redirect(`${appUrl}/hub`);
}
