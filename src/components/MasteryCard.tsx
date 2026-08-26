// v12: painel de Muscle Mastery — 9 grupos com nivel + barra XP.
// Server component; recebe carregarMasteryMusculo() já resolvido.
import type { MasteryResolvida } from "@/lib/engine/mastery";

// v12.4: labels em PT — consistente com o resto do app.
// PR8 adicionou 5 grupos V-Taper granulares. Os antigos back/shoulders
// continuam declarados p/ back-compat (aparecem só se ainda tem XP legado).
const LABEL_GRUPO: Record<string, { rotulo: string; icon: string; vtaper?: boolean }> = {
  chest:          { rotulo: "Peito",              icon: "🫁" },
  upper_chest:    { rotulo: "Peito superior",     icon: "🫁", vtaper: true },
  back:           { rotulo: "Costas (legado)",    icon: "🌿" },
  back_width:     { rotulo: "Dorsal · largura",   icon: "🕊️", vtaper: true },
  back_thickness: { rotulo: "Dorsal · espessura", icon: "🪨", vtaper: true },
  shoulders:      { rotulo: "Ombros (legado)",    icon: "💠" },
  shoulders_side: { rotulo: "Ombro lateral",      icon: "◆", vtaper: true },
  shoulders_rear: { rotulo: "Ombro posterior",    icon: "◇", vtaper: true },
  biceps:         { rotulo: "Bíceps",             icon: "💪" },
  triceps:        { rotulo: "Tríceps",            icon: "🦾" },
  lower:          { rotulo: "Pernas",             icon: "🦵" },
  core:           { rotulo: "Core",               icon: "🔥" },
  taekwondo:      { rotulo: "Taekwondo",          icon: "🥋" },
  danca:          { rotulo: "Dança",              icon: "💃" },
};

// PR8: grupos legados só aparecem se AINDA têm XP (usuário pré-0044
// que rodou migração; ou algum erro de mapeamento).
const GRUPOS_LEGADOS = new Set(["back", "shoulders"]);

export default function MasteryCard({ masteries }: { masteries: MasteryResolvida[] }) {
  // PR8: esconde back/shoulders legados quando XP = 0 (pós-migração normal).
  const visiveis = masteries.filter(
    (m) => !GRUPOS_LEGADOS.has(m.grupo) || m.xp > 0,
  );
  const totalNivel = visiveis.reduce((s, m) => s + m.nivel, 0);
  const maxGrupo = visiveis.reduce(
    (best, m) => (m.nivel > best.nivel ? m : best),
    visiveis[0],
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
        {visiveis.map((m) => {
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
                  {label.vtaper && (
                    <span style={{ marginLeft: 4, fontSize: 9, color: "var(--belt-gold)" }}>
                      ★
                    </span>
                  )}
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
