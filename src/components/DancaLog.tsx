"use client";

// ============================================================
// Registro de sessão de dança — form + histórico. Aparece na aba /danca.
// Loga: nome da música (obrigatório), link do Spotify (opcional), duração
// aproximada (opcional), nota livre (opcional). Se o mestre do dia é de
// dança, ganha XP no domínio.
// ============================================================
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePhotocardDrop } from "@/components/PhotocardDropToast";

export interface DancaLogRow {
  id: string;
  ts: string;
  musica: string;
  spotify_url: string | null;
  duracao_min: number | null;
  nota: string | null;
}

export default function DancaLog({ historico }: { historico: DancaLogRow[] }) {
  const router = useRouter();
  const { showDrop, dropOverlay } = usePhotocardDrop();
  const [musica, setMusica] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function registrar() {
    const m = musica.trim();
    if (!m) return;
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch("/api/danca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          musica: m,
          spotify_url: spotifyUrl.trim() || undefined,
          duracao_min: duracao ? Number(duracao) : undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        xp_ganho?: number;
        mastery?: { xp: number; nivel: number } | null;
        boss?: {
          derrotou?: boolean;
          xp?: number;
          shards?: number;
          photocardId?: string | null;
        };
      };
      if (json.error) {
        setMsg(`erro: ${json.error}`);
      } else {
        setMusica("");
        setSpotifyUrl("");
        setDuracao("");
        const partes: string[] = [];
        if (json.xp_ganho) partes.push(`+${json.xp_ganho} XP domínio`);
        if (json.mastery) partes.push(`mastery dança nv.${json.mastery.nivel}`);
        setMsg(partes.length > 0 ? `registrado · ${partes.join(" · ")}` : "registrado");
        // v12 PR3: se essa sessão derrubou o boss semanal, mostra o drop.
        if (json.boss?.derrotou && json.boss.photocardId) {
          showDrop({
            photocardId: json.boss.photocardId,
            header: "BOSS DERROTADO",
            bonus: `+${json.boss.xp ?? 0} XP · +${json.boss.shards ?? 0} shards`,
          });
        }
        router.refresh();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover esse registro?")) return;
    await fetch(`/api/danca?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const inputStyle: React.CSSProperties = {
    padding: 10,
    borderRadius: 8,
    border: "1px solid var(--panel-border)",
    background: "rgba(0,0,0,0.25)",
    color: "var(--text)",
    width: "100%",
  };

  return (
    <>
      {dropOverlay}
      <div
        className="panel"
        style={{ marginBottom: 14, display: "grid", gap: 10, borderLeft: "3px solid var(--gold)" }}
      >
        <div className="lbl">Registrar sessão · dançou o quê hoje?</div>
        <input
          type="text"
          placeholder="Nome da música (ex.: Plot Twist)"
          value={musica}
          onChange={(e) => setMusica(e.target.value)}
          style={inputStyle}
        />
        <input
          type="url"
          placeholder="Link do Spotify (opcional)"
          value={spotifyUrl}
          onChange={(e) => setSpotifyUrl(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="number"
            placeholder="min"
            value={duracao}
            onChange={(e) => setDuracao(e.target.value)}
            min={1}
            max={240}
            style={{ ...inputStyle, width: 90 }}
          />
          <span className="subtle" style={{ fontSize: "0.75rem" }}>
            duração aprox. (min · opcional)
          </span>
        </div>
        <button
          className="btn btn-primary"
          disabled={ocupado || !musica.trim()}
          onClick={registrar}
        >
          {ocupado ? "Registrando…" : "Registrar sessão"}
        </button>
        {msg && (
          <p
            className="subtle"
            style={{
              margin: 0,
              fontSize: "0.72rem",
              color: msg.startsWith("erro") ? "var(--neon)" : "var(--good)",
            }}
          >
            {msg}
          </p>
        )}
      </div>

      {historico.length > 0 && (
        <div className="panel" style={{ marginBottom: 14 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <div className="lbl">Histórico · o que você dançou</div>
            <span
              className="subtle"
              style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
            >
              {historico.length} sessões
            </span>
          </div>
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {historico.slice(0, 30).map((h) => (
              <div
                key={h.id}
                style={{
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid var(--hairline)",
                  display: "grid",
                  gap: 4,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "baseline",
                    gap: 8,
                  }}
                >
                  <span style={{ fontWeight: 700 }}>{h.musica}</span>
                  <span
                    className="subtle"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}
                  >
                    {new Date(h.ts).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {h.spotify_url && (
                    <a
                      href={h.spotify_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "var(--good)",
                        fontSize: "0.75rem",
                        textDecoration: "none",
                      }}
                    >
                      ♫ Spotify
                    </a>
                  )}
                  {h.duracao_min && (
                    <span
                      className="subtle"
                      style={{ fontSize: "0.72rem" }}
                    >
                      {h.duracao_min} min
                    </span>
                  )}
                  <button
                    onClick={() => remover(h.id)}
                    className="nav-link"
                    style={{
                      marginLeft: "auto",
                      padding: "2px 6px",
                      fontSize: "0.7rem",
                      color: "var(--neon)",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
