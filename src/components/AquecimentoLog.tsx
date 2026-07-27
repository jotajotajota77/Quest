"use client";

// v11.7: log de aquecimento + alongamento — o que foi feito no antes/depois
// do treino. Aparece na aba /treino.
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface AquecimentoRow {
  id: string;
  ts: string;
  tipo: "aquecimento" | "alongamento";
  descricao: string;
  duracao_min: number | null;
}

export default function AquecimentoLog({ historico }: { historico: AquecimentoRow[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<"aquecimento" | "alongamento">("aquecimento");
  const [descricao, setDescricao] = useState("");
  const [duracao, setDuracao] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function registrar() {
    const d = descricao.trim();
    if (!d) return;
    setOcupado(true);
    setMsg(null);
    try {
      const res = await fetch("/api/aquecimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          descricao: d,
          duracao_min: duracao ? Number(duracao) : undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (json.error) {
        setMsg(`erro: ${json.error}`);
      } else {
        setDescricao("");
        setDuracao("");
        setMsg("registrado");
        router.refresh();
      }
    } finally {
      setOcupado(false);
    }
  }

  async function remover(id: string) {
    if (!confirm("Remover?")) return;
    await fetch(`/api/aquecimento?id=${id}`, { method: "DELETE" });
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
    <div
      className="panel"
      style={{
        marginTop: 16,
        display: "grid",
        gap: 10,
        borderLeft: "3px solid var(--neon-2)",
      }}
    >
      <div className="lbl">Aquecimento & alongamento</div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {(["aquecimento", "alongamento"] as const).map((t) => (
          <button
            key={t}
            className="nav-link"
            onClick={() => setTipo(t)}
            style={{
              padding: "4px 10px",
              fontSize: "0.72rem",
              borderColor: tipo === t ? "var(--neon-2)" : "var(--panel-border)",
              color: tipo === t ? "var(--neon-2)" : "var(--text)",
              fontWeight: tipo === t ? 700 : 500,
              textTransform: "capitalize",
            }}
          >
            {t === "aquecimento" ? "🔥 Aquecimento" : "🧘 Alongamento"}
          </button>
        ))}
      </div>

      <input
        type="text"
        placeholder={
          tipo === "aquecimento"
            ? "Ex.: 5 min esteira + rotação de ombro + banda elástica"
            : "Ex.: quadril passivo + cadeia posterior + peitoral no rack"
        }
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
          max={120}
          style={{ ...inputStyle, width: 90 }}
        />
        <span className="subtle" style={{ fontSize: "0.72rem" }}>
          duração (min · opcional)
        </span>
      </div>
      <button
        className="btn btn-primary"
        disabled={ocupado || !descricao.trim()}
        onClick={registrar}
      >
        {ocupado ? "Registrando…" : `Registrar ${tipo}`}
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

      {historico.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div
            className="subtle"
            style={{
              fontSize: "0.7rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: 6,
            }}
          >
            últimos {historico.length}
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {historico.slice(0, 10).map((h) => (
              <div
                key={h.id}
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  border: "1px solid var(--hairline)",
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  fontSize: "0.78rem",
                }}
              >
                <span style={{ fontSize: "0.9rem" }}>
                  {h.tipo === "aquecimento" ? "🔥" : "🧘"}
                </span>
                <span style={{ flex: 1 }}>{h.descricao}</span>
                {h.duracao_min && (
                  <span
                    className="subtle"
                    style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}
                  >
                    {h.duracao_min}min
                  </span>
                )}
                <span
                  className="subtle"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem" }}
                >
                  {new Date(h.ts).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
                <button
                  onClick={() => remover(h.id)}
                  className="nav-link"
                  style={{ padding: "1px 5px", fontSize: "0.68rem", color: "var(--neon)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
