"use client";

// ============================================================
// PlanoJumpNav — sticky chip row pra pular entre seções da /plano.
// Client component (usa scroll behavior + hash navigation).
// ============================================================

const CHIPS: { href: string; label: string; hard?: boolean }[] = [
  { href: "#estrategia", label: "§1 Estratégia" },
  { href: "#calendario", label: "§2 Calendário" },
  { href: "#treino-a", label: "A · Push", hard: true },
  { href: "#treino-b", label: "B · Pull", hard: true },
  { href: "#treino-c", label: "C · Legs", hard: true },
  { href: "#treino-d", label: "D · Peito+ABS", hard: true },
  { href: "#treino-e", label: "E · Arms+ABS", hard: true },
  { href: "#treino-f", label: "F · Chest+" },
  { href: "#treino-g", label: "G · Regen" },
  { href: "#volume", label: "§8 Volume" },
  { href: "#progressao", label: "§9 Progressão" },
  { href: "#cardio", label: "§10 Cardio" },
  { href: "#mob", label: "§11 Mobilidade" },
  { href: "#semanas", label: "§12 4 sem" },
  { href: "#ajustes", label: "§13 Ajustes" },
  { href: "#chk", label: "§14 Checklist" },
  { href: "#resultado", label: "§15 Resultado" },
  { href: "#refeicoes", label: "Comida" },
];

export default function PlanoJumpNav() {
  return (
    <nav
      style={{
        position: "sticky",
        top: 0,
        zIndex: 5,
        background: "color-mix(in srgb, var(--ground) 92%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        padding: "8px 0",
        margin: "0 -14px 16px",
        paddingInline: 14,
        borderBottom: "1px solid var(--hairline)",
        overflowX: "auto",
        whiteSpace: "nowrap",
      }}
      aria-label="Jump nav"
    >
      {CHIPS.map((c) => (
        <a
          key={c.href}
          href={c.href}
          style={{
            display: "inline-block",
            padding: "4px 9px",
            marginRight: 4,
            color: "var(--ink)",
            textDecoration: "none",
            fontFamily: "var(--font-mono)",
            fontSize: "0.66rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontWeight: 700,
            border: `1px solid ${c.hard ? "var(--gold)" : "var(--hairline)"}`,
            borderRadius: 999,
            background: "var(--surface)",
          }}
        >
          {c.label}
        </a>
      ))}
    </nav>
  );
}
