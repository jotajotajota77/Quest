// v12: badge da season/era atual do jogador. Aparece no topo do /home.
// Server component — recebe a season já resolvida via prop.
import type { Season } from "@/lib/seasons";

export default function SeasonBadge({ season }: { season: Season }) {
  return (
    <div
      className="panel"
      style={{
        padding: "6px 12px",
        marginBottom: 12,
        display: "flex",
        alignItems: "center",
        gap: 10,
        borderLeft: `3px solid ${season.cor_primaria}`,
      }}
    >
      <span
        className="subtle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
        }}
      >
        Season
      </span>
      <span
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1rem",
          fontWeight: 800,
          background: `linear-gradient(90deg, ${season.cor_primaria}, ${season.cor_secundaria})`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        {season.nome.toUpperCase()}
      </span>
      <span
        className="subtle"
        style={{
          marginLeft: "auto",
          fontSize: "0.68rem",
          fontStyle: "italic",
          maxWidth: 220,
          textAlign: "right",
          lineHeight: 1.2,
        }}
      >
        {season.conceito_geral.split(",")[0]}
      </span>
    </div>
  );
}
