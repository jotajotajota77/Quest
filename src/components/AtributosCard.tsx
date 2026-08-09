// v12: card de atributos 5-eixos + build tag + shards.
// Server component — recebe snapshot já carregado.
import type { AtributosV2 } from "@/lib/engine/atributos_v2";
import type { BuildTrainee } from "@/lib/engine/atributos_v2";

interface Props {
  atributos: AtributosV2 & { shards: number };
  build: { build: BuildTrainee; rotulo: string; emoji: string; motivo: string };
}

const EIXO_LABELS: Record<string, { rotulo: string; icon: string; cor: string }> = {
  forca:       { rotulo: "Força",       icon: "💪", cor: "var(--neon)" },
  potencia:    { rotulo: "Potência",    icon: "⚡", cor: "var(--gold)" },
  resistencia: { rotulo: "Resistência", icon: "🫀", cor: "var(--calm)" },
  mobilidade:  { rotulo: "Mobilidade",  icon: "🧘", cor: "var(--lilac)" },
  tecnica:     { rotulo: "Técnica",     icon: "🥋", cor: "var(--kihap)" },
};

const EIXOS_ORDEM = ["forca", "potencia", "resistencia", "mobilidade", "tecnica"] as const;

/** Escala visual pra barra — cap em 500 pra não achatar quando forca fica alta. */
const CAP_VISUAL = 500;

export default function AtributosCard({ atributos, build }: Props) {
  const max = Math.max(
    CAP_VISUAL,
    ...EIXOS_ORDEM.map((e) => atributos[e]),
  );

  return (
    <div
      className="panel"
      style={{
        marginBottom: 14,
        display: "grid",
        gap: 10,
        borderLeft: "3px solid var(--gold)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="lbl">Atributos · trainee</div>
        <span
          className="subtle"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.72rem",
          }}
        >
          {build.emoji} {build.rotulo}
        </span>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {EIXOS_ORDEM.map((eixo) => {
          const val = atributos[eixo];
          const meta = EIXO_LABELS[eixo];
          const pct = Math.min(100, (val / max) * 100);
          return (
            <div key={eixo} style={{ display: "grid", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem" }}>
                <span>
                  <span style={{ marginRight: 6 }}>{meta.icon}</span>
                  {meta.rotulo}
                </span>
                <span
                  className="subtle"
                  style={{ fontFamily: "var(--font-mono)" }}
                >
                  {val}
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${pct}%`,
                    height: "100%",
                    background: meta.cor,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: "1px solid var(--hairline)",
          paddingTop: 8,
          marginTop: 4,
        }}
      >
        <span className="subtle" style={{ fontSize: "0.72rem", fontStyle: "italic" }}>
          {build.motivo}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "0.75rem",
            color: "var(--gold)",
          }}
        >
          ✦ {atributos.shards} shards
        </span>
      </div>
    </div>
  );
}
