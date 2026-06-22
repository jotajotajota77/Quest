// Inicia o OAuth do Spotify (Authorization Code).
import { NextResponse } from "next/server";
import { SPOTIFY_SCOPES } from "@/lib/spotify/client";

export async function GET() {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SPOTIFY_SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });
  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params.toString()}`,
  );
}
