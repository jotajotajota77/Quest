"use client";

// ============================================================
// PhotocardArt (v12.6) — render de photocard com arte real quando o
// arquivo /public/photocards/<pers>/<season>-<conceito>.jpg existir,
// com fallback pro emoji do conceito se falhar (mesmo comportamento
// gracioso de CharacterImage).
// ============================================================
import { useState } from "react";
import type { Photocard } from "@/lib/photocards";

interface Props {
  card: Photocard;
  /** Tamanho do emoji fallback. */
  emojiSize?: string;
}

export function photocardArtPath(card: Photocard): string {
  return `/photocards/${card.personagem}/${card.season}-${card.conceito}.jpg`;
}

export default function PhotocardArt({ card, emojiSize = "1.8rem" }: Props) {
  const [falhou, setFalhou] = useState(false);
  if (falhou) {
    return (
      <span style={{ fontSize: emojiSize, display: "grid", placeItems: "center" }}>
        {emojiConceito(card.conceito)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={photocardArtPath(card)}
      alt={`${card.personagem} · ${card.season} · ${card.conceito}`}
      onError={() => setFalhou(true)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center top",
      }}
    />
  );
}

export function emojiConceito(conceito: string): string {
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
