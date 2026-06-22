// ============================================================
// Faixa ALEATÓRIA (descoberta) — música nova a cada reforço, NÃO da biblioteca
// curtida do usuário. Mantém a novidade ("nova-no-sistema"): filtra o que já
// tocou via `historico_reforco` pra não repetir.
// ------------------------------------------------------------
//  * Fonte: Search da Web API (gênero/mood aleatório + offset aleatório).
//    (A API de Recommendations foi descontinuada para apps novos.)
//  * Se o Spotify não responder, retorna null — o loop central segue com o
//    hit-confirm local (fallback). A música é bônus, não piso.
// ============================================================

import type { SpotifyTrack } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido, spotifyGet } from "@/lib/spotify/client";

interface SearchResp {
  tracks?: {
    items: Array<{
      id: string;
      uri: string;
      name: string;
      artists: Array<{ name: string }>;
      album: { images: Array<{ url: string }> };
    } | null>;
  };
}

// Sementes de busca — gêneros/moods variados para sortear o catálogo.
const SEEDS = [
  "pop", "rock", "hip hop", "rap", "trap", "indie", "eletronica", "dance",
  "house", "edm", "funk", "sertanejo", "mpb", "samba", "pagode", "forro",
  "gospel", "reggae", "jazz", "soul", "r&b", "blues", "metal", "punk",
  "lofi", "k-pop", "latin", "love songs", "summer hits", "party", "workout",
  "classic rock", "pop rock", "rock nacional", "trap brasileiro", "piseiro",
];

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
 * Seleciona uma faixa aleatória inédita. Tenta algumas combinações de
 * gênero+offset até achar uma fora do histórico. Retorna null se o Spotify
 * estiver indisponível (→ fallback local cuida do reforço).
 */
export async function proximaFaixaNova(
  userId: string,
): Promise<SpotifyTrack | null> {
  const token = await getAccessTokenValido(userId);
  if (!token) return null; // Spotify não conectado → fallback

  const tocadas = await faixasJaTocadas(userId);

  for (let tentativa = 0; tentativa < 6; tentativa++) {
    const seed = SEEDS[Math.floor(Math.random() * SEEDS.length)];
    const offset = Math.floor(Math.random() * 900); // search cap: offset+limit ≤ 1000
    const q = encodeURIComponent(seed);
    const page = await spotifyGet<SearchResp>(
      token,
      `/search?q=${q}&type=track&limit=20&offset=${offset}&market=BR`,
    );
    const itens = (page?.tracks?.items ?? []).filter(
      (t): t is NonNullable<typeof t> => !!t && !!t.id && !tocadas.has(t.id),
    );
    if (itens.length === 0) continue;
    const t = itens[Math.floor(Math.random() * itens.length)];
    return {
      id: t.id,
      uri: t.uri,
      nome: t.name,
      artistas: t.artists.map((a) => a.name).join(", "),
      capa: t.album.images?.[0]?.url ?? null,
    };
  }
  return null; // Spotify não retornou faixa inédita nesta rodada → fallback
}
