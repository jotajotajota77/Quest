"use client";

// v11.8: log de sessão TKD — o que foi feito na aula do sabum. Aparece na
// aba /taekwondo. Se o mestre do dia é TKD, ganha 20 XP no domínio.
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface TkdLogRow {
  id: string;
  ts: string;
  descricao: string;
  duracao_min: number | null;
  notas: string | null;
}

export default function TkdLog({ historico }: { historico: TkdLogRow[] }) {
  const router = useRouter();
  const [descricao, setDescricao] = useState("");
  const [duracao, setDuracao] = useState("");
  const [notas, setNotas] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function registrar() {
    const d = descricao.trim();
    if (!d) return;
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch("/api/tkd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: d,
          duracao_min: duracao ? Number(duracao) : undefined,
          notas: notas.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        xp_ganho?: number;
      };
      if (json.error) {
        setMsg(`erro: ${json.error}`);
      } else {
        setDescricao("");
        setDuracao("");
        setNotas("");
        setMsg(
          json.xp_ganho
            ? `registrado · +${json.xp_ganho} XP TKD`
            : "registrado",
        );
        router.refresh();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover essa sessão?")) return;
    await fetch(`/api/tkd?id=${id}`, { method: "DELETE" });
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
      <div
        className="panel"
        style={{
          marginBottom: 14,
          display: "grid",
          gap: 10,
          borderLeft: "3px solid var(--kihap)",
        }}
      >
        <div className="lbl">Registrar sessão · o que foi feito no dojang</div>
        <input
          type="text"
          placeholder="Ex.: aquecimento + Dollyo Chagi 3×20 + Poomsae Taegeuk 2 + sparring 3 rounds"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
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
          <span className="subtle" style={{ fontSize: "0.72rem" }}>
            duração (min · opcional)
          </span>
        </div>
        <textarea
          placeholder="Notas do sabum (opcional)"
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          rows={2}
          style={{ ...inputStyle, resize: "vertical" }}
        />
        <button
          className="btn btn-primary"
          disabled={ocupado || !descricao.trim()}
          onClick={registrar}
        >
          {ocupado ? "Registrando…" : "Registrar sessão TKD"}
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
            <div className="lbl">Histórico · sessões TKD</div>
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
                  <span style={{ fontWeight: 700, flex: 1 }}>{h.descricao}</span>
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
                {h.notas && (
                  <div className="subtle" style={{ fontSize: "0.75rem", fontStyle: "italic" }}>
                    &quot;{h.notas}&quot;
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
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
