"use client";

// ============================================================
// PhotocardDropToast (v12 PR3) — overlay de "unbox" reutilizável.
// ------------------------------------------------------------
// Hook imperativo: `showDrop(payload)` mostra um card flutuante por ~2.5s
// com a arte esquemática da photocard dropada + mensagem opcional (boss
// derrotado / split fechado). Sem storage — visual only.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { photocardPorId } from "@/lib/photocards";
import { seasonPorSlug } from "@/lib/seasons";

interface DropPayload {
  photocardId: string;
  header?: string;   // ex.: "BOSS DERROTADO", "SESSÃO FECHADA"
  bonus?: string;    // ex.: "+150 XP · +3 shards"
}

const CORES_RARIDADE: Record<string, string> = {
  regular: "var(--hairline)",
  rare: "var(--gold)",
  holo: "var(--lilac)",
  signature: "var(--neon-2)",
};

const LABEL_PERSONAGEM: Record<string, string> = {
  "ryuki-han":     "Ryuki",
  "ji-seok-moon":  "Ji-seok",
  "hujin-kim":     "Hujin",
  "sanhee-park":   "Sanhee",
  "chan-ho-lee":   "Chan-ho",
  "sanha":         "Sanha",
};

export function usePhotocardDrop() {
  const [drop, setDrop] = useState<(DropPayload & { key: number }) | null>(null);
  const keyRef = useRef(0);

  const showDrop = useCallback((payload: DropPayload) => {
    keyRef.current += 1;
    setDrop({ ...payload, key: keyRef.current });
  }, []);

  useEffect(() => {
    if (!drop) return;
    const t = setTimeout(() => setDrop(null), 2600);
    return () => clearTimeout(t);
  }, [drop]);

  const overlay = drop ? (
    <DropCard
      key={drop.key}
      photocardId={drop.photocardId}
      header={drop.header}
      bonus={drop.bonus}
    />
  ) : null;
  return { showDrop, dropOverlay: overlay };
}

function DropCard({ photocardId, header, bonus }: DropPayload) {
  const card = photocardPorId(photocardId);
  if (!card) return null;
  const season = seasonPorSlug(card.season);
  const cor = CORES_RARIDADE[card.raridade] ?? "var(--gold)";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        pointerEvents: "none",
        zIndex: 9999,
        animation: "pcdrop-in 0.42s ease-out both",
      }}
    >
      <style>{`
        @keyframes pcdrop-in {
          from { opacity: 0; transform: translateY(20px) scale(0.9); filter: blur(6px); }
          to   { opacity: 1; transform: translateY(0)    scale(1);   filter: blur(0); }
        }
        @keyframes pcdrop-shine {
          from { transform: translateX(-120%); }
          to   { transform: translateX(220%); }
        }
      `}</style>
      <div
        style={{
          position: "relative",
          width: 220,
          aspectRatio: "2 / 3",
          borderRadius: 14,
          border: `3px solid ${cor}`,
          background: season
            ? `linear-gradient(160deg, ${season.cor_primaria}55, ${season.cor_secundaria}55)`
            : "rgba(20,20,30,0.9)",
          padding: 14,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          overflow: "hidden",
          boxShadow: `0 20px 60px rgba(0,0,0,0.45), 0 0 0 3px rgba(0,0,0,0.25), 0 0 24px ${cor}55`,
        }}
      >
        {/* Faixa de shine passando */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "60%",
            height: "100%",
            background:
              "linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)",
            animation: "pcdrop-shine 1.2s ease-in-out 0.3s",
          }}
        />

        {header && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "0.6rem",
              letterSpacing: "0.18em",
              color: cor,
              textTransform: "uppercase",
              fontWeight: 800,
            }}
          >
            {header}
          </div>
        )}

        <div
          style={{
            fontSize: "0.55rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: season?.cor_primaria ?? "var(--text-dim)",
          }}
        >
          {season?.nome ?? card.season}
        </div>

        <div
          style={{
            flex: 1,
            display: "grid",
            placeItems: "center",
            fontSize: "3.4rem",
          }}
        >
          {emojiConceito(card.conceito)}
        </div>

        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>
            {LABEL_PERSONAGEM[card.personagem] ?? card.personagem}
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.66rem",
              fontFamily: "var(--font-mono)",
              color: cor,
            }}
          >
            <span style={{ textTransform: "uppercase" }}>{card.raridade}</span>
            <span className="subtle">
              #{String(card.numero_serie).padStart(3, "0")}
            </span>
          </div>
          {bonus && (
            <div
              style={{
                marginTop: 4,
                fontSize: "0.66rem",
                color: "var(--gold)",
                fontFamily: "var(--font-mono)",
                textAlign: "center",
              }}
            >
              {bonus}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function emojiConceito(conceito: string): string {
  switch (conceito) {
    case "y2k": return "💿";
    case "street": return "🌆";
    case "dark": return "🌑";
    case "fresh": return "🌱";
    case "athlete": return "🏅";
    case "retro": return "📼";
    case "hiphop": return "🎧";
    case "uniform": return "🎖️";
    default: return "✦";
  }
}
