// ============================================================
// QuestsAdaptativasCard — quests v2 filtradas por contexto (PR7 §32).
// ------------------------------------------------------------
// Server component. Não substitui QuestsCard (v1) — coexistem por 1 ciclo.
// Mostra até 5 quests ativas do quest_instance, agrupadas por tier.
// ============================================================

import type { QuestInstance, QuestDefinition } from "@/lib/physique/data";

const TIER_LABEL: Record<string, { txt: string; cor: string }> = {
  daily:  { txt: "diária",   cor: "var(--calm)" },
  weekly: { txt: "semanal",  cor: "var(--belt-gold)" },
  arc:    { txt: "arco",     cor: "var(--kihap)" },
  season: { txt: "temporada", cor: "var(--chama)" },
};

interface Props {
  quests: (QuestInstance & { def: QuestDefinition })[];
}

export default function QuestsAdaptativasCard({ quests }: Props) {
  if (!quests || quests.length === 0) return null;

  // Ordena: recovery/welcome_back primeiro, depois daily, weekly, arc, season.
  const priority = (q: QuestInstance): number => {
    if (q.slug === "welcome_back") return 0;
    if (q.slug.startsWith("recovery_")) return 1;
    if (q.tier === "daily") return 2;
    if (q.tier === "weekly") return 3;
    if (q.tier === "arc") return 4;
    return 5;
  };
  const ordenadas = [...quests].sort((a, b) => priority(a) - priority(b)).slice(0, 5);

  return (
    <div className="panel" style={{ marginBottom: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 8 }}>
        Quests adaptativas
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {ordenadas.map((q) => (
          <QuestLine key={q.id} q={q} />
        ))}
      </div>
    </div>
  );
}

function QuestLine({ q }: { q: QuestInstance & { def: QuestDefinition } }) {
  const tier = TIER_LABEL[q.tier];
  const recompensa = q.def.reforcador as { xp?: number; shards?: number };
  const contextual = q.slug === "welcome_back" || q.slug.startsWith("recovery_");

  return (
    <div
      style={{
        padding: "8px 10px",
        borderRadius: 10,
        background: "var(--ground)",
        borderLeft: `3px solid ${contextual ? "var(--kihap)" : tier.cor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <strong style={{ fontSize: 13, color: contextual ? "var(--kihap)" : "var(--ink)" }}>
          {q.def.nome}
        </strong>
        <span style={{ fontSize: 10, color: tier.cor, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {tier.txt}
        </span>
      </div>
      {q.def.descricao && (
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
          {q.def.descricao}
        </div>
      )}
      <div style={{ fontSize: 10, color: "var(--ink-dim)", marginTop: 4 }}>
        {recompensa?.xp ? `+${recompensa.xp} XP` : ""}
        {recompensa?.shards ? ` · +${recompensa.shards} shards` : ""}
      </div>
    </div>
  );
}
