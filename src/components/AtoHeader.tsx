// ============================================================
// AtoHeader — o "capítulo" narrativo atual do cutting. Mostra ato + arco
// + boss final do ato + barra de progresso. v11.3 RPG.
// ============================================================
import type { Ato } from "@/lib/ato";
import { progressoAto, diasNoAto } from "@/lib/ato";

export default function AtoHeader({
  ato,
  hojeISO,
  compacto = false,
}: {
  ato: Ato;
  hojeISO: string;
  compacto?: boolean;
}) {
  const pct = progressoAto(ato, hojeISO);
  const restam = diasNoAto(ato, hojeISO);

  if (compacto) {
    return (
      <div
        className="subtle"
        style={{
          padding: "6px 10px",
          borderRadius: 8,
          border: `1px solid ${ato.cor_tema}`,
          color: ato.cor_tema,
          fontSize: "0.7rem",
          fontFamily: "var(--font-mono)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {ato.emoji} Ato {ato.numero} · {ato.nome}
      </div>
    );
  }

  return (
    <div
      className="panel"
      style={{
        marginBottom: 16,
        padding: 14,
        borderLeft: `4px solid ${ato.cor_tema}`,
        background: `color-mix(in srgb, ${ato.cor_tema} 5%, var(--surface))`,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.66rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: ato.cor_tema,
            fontWeight: 800,
          }}
        >
          {ato.emoji} {ato.subtitulo}
        </span>
      </div>
      <h2
        className="title-fight"
        style={{
          margin: "4px 0 6px",
          fontSize: "1.6rem",
          color: ato.cor_tema,
        }}
      >
        {ato.nome}
      </h2>
      <p style={{ margin: 0, fontSize: "0.88rem", lineHeight: 1.5, fontStyle: "italic" }}>
        &quot;{ato.arco}&quot;
      </p>

      <div className="xp-bar" style={{ marginTop: 12 }}>
        <div
          className="xp-fill"
          style={{ width: `${pct}%`, background: ato.cor_tema }}
        />
      </div>
      <div
        className="subtle"
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.68rem",
          marginTop: 4,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>{pct}% do ato</span>
        <span>{restam} dias restantes</span>
      </div>

      {/* Boss do ato */}
      <div
        style={{
          marginTop: 12,
          padding: "8px 10px",
          borderRadius: 8,
          border: `1px dashed ${ato.cor_tema}`,
          display: "grid",
          gap: 4,
        }}
      >
        <div
          className="lbl"
          style={{ color: ato.cor_tema, fontSize: "0.66rem", letterSpacing: "0.14em" }}
        >
          ⚔️ Boss do ato
        </div>
        <div style={{ fontWeight: 800 }}>{ato.boss_nome}</div>
        <p className="subtle" style={{ margin: 0, fontSize: "0.75rem", fontStyle: "italic" }}>
          &quot;{ato.boss_arco}&quot;
        </p>
      </div>
    </div>
  );
}
