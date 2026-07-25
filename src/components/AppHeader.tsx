// ============================================================
// AppHeader — o mark do app (QUEST · 도장) + tagline + belt-bar.
// ------------------------------------------------------------
// v10 direção D+A: identidade visual no topo de toda tela do loop diário.
// Belt-bar (branca → preta pelos kup) é a linguagem visual de rank que aparece
// em todos os cabeçalhos — reforça o vocabulário TKD antes do conteúdo.
// ============================================================

export default function AppHeader({
  tagline = "cutting × 태권도 × k-pop trainee",
}: {
  tagline?: string;
}) {
  return (
    <header style={{ display: "grid", gap: 8, marginBottom: 22 }}>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(40px, 8vw, 72px)",
          fontWeight: 400, // Bebas Neue vem em 1 peso; deixa o próprio glyph brilhar
          lineHeight: 0.9,
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          display: "flex",
          alignItems: "baseline",
          gap: "0.28em",
        }}
      >
        <span style={{ color: "var(--ink)" }}>Quest</span>
        <span
          style={{
            color: "var(--kihap)",
            fontSize: "0.42em",
            transform: "translateY(-0.35em)",
          }}
          aria-hidden
        >
          ·
        </span>
        <span
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "0.44em",
            fontWeight: 700,
            color: "var(--ink-dim)",
            letterSpacing: 0,
          }}
        >
          도장
        </span>
      </div>

      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--ink-dim)",
        }}
      >
        {tagline}
      </div>

      <div className="belt-bar" aria-hidden style={{ marginTop: 4 }} />
    </header>
  );
}
