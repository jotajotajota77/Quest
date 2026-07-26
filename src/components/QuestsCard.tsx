// Quests / sidequests — camada VR SECUNDÁRIA na home. Reconhecimento passivo
// do que você já fez; quests manuais (tkd/musculação) têm botão Marcar.
import type { QuestView } from "@/lib/data";
import QuestRow from "@/components/QuestRow";

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
          <QuestRow key={q.quest_id} quest={q} />
        ))}
      </div>
    </div>
  );
}
