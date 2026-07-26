"use client";

// v11: linha de quest com botão "Marcar" pra quests manuais (TKD/musculação).
// Usado em QuestsCard (home) e /quests (aba dedicada).
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { QuestView } from "@/lib/data";

const EMOJI_TIPO: Record<string, string> = {
  diaria: "○",
  sidequest: "○",
  tkd: "🥋",
  musculacao: "🏋️",
};

export default function QuestRow({
  quest: q,
  destaque = false,
}: {
  quest: QuestView;
  destaque?: boolean;
}) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const marcador = EMOJI_TIPO[q.tipo] ?? "○";

  async function marcar() {
    setOcupado(true);
    try {
      await fetch("/api/quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quest_id: q.quest_id }),
      });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  const wrapperStyle: React.CSSProperties = destaque
    ? {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 10px",
        borderRadius: 8,
        border: `1px solid ${q.completa ? "var(--good)" : "var(--hairline)"}`,
        background: q.completa
          ? "color-mix(in srgb, var(--good) 8%, transparent)"
          : "transparent",
        gap: 8,
      }
    : {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 8,
        opacity: q.completa ? 1 : 0.85,
      };

  return (
    <div style={wrapperStyle}>
      <span
        style={{
          color: q.completa ? "var(--good)" : "var(--text)",
          fontWeight: destaque && q.completa ? 700 : 500,
          flex: 1,
        }}
      >
        {q.completa ? "✓ " : `${marcador} `}
        {q.descricao}
      </span>
      {q.manual && !q.completa && (
        <button
          className="nav-link"
          disabled={ocupado}
          onClick={marcar}
          style={{
            padding: "3px 10px",
            fontSize: "0.7rem",
            borderColor: "var(--kihap)",
            color: "var(--kihap)",
          }}
        >
          Marcar
        </button>
      )}
      <span
        className="subtle"
        style={{ color: "var(--gold)", fontWeight: 700, minWidth: 40, textAlign: "right" }}
      >
        +{q.xp}
      </span>
    </div>
  );
}
