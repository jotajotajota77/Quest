// v12: painel de Muscle Mastery — 9 grupos com nivel + barra XP.
// Server component; recebe carregarMasteryMusculo() já resolvido.
import type { MasteryResolvida } from "@/lib/engine/mastery";

const LABEL_GRUPO: Record<string, { rotulo: string; icon: string }> = {
  chest:     { rotulo: "Chest",     icon: "🫁" },
  back:      { rotulo: "Back",      icon: "🌿" },
  shoulders: { rotulo: "Shoulders", icon: "💠" },
  biceps:    { rotulo: "Biceps",    icon: "💪" },
  triceps:   { rotulo: "Triceps",   icon: "🦾" },
  lower:     { rotulo: "Lower",     icon: "🦵" },
  core:      { rotulo: "Core",      icon: "🔥" },
  taekwondo: { rotulo: "TKD",       icon: "🥋" },
  danca:     { rotulo: "Dance",     icon: "💃" },
};

export default function MasteryCard({ masteries }: { masteries: MasteryResolvida[] }) {
  const totalNivel = masteries.reduce((s, m) => s + m.nivel, 0);
  const maxGrupo = masteries.reduce(
    (best, m) => (m.nivel > best.nivel ? m : best),
    masteries[0],
  );

  return (
    <div
      className="panel"
      style={{
        marginTop: 14,
        marginBottom: 14,
        display: "grid",
        gap: 10,
        borderLeft: "3px solid var(--neon)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div className="lbl">Muscle Mastery</div>
        <span
          className="subtle"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
        >
          nível total {totalNivel} · maior {LABEL_GRUPO[maxGrupo?.grupo ?? "chest"]?.rotulo ?? maxGrupo?.grupo} LV{maxGrupo?.nivel ?? 1}
        </span>
      </div>

      <div style={{ display: "grid", gap: 6 }}>
        {masteries.map((m) => {
          const label = LABEL_GRUPO[m.grupo] ?? { rotulo: m.grupo, icon: "•" };
          return (
            <div key={m.grupo} style={{ display: "grid", gap: 3 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.75rem",
                }}
              >
                <span>
                  <span style={{ marginRight: 6 }}>{label.icon}</span>
                  {label.rotulo}
                  <span
                    style={{
                      marginLeft: 6,
                      color: "var(--neon)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    LV{m.nivel}
                  </span>
                </span>
                <span
                  className="subtle"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.68rem" }}
                >
                  {m.xpNoNivel}/{m.xpPraProximo}
                </span>
              </div>
              <div
                style={{
                  height: 5,
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.06)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${m.pctPraProximo}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, var(--neon), var(--gold))",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="subtle" style={{ margin: 0, fontSize: "0.68rem", fontStyle: "italic" }}>
        Cada série registrada distribui XP nos grupos que ela ativa. Bater PR entrega photocard HOLO do mestre daquele grupo.
      </p>
    </div>
  );
}
