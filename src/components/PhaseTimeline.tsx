"use client";

// ============================================================
// PhaseTimeline — histórico vertical de fases (PR9 §51, §70-71).
// ------------------------------------------------------------
// Cliente. Mostra todas as fases (ativa + concluídas + abandonadas)
// em ordem cronológica reversa. Botão "Trocar fase" no topo abre um
// seletor que aciona POST /api/phase action=trocar_fase.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PhysiquePhase, PhysiquePhaseType } from "@/lib/physique/tipos";

const TIPOS: PhysiquePhaseType[] = [
  "cut",
  "maintenance",
  "build",
  "specialization",
  "mini_cut",
  "recovery",
  "travel",
  "custom",
];

const COR_TIPO: Record<string, string> = {
  cut:            "var(--kihap)",
  maintenance:    "var(--calm)",
  build:          "var(--chama)",
  specialization: "var(--belt-gold)",
  mini_cut:       "var(--kihap)",
  recovery:       "var(--calm)",
  travel:         "var(--belt-gold)",
  custom:         "var(--ink-dim)",
};

const COR_STATUS: Record<string, string> = {
  ativa:      "var(--chama)",
  concluida:  "var(--ink-dim)",
  abandonada: "var(--kihap)",
};

interface Props {
  historico: PhysiquePhase[];
}

export default function PhaseTimeline({ historico }: Props) {
  const router = useRouter();
  const [seletor, setSeletor] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocar(tipo: PhysiquePhaseType) {
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch("/api/phase", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "trocar_fase", tipo }),
      });
      const j = await res.json();
      if (!res.ok) setErro(j?.error ?? "falha");
      else {
        setSeletor(false);
        router.refresh();
      }
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section style={cardStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <h2 style={h2Style}>Timeline de fases</h2>
        <button
          type="button"
          className="btn"
          style={{ padding: "6px 12px", fontSize: 12 }}
          onClick={() => setSeletor((v) => !v)}
        >
          {seletor ? "cancelar" : "Trocar fase"}
        </button>
      </div>

      {seletor && (
        <div style={{ marginBottom: 12, padding: 10, background: "var(--ground)", borderRadius: 10 }}>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 6 }}>
            escolha o próximo tipo. a fase atual será encerrada.
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                disabled={ocupado}
                onClick={() => trocar(t)}
                className="btn"
                style={{
                  padding: "6px 12px",
                  fontSize: 12,
                  borderColor: COR_TIPO[t],
                  color: COR_TIPO[t],
                }}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
          {erro && <div style={{ marginTop: 8, color: "var(--kihap)", fontSize: 12 }}>{erro}</div>}
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {historico.map((f, i) => {
          const cor = COR_TIPO[f.type] ?? "var(--ink-dim)";
          const dias = diasEntre(f.started_at, f.ended_at);
          return (
            <div key={f.id} style={{ display: "flex", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 24 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: cor,
                    boxShadow: f.status === "ativa" ? `0 0 8px ${cor}` : "none",
                  }}
                />
                {i < historico.length - 1 && (
                  <div style={{ flex: 1, width: 2, background: "var(--hairline)", marginTop: 2, minHeight: 20 }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ color: cor, fontSize: 14 }}>
                    {f.type.toUpperCase()}
                  </strong>
                  <span style={{ fontSize: 11, color: COR_STATUS[f.status] }}>
                    {f.status}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
                  {fmtData(f.started_at)}
                  {f.ended_at ? ` → ${fmtData(f.ended_at)}` : " → hoje"}
                  {dias != null && ` · ${dias}d`}
                  {f.calorie_target && ` · ${f.calorie_target} kcal`}
                </div>
                {f.goal_description && (
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--ink-dim)" }}>
                    {f.goal_description}
                  </p>
                )}
                {f.decision_notes && (
                  <p style={{ margin: "4px 0 0", fontSize: 10, color: "var(--ink-dim)", fontStyle: "italic" }}>
                    {f.decision_notes}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function diasEntre(a: string, b: string | null): number | null {
  const start = new Date(a).getTime();
  const end = b ? new Date(b).getTime() : Date.now();
  return Math.max(0, Math.round((end - start) / 86400000));
}

function fmtData(d: string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--hairline)",
  borderRadius: 16,
  padding: 14,
  marginBottom: 14,
};

const h2Style: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "var(--ink-dim)",
};
