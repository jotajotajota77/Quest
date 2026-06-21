// ============================================================
// "Nova-no-sistema" — faixa que o app AINDA NÃO TOCOU para este usuário.
// ------------------------------------------------------------
//  * Critério é o HISTÓRICO INTERNO (`historico_reforco`), NÃO a data de
//    lançamento da faixa.
//  * Lê a biblioteca do usuário (saved tracks) via Web API, exclui as já
//    tocadas e devolve a próxima inédita. A marcação como "tocada" acontece
//    no histórico quando o reforço é registrado (ver /api/spotify/mark-played).
//  * Se o Spotify não responder, retorna null — o loop central segue com o
//    hit-confirm local (fallback). A música é bônus, não piso.
// ============================================================

import type { SpotifyTrack } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido, spotifyGet } from "@/lib/spotify/client";

interface SavedTracksResp {
  items: Array<{
    track: {
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { images: Array<{ url: string }> };
    } | null;
  }>;
  next: string | null;
}

/** Ids de faixas já tocadas (faixa_cheia) para este usuário. */
async function faixasJaTocadas(userId: string): Promise<Set<string>> {
  const supabase = createClient();
  const { data } = await supabase
    .from("historico_reforco")
    .select("faixa_id")
    .eq("user_id", userId)
    .not("faixa_id", "is", null);
  return new Set((data ?? []).map((r) => r.faixa_id as string));
}

/**
 * Seleciona a próxima faixa nova-no-sistema. Varre a biblioteca salva em
 * páginas até achar uma faixa fora do histórico. Retorna null se Spotify
 * indisponível ou se não houver inédita (→ fallback local cuida do reforço).
 */
export async function proximaFaixaNova(
  userId: string,
): Promise<SpotifyTrack | null> {
  const token = await getAccessTokenValido(userId);
  if (!token) return null; // Spotify não conectado → fallback

  const tocadas = await faixasJaTocadas(userId);

  let path: string | null = "/me/tracks?limit=50";
  let paginas = 0;
  while (path && paginas < 10) {
    const page: SavedTracksResp | null = await spotifyGet<SavedTracksResp>(
      token,
      path,
    );
    if (!page) return null; // falha de rede/token → fallback
    for (const item of page.items) {
      const t = item.track;
      if (!t || !t.id) continue;
      if (tocadas.has(t.id)) continue;
      return {
        id: t.id,
        uri: t.uri,
        nome: t.name,
        artistas: t.artists.map((a) => a.name).join(", "),
        capa: t.album.images?.[0]?.url ?? null,
      };
    }
    // próxima página: a API devolve URL absoluta em `next`.
    path = page.next ? page.next.replace("https://api.spotify.com/v1", "") : null;
    paginas++;
  }
  return null; // biblioteca esgotada sem inéditas
}
