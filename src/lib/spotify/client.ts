// ============================================================
// Spotify — OAuth + refresh automático + Web API (server-side).
// ------------------------------------------------------------
// O Web Playback SDK (tocar faixa cheia) roda no CLIENTE e exige Premium.
// Aqui ficam apenas as operações server-side: troca/refresh de token e
// consultas à Web API (biblioteca/playlists) para o "nova-no-sistema".
// ============================================================

import { createClient } from "@/lib/supabase/server";

const TOKEN_URL = "https://accounts.spotify.com/api/token";
const API = "https://api.spotify.com/v1";

/** Escopos necessários: tocar via SDK + montar a playlist real da trilha.
 *  v9: troca user-library-read/playlist-read-private (não usados) por
 *  playlist-modify-private (playlist "Quest — Trilha do Hábito"). Quem já
 *  tinha conectado o Spotify antes precisa reconectar pra pegar o escopo novo
 *  — o token antigo não autoriza criar/editar playlist. */
export const SPOTIFY_SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-modify-private",
].join(" ");

function basicAuthHeader(): string {
  const id = process.env.SPOTIFY_CLIENT_ID!;
  const secret = process.env.SPOTIFY_CLIENT_SECRET!;
  return "Basic " + Buffer.from(`${id}:${secret}`).toString("base64");
}

interface TokenResposta {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}

/** Troca o `code` do OAuth por tokens e persiste em `spotify_tokens`. */
export async function trocarCodePorToken(
  userId: string,
  code: string,
): Promise<void> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) throw new Error(`Spotify token exchange falhou: ${res.status}`);
  const data = (await res.json()) as TokenResposta;
  await persistirTokens(userId, data);
}

async function persistirTokens(
  userId: string,
  data: TokenResposta,
): Promise<void> {
  const supabase = createClient();
  const expiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();
  await supabase.from("spotify_tokens").upsert({
    user_id: userId,
    access_token: data.access_token,
    // refresh_token só vem na 1ª troca; preserva o existente se ausente.
    ...(data.refresh_token ? { refresh_token: data.refresh_token } : {}),
    expires_at: expiresAt,
    scope: data.scope ?? null,
    atualizado_em: new Date().toISOString(),
  });
}

/**
 * Devolve um access_token válido, fazendo refresh automático se expirado.
 * Retorna null se o usuário ainda não conectou o Spotify.
 */
export async function getAccessTokenValido(
  userId: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("spotify_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!row || !row.refresh_token) return null;

  const expiraEm = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  const aindaValido = expiraEm - Date.now() > 60_000; // 1 min de folga
  if (aindaValido && row.access_token) return row.access_token;

  // Refresh.
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
  });
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) return null;
  const data = (await res.json()) as TokenResposta;
  await persistirTokens(userId, data);
  return data.access_token;
}

/** GET autenticado contra a Web API do Spotify. */
export async function spotifyGet<T>(
  token: string,
  path: string,
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

/** POST autenticado contra a Web API do Spotify. */
async function spotifyPost<T>(
  token: string,
  path: string,
  body: unknown,
): Promise<T | null> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return null;
  return (await res.json()) as T;
}

const NOME_PLAYLIST = "Quest — Trilha do Hábito";

/** Garante que existe a playlist real da trilha e devolve o id (cacheado em
 *  spotify_tokens.playlist_id). Cria como privada na primeira faixa tocada. */
export async function garantirPlaylist(
  userId: string,
  token: string,
): Promise<string | null> {
  const supabase = createClient();
  const { data: row } = await supabase
    .from("spotify_tokens")
    .select("playlist_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (row?.playlist_id) return row.playlist_id as string;

  const me = await spotifyGet<{ id: string }>(token, "/me");
  if (!me?.id) return null;
  const criada = await spotifyPost<{ id: string }>(token, `/users/${me.id}/playlists`, {
    name: NOME_PLAYLIST,
    public: false,
    description: "Trilha do hábito — faixas novas-no-sistema tocadas pelo Quest.",
  });
  if (!criada?.id) return null;

  await supabase
    .from("spotify_tokens")
    .update({ playlist_id: criada.id })
    .eq("user_id", userId);
  return criada.id;
}

/** Adiciona uma faixa (URI) à playlist real da trilha. Falha silenciosa —
 *  a playlist é um bônus, nunca bloqueia o reforço/hit-confirm. */
export async function adicionarFaixaNaPlaylist(
  userId: string,
  token: string,
  uri: string,
): Promise<void> {
  const playlistId = await garantirPlaylist(userId, token);
  if (!playlistId) return;
  await spotifyPost(token, `/playlists/${playlistId}/tracks`, { uris: [uri] }).catch(() => null);
}
