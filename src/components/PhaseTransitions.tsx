"use client";

// ============================================================
// PhaseTransitions — propostas pendentes do engine (PR9 §44).
// ------------------------------------------------------------
// Lista phase_transition com estado='pendente' e permite aceitar/adiar/
// ignorar. Aceitar chama trocarFase server-side.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Transicao {
  id: number;
  proposto_em: string;
  to_type: string;
  reason: string | null;
  confidence: number | null;
  signals: Record<string, unknown>;
  from_phase_id: number | null;
}

interface Props {
  transicoes: Transicao[];
}

export default function PhaseTransitions({ transicoes }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function decidir(id: number, decisao: "aceito" | "adiado" | "ignorado") {
    setOcupado(id);
    setErro(null);
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "decidir_transicao",
          transicao_id: id,
          decisao,
        }),
      });
      const j = await res.json();
      if (!res.ok) setErro(j?.error ?? "falha");
      else router.refresh();
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section
      style={{
        background: "color-mix(in srgb, var(--belt-gold) 10%, var(--surface))",
        border: "1px solid var(--belt-gold)",
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <h2 style={{ margin: "0 0 10px", fontSize: 14, letterSpacing: 0.5, textTransform: "uppercase", color: "var(--belt-gold)" }}>
        Transições propostas
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {transicoes.map((t) => (
          <div
            key={t.id}
            style={{
              padding: 10,
              borderRadius: 10,
              background: "var(--ground)",
              borderLeft: "3px solid var(--belt-gold)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <strong style={{ fontSize: 14 }}>→ {t.to_type.toUpperCase()}</strong>
              <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                {t.confidence != null ? `${Math.round(t.confidence * 100)}%` : ""}
              </span>
            </div>
            {t.reason && (
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>
                {t.reason}
              </p>
            )}
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              <button
                type="button"
                disabled={ocupado === t.id}
                onClick={() => decidir(t.id, "aceito")}
                className="btn btn-primary"
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Aceitar
              </button>
              <button
                type="button"
                disabled={ocupado === t.id}
                onClick={() => decidir(t.id, "adiado")}
                className="btn"
                style={{ padding: "6px 12px", fontSize: 12 }}
              >
                Adiar
              </button>
              <button
                type="button"
                disabled={ocupado === t.id}
                onClick={() => decidir(t.id, "ignorado")}
                className="btn"
                style={{ padding: "6px 12px", fontSize: 12, color: "var(--ink-dim)" }}
              >
                Ignorar
              </button>
            </div>
            <div style={{ marginTop: 4, fontSize: 10, color: "var(--ink-dim)" }}>
              proposto em {new Date(t.proposto_em).toLocaleString("pt-BR")}
            </div>
          </div>
        ))}
      </div>

      {erro && <div style={{ marginTop: 8, color: "var(--kihap)", fontSize: 12 }}>{erro}</div>}
    </section>
  );
}
