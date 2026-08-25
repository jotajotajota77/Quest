// ============================================================
// MomentumCard — primeiro card do dashboard (PR7, §31-33).
// ------------------------------------------------------------
// Server component. Barra horizontal + trend arrow.
// Sem penalidade. Sem "-XP por falhar". §27, §60 respeitados.
// ============================================================

import Link from "next/link";
import type { MomentumRow } from "@/lib/physique/data";

interface Props {
  momentum: MomentumRow | null;
}

const LABEL: Record<string, { txt: string; cor: string }> = {
  alto:  { txt: "MOMENTUM ALTO",  cor: "var(--chama)" },
  medio: { txt: "MOMENTUM OK",    cor: "var(--calm)" },
  baixo: { txt: "MOMENTUM BAIXO", cor: "var(--kihap)" },
};

function faixa(score: number): "alto" | "medio" | "baixo" {
  if (score >= 70) return "alto";
  if (score >= 45) return "medio";
  return "baixo";
}

const SETA: Record<string, string> = { up: "↗", flat: "→", down: "↘" };

export default function MomentumCard({ momentum }: Props) {
  if (!momentum) {
    return (
      <div className="panel" style={{ marginBottom: 10, padding: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, color: "var(--ink-dim)", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Momentum · 14d
            </div>
            <div style={{ fontSize: 14, marginTop: 4 }}>
              Ainda sem histórico. <Link href="/checkin" style={{ color: "var(--calm)" }}>Faça o check-in</Link>.
            </div>
          </div>
        </div>
      </div>
    );
  }
  const f = faixa(Number(momentum.score));
  const label = LABEL[f];
  const trend = (momentum.componentes as unknown as { trend?: string }).trend ?? "flat";
  const scorePct = Math.max(0, Math.min(100, Number(momentum.score)));

  return (
    <Link
      href="/recovery"
      style={{
        display: "block",
        marginBottom: 10,
        padding: 12,
        borderRadius: 12,
        background: "var(--surface)",
        border: "1px solid var(--hairline)",
        textDecoration: "none",
        color: "var(--ink)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Momentum · 14d
          </div>
          <div style={{ fontSize: 13, marginTop: 2 }}>
            <strong style={{ color: label.cor }}>{label.txt}</strong>{" "}
            <span style={{ color: "var(--ink-dim)", fontSize: 12 }}>
              cobertura {momentum.componentes.cobertura_pct}%
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: label.cor }}>{scorePct.toFixed(0)}</span>
          <span style={{ fontSize: 18, color: "var(--ink-dim)" }}>{SETA[trend] ?? ""}</span>
        </div>
      </div>
      <div style={{ height: 6, background: "var(--ground)", borderRadius: 3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${scorePct}%`,
            background: label.cor,
          }}
        />
      </div>
    </Link>
  );
}
