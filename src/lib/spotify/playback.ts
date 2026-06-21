"use client";

// ============================================================
// Web Playback SDK (cliente) — toca a FAIXA CHEIA. Requer Premium.
// ------------------------------------------------------------
// Singleton preguiçoso. `tocarUri` resolve true se a faixa começou, false em
// qualquer falha (SDK não carrega, sem device, token, rede). O chamador usa
// esse boolean para decidir faixa_cheia vs fallback_local — o reforço local
// já aconteceu antes, então false NÃO zera o reforço.
// ============================================================

let deviceId: string | null = null;
let player: Spotify.Player | null = null;
let pronto: Promise<boolean> | null = null;

/** Busca um access token válido do backend. */
async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/spotify/token", { cache: "no-store" });
    if (!res.ok) return null;
    const { access_token } = (await res.json()) as { access_token?: string };
    return access_token ?? null;
  } catch {
    return null;
  }
}

function carregarSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") return reject();
    if (window.Spotify) return resolve();
    const existente = document.getElementById("spotify-sdk");
    window.onSpotifyWebPlaybackSDKReady = () => resolve();
    if (existente) return; // já injetado, aguardando callback
    const script = document.createElement("script");
    script.id = "spotify-sdk";
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.onerror = () => reject();
    document.body.appendChild(script);
  });
}

/** Inicializa o player uma vez. Resolve false se algo falhar (→ fallback). */
function init(): Promise<boolean> {
  if (pronto) return pronto;
  pronto = (async () => {
    try {
      await carregarSdk();
      const token = await fetchToken();
      if (!token) return false;

      player = new window.Spotify.Player({
        name: "Quest",
        getOAuthToken: (cb) => {
          fetchToken().then((t) => t && cb(t));
        },
        volume: 0.8,
      });

      const ready = new Promise<boolean>((resolve) => {
        player!.addListener("ready", ({ device_id }) => {
          deviceId = device_id;
          resolve(true);
        });
        player!.addListener("initialization_error", () => resolve(false));
        player!.addListener("authentication_error", () => resolve(false));
        player!.addListener("account_error", () => resolve(false));
        setTimeout(() => resolve(false), 6000); // não trava o loop
      });

      const conectou = await player.connect();
      if (!conectou) return false;
      return await ready;
    } catch {
      return false;
    }
  })();
  return pronto;
}

/**
 * Toca a faixa cheia. @returns true se começou, false em qualquer falha.
 * O chamador trata false como fallback (a música vira bônus pendente).
 */
export async function tocarUri(uri: string): Promise<boolean> {
  try {
    const ok = await init();
    if (!ok || !deviceId) return false;
    const token = await fetchToken();
    if (!token) return false;
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uris: [uri] }),
      },
    );
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}
