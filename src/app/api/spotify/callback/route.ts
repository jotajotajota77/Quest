// Recebe o code do Spotify, troca por tokens e volta para a home.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { trocarCodePorToken } from "@/lib/spotify/client";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !code) {
    return NextResponse.redirect(`${appUrl}/home?spotify=erro`);
  }
  try {
    await trocarCodePorToken(user.id, code);
    return NextResponse.redirect(`${appUrl}/home?spotify=ok`);
  } catch {
    return NextResponse.redirect(`${appUrl}/home?spotify=erro`);
  }
}
