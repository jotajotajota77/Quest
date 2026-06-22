// Quests / sidequests — camada VR SECUNDÁRIA na home. Reconhecimento passivo do
// que você já fez; não compete com o foco único nem com o protocolo.
import type { QuestView } from "@/lib/data";

export default function QuestsCard({ quests }: { quests: QuestView[] }) {
  const feitas = quests.filter((q) => q.completa).length;
  return (
    <div className="panel" style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="lbl">Quests do dia</div>
        <span className="subtle">{feitas}/{quests.length}</span>
      </div>
      <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
        {quests.map((q) => (
          <div
            key={q.quest_id}
            style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: q.completa ? 1 : 0.7 }}
          >
            <span style={{ color: q.completa ? "var(--good)" : "var(--text)" }}>
              {q.completa ? "✓ " : "○ "}
              {q.descricao}
              {q.tipo === "sidequest" && (
                <span className="subtle" style={{ fontSize: "0.65rem" }}> · side</span>
              )}
            </span>
            <span className="subtle" style={{ color: "var(--gold)" }}>+{q.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
