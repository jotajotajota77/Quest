// ============================================================
// Toca uma faixa no DEVICE ATIVO do Spotify (Connect API) — caminho do CELULAR.
// O Web Playback SDK é desktop-only; no mobile controlamos o app do Spotify do
// próprio usuário. Requer um device ativo (app Spotify aberto/recente).
// Fora do loop crítico: se não houver device/token, devolve ok:false e o
// chamador segue com o hit-confirm local (reforço nunca zera).
// ============================================================
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAccessTokenValido } from "@/lib/spotify/client";

interface Device {
  id: string | null;
  is_active: boolean;
  name: string;
}

export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, motivo: "auth" }, { status: 401 });

  const { uri } = (await request.json().catch(() => ({}))) as { uri?: string };
  if (!uri) return NextResponse.json({ ok: false, motivo: "uri" }, { status: 400 });

  const token = await getAccessTokenValido(user.id);
  if (!token) return NextResponse.json({ ok: false, motivo: "desconectado" });

  // Descobre os devices do usuário; prefere o ativo, senão o primeiro com id.
  const devRes = await fetch("https://api.spotify.com/v1/me/player/devices", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!devRes.ok) return NextResponse.json({ ok: false, motivo: "devices" });
  const { devices } = (await devRes.json()) as { devices: Device[] };
  const alvo =
    devices.find((d) => d.is_active && d.id) ?? devices.find((d) => d.id);
  if (!alvo?.id) {
    // Nenhum device: o usuário precisa abrir o app do Spotify uma vez.
    return NextResponse.json({ ok: false, motivo: "sem_device" });
  }

  const playRes = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${alvo.id}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [uri] }),
    },
  );
  return NextResponse.json({ ok: playRes.status === 204 || playRes.ok });
}
