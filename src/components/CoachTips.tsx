// Painel do Fat Loss Coach — tips com severidade. Apresentacional.
import type { Tip } from "@/lib/coach_tips";

const COR: Record<Tip["severidade"], string> = {
  alta: "var(--neon)",
  media: "var(--gold)",
  baixa: "var(--text-dim)",
  positiva: "var(--good)",
};

export default function CoachTips({ tips }: { tips: Tip[] }) {
  return (
    <div className="panel" style={{ marginTop: 18, borderColor: "var(--gold)" }}>
      <div className="lbl">Fat Loss Coach · últimos 30 dias</div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 10 }}>
        {tips.map((t, i) => (
          <div key={i} style={{ borderLeft: `3px solid ${COR[t.severidade]}`, paddingLeft: 10 }}>
            <div style={{ fontWeight: 800, color: COR[t.severidade] }}>{t.titulo}</div>
            <div className="subtle" style={{ marginTop: 2 }}>{t.acao}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
