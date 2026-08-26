"use client";

// ============================================================
// AchievementsGrid — v2 (PR11).
// ------------------------------------------------------------
// Grid agrupado por categoria. Desbloqueadas mostram data + brilho.
// Bloqueadas mostram descrição em cinza.
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AchievementDef, UserAchievement } from "@/lib/physique/data";

interface Props {
  catalogo: AchievementDef[];
  meus: Map<string, UserAchievement>;
}

const COR_RARIDADE: Record<string, string> = {
  comum:    "var(--ink-dim)",
  raro:     "var(--calm)",
  epico:    "var(--belt-gold)",
  lendario: "var(--kihap)",
};

const LABEL_CATEGORIA: Record<string, string> = {
  onboarding:   "Primeiros passos",
  consistencia: "Consistência",
  forca:        "Força",
  volume:       "Volume",
  fase:         "Fases",
  recovery:     "Recovery",
  skill_tree:   "Skill Tree",
  saber:        "Saber",
};

export default function AchievementsGrid({ catalogo, meus }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  const porCategoria = useMemo(() => {
    const m = new Map<string, AchievementDef[]>();
    for (const a of catalogo) {
      const arr = m.get(a.categoria) ?? [];
      arr.push(a);
      m.set(a.categoria, arr);
    }
    return m;
  }, [catalogo]);

  async function reavaliar() {
    setOcupado(true);
    try {
      await fetch("/api/achievements", { method: "POST" });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          type="button"
          className="btn"
          disabled={ocupado}
          onClick={reavaliar}
          style={{ padding: "6px 12px", fontSize: 12 }}
        >
          {ocupado ? "verificando…" : "Verificar agora"}
        </button>
      </div>

      {[...porCategoria.entries()].map(([categoria, achs]) => (
        <section
          key={categoria}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <h2
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: "var(--ink-dim)",
            }}
          >
            {LABEL_CATEGORIA[categoria] ?? categoria}
          </h2>
          <div style={{ display: "grid", gap: 8 }}>
            {achs.map((a) => {
              const u = meus.get(a.slug);
              return <Node key={a.slug} def={a} unlocked={u ?? null} />;
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function Node({ def, unlocked }: { def: AchievementDef; unlocked: UserAchievement | null }) {
  const cor = COR_RARIDADE[def.raridade] ?? "var(--ink-dim)";
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: unlocked ? "var(--ground)" : "transparent",
        borderLeft: `3px solid ${unlocked ? cor : "var(--hairline)"}`,
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <strong style={{ fontSize: 13, color: unlocked ? "var(--ink)" : "var(--ink-dim)" }}>
          {unlocked ? "✓ " : "◯ "}
          {def.nome}
        </strong>
        <span style={{ fontSize: 10, color: cor, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {def.raridade}
        </span>
      </div>
      {def.descricao && (
        <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>
          {def.descricao}
        </div>
      )}
      {unlocked && (
        <div style={{ fontSize: 10, color: cor, marginTop: 4 }}>
          desbloqueado em {new Date(unlocked.unlocked_em).toLocaleDateString("pt-BR")}
        </div>
      )}
    </div>
  );
}
