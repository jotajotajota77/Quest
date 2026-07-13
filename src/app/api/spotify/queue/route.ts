// ============================================================
// Player + fila (v9) — leitura simples do que está tocando + o que vem a
// seguir, direto da Web API (/me/player/queue). Só leitura; nenhuma ação de
// controle aqui (o toque na aba já dispara a faixa via /api/spotify/play).
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido, spotifyGet } from "@/lib/spotify/client";
import type { SpotifyTrack } from "@/lib/types";

interface TrackObj {
  id: string;
  uri: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}
interface QueueResp {
  currently_playing: TrackObj | null;
  queue: TrackObj[];
}

function mapear(t: TrackObj): SpotifyTrack {
  return {
    id: t.id,
    uri: t.uri,
    nome: t.name,
    artistas: t.artists.map((a) => a.name).join(", "),
    capa: t.album.images?.[0]?.url ?? null,
  };
}

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
    return NextResponse.json({ conectado: false, tocando: null, fila: [] });
  }

  const resp = await spotifyGet<QueueResp>(token, "/me/player/queue");
  return NextResponse.json({
    conectado: true,
    tocando: resp?.currently_playing ? mapear(resp.currently_playing) : null,
    fila: (resp?.queue ?? []).slice(0, 5).map(mapear),
  });
}
