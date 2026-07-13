"use client";

// ============================================================
// Player Spotify minimalista (v9) — só o essencial: o que está tocando +
// os próximos da fila. Sem controles extras (play/pause/skip/volume) —
// o toque na aba já dispara a faixa; isto aqui é só visibilidade.
// Silencioso se não conectado (o link "Conectar Spotify" já cobre esse caso
// em BehaviorTab).
// ============================================================
import { useEffect, useState } from "react";
import type { SpotifyTrack } from "@/lib/types";

interface QueueState {
  conectado: boolean;
  tocando: SpotifyTrack | null;
  fila: SpotifyTrack[];
}

export default function SpotifyPlayer() {
  const [estado, setEstado] = useState<QueueState | null>(null);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      try {
        const res = await fetch("/api/spotify/queue");
        if (res.ok && vivo) setEstado(await res.json());
      } catch {
        /* silencioso — player é bônus, nunca quebra a tela */
      }
    }
    carregar();
    const t = setInterval(carregar, 15_000);
    return () => {
      vivo = false;
      clearInterval(t);
    };
  }, []);

  if (!estado?.conectado || (!estado.tocando && estado.fila.length === 0)) return null;

  return (
    <div className="panel" style={{ marginTop: 12, padding: "10px 14px" }}>
      {estado.tocando && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {estado.tocando.capa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={estado.tocando.capa}
              alt=""
              style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }}
            />
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {estado.tocando.nome}
            </div>
            <div className="subtle" style={{ fontSize: "0.75rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {estado.tocando.artistas}
            </div>
          </div>
        </div>
      )}
      {estado.fila.length > 0 && (
        <div style={{ marginTop: estado.tocando ? 8 : 0 }}>
          <div className="lbl" style={{ fontSize: "0.68rem" }}>a seguir</div>
          {estado.fila.map((f) => (
            <div key={f.id} className="subtle" style={{ fontSize: "0.75rem", marginTop: 2 }}>
              {f.nome} — {f.artistas}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
