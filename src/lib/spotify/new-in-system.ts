// ============================================================
// Faixa NOVA-NO-SISTEMA (modo NORTEAR) — música emergente, NÃO da biblioteca do
// usuário. Parte de uma semente curada (gêneros + artistas de referência) e
// EXPANDE via Spotify Search, recortando o "emergente" pelo campo `popularity`
// (20–65: corta megahit e faixa morta). Sorteio sem reposição (filtra o que já
// tocou via historico_reforco).
// ------------------------------------------------------------
// RESTRIÇÃO de API (apps pós-27/11/2024): sem Recommendations/Related/Audio
// Features/Featured Playlists. Só Search (genre/year/popularity) + Artist Top
// Tracks. Se o Spotify não responder, retorna null → fallback (hit-confirm).
// ============================================================

import type { SpotifyTrack } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido, spotifyGet } from "@/lib/spotify/client";
import {
  ARTISTAS_SEMENTE,
  GENEROS_SEMENTE,
  POP_MAX,
  POP_MIN,
} from "@/lib/spotify/semente";

interface TrackObj {
  id: string;
  uri: string;
  name: string;
  popularity?: number;
  artists: Array<{ name: string }>;
  album: { images: Array<{ url: string }> };
}
interface SearchResp {
  tracks?: { items: Array<TrackObj | null> };
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

function aleatorio<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
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

/**
 * Seleciona uma faixa emergente inédita norteada pela semente. Em cada tentativa
 * sorteia entre buscar por GÊNERO (+ year recente) ou por ARTISTA de referência;
 * recorta por popularidade e exclui o que já tocou. Relaxa o recorte se preciso
 * pra não voltar vazio à toa. null só se o Spotify não responder de jeito nenhum.
 */
export async function proximaFaixaNova(
  userId: string,
): Promise<SpotifyTrack | null> {
  const token = await getAccessTokenValido(userId);
  if (!token) return null;

  const tocadas = await faixasJaTocadas(userId);
  let reserva: SpotifyTrack | null = null; // inédita fora da banda de pop (fallback)

  for (let tentativa = 0; tentativa < 10; tentativa++) {
    const porArtista = Math.random() < 0.5;
    const q = porArtista
      ? `artist:"${aleatorio(ARTISTAS_SEMENTE)}"`
      : `${aleatorio(GENEROS_SEMENTE)} year:2019-2026`;
    const offset = Math.floor(Math.random() * 25); // baixo → página sempre cheia
    const page = await spotifyGet<SearchResp>(
      token,
      `/search?q=${encodeURIComponent(q)}&type=track&limit=50&offset=${offset}&market=BR`,
    );
    const itens = (page?.tracks?.items ?? []).filter(
      (t): t is TrackObj => !!t && !!t.id && !tocadas.has(t.id),
    );
    if (itens.length === 0) continue;

    // Preferência: dentro da banda de popularidade (emergente).
    const naBanda = itens.filter((t) => {
      const p = t.popularity ?? 50;
      return p >= POP_MIN && p <= POP_MAX;
    });
    if (naBanda.length > 0) return mapear(aleatorio(naBanda));
    if (!reserva) reserva = mapear(aleatorio(itens)); // guarda p/ não voltar vazio
  }

  return reserva; // inédita (mesmo fora da banda) ou null → fallback local
}
