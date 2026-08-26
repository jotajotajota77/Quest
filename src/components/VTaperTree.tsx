"use client";

// ============================================================
// VTaperTree — skill tree por músculo (PR 8, §10, §100).
// ------------------------------------------------------------
// Agrupa por tier (S/A/B/C). Chip clicável = muda tier via
// POST /api/priority. Nó = nome + nível + XP + barra pra próximo nível.
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PriorityRow, PriorityTier } from "@/lib/physique/data";

interface MasteryLite {
  grupo: string;
  nivel: number;
  xp: number;
  xpNoNivel: number;
  xpPraProximo: number;
  pctPraProximo: number;
}

interface Props {
  masteries: MasteryLite[];
  priorities: PriorityRow[];
  gruposTodos: string[];
  gruposVtaper: string[];
}

const NOME_GRUPO: Record<string, string> = {
  chest: "Peito",
  upper_chest: "Peito superior",
  back: "Costas (legado)",
  back_width: "Dorsal · largura",
  back_thickness: "Dorsal · espessura",
  shoulders: "Ombros (legado)",
  shoulders_side: "Ombro lateral",
  shoulders_rear: "Ombro posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  lower: "Pernas",
  core: "Core",
  taekwondo: "TKD",
  danca: "Dança",
};

const TIER_LABEL: Record<PriorityTier, { cor: string; nome: string }> = {
  s: { cor: "var(--kihap)",     nome: "S · foco máximo" },
  a: { cor: "var(--belt-gold)", nome: "A · alto" },
  b: { cor: "var(--calm)",      nome: "B · manutenção" },
  c: { cor: "var(--ink-dim)",   nome: "C · mínimo" },
};

const TIERS: PriorityTier[] = ["s", "a", "b", "c"];

export default function VTaperTree({ masteries, priorities, gruposTodos, gruposVtaper }: Props) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);

  const priorityDe = useMemo(() => {
    const m = new Map<string, PriorityTier>();
    for (const p of priorities) m.set(p.muscle_group, p.tier);
    return m;
  }, [priorities]);

  const masteryDe = useMemo(() => {
    const m = new Map<string, MasteryLite>();
    for (const x of masteries) m.set(x.grupo, x);
    return m;
  }, [masteries]);

  // Só mostra grupos jogáveis (esconde chest/back/shoulders legados
  // quando não tem XP — migração 0044 zerou back/shoulders após split).
  const gruposMostrar = gruposTodos.filter((g) => {
    if (g === "back" || g === "shoulders") {
      const m = masteryDe.get(g);
      return !!m && m.xp > 0;
    }
    return true;
  });

  const porTier: Record<PriorityTier, string[]> = { s: [], a: [], b: [], c: [] };
  const semTier: string[] = [];
  for (const g of gruposMostrar) {
    const t = priorityDe.get(g);
    if (t) porTier[t].push(g);
    else semTier.push(g);
  }

  async function setTier(grupo: string, tier: PriorityTier) {
    setOcupado(true);
    try {
      await fetch("/api/priority", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ muscle_group: grupo, tier }),
      });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 14 }}>
      {TIERS.map((t) => (
        <section
          key={t}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--hairline)",
            borderLeft: `4px solid ${TIER_LABEL[t].cor}`,
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              color: TIER_LABEL[t].cor,
              marginBottom: 10,
            }}
          >
            {TIER_LABEL[t].nome}
          </div>
          {porTier[t].length === 0 ? (
            <p style={{ margin: 0, color: "var(--ink-dim)", fontSize: 12 }}>
              nenhum grupo neste tier
            </p>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {porTier[t].map((g) => (
                <Node
                  key={g}
                  grupo={g}
                  mastery={masteryDe.get(g) ?? null}
                  tierAtual={t}
                  vtaper={gruposVtaper.includes(g)}
                  onSetTier={setTier}
                  ocupado={ocupado}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      {semTier.length > 0 && (
        <section
          style={{
            background: "var(--surface)",
            border: "1px dashed var(--hairline)",
            borderRadius: 12,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: "var(--ink-dim)", marginBottom: 8 }}>
            Sem tier atribuído
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {semTier.map((g) => (
              <Node
                key={g}
                grupo={g}
                mastery={masteryDe.get(g) ?? null}
                tierAtual={null}
                vtaper={gruposVtaper.includes(g)}
                onSetTier={setTier}
                ocupado={ocupado}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Node({
  grupo,
  mastery,
  tierAtual,
  vtaper,
  onSetTier,
  ocupado,
}: {
  grupo: string;
  mastery: MasteryLite | null;
  tierAtual: PriorityTier | null;
  vtaper: boolean;
  onSetTier: (g: string, t: PriorityTier) => void;
  ocupado: boolean;
}) {
  const label = NOME_GRUPO[grupo] ?? grupo;
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 10,
        background: "var(--ground)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div>
          <strong style={{ fontSize: 14 }}>{label}</strong>
          {vtaper && (
            <span style={{ marginLeft: 6, fontSize: 10, color: "var(--belt-gold)" }}>
              ★ V-Taper
            </span>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--ink-dim)" }}>
          nv <strong style={{ color: "var(--ink)" }}>{mastery?.nivel ?? 1}</strong>
          {" · "}
          <strong>{mastery?.xp ?? 0}</strong> XP
        </span>
      </div>
      {mastery && mastery.xpPraProximo > 0 && (
        <div style={{ marginTop: 6, height: 4, background: "var(--surface)", borderRadius: 2 }}>
          <div
            style={{
              height: "100%",
              width: `${Math.round(mastery.pctPraProximo)}%`,
              background: "var(--calm)",
              borderRadius: 2,
            }}
          />
        </div>
      )}
      <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap" }}>
        {TIERS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={ocupado || tierAtual === t}
            onClick={() => onSetTier(grupo, t)}
            style={{
              padding: "4px 10px",
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 0.5,
              textTransform: "uppercase",
              border: `1px solid ${tierAtual === t ? TIER_LABEL[t].cor : "var(--hairline)"}`,
              background: tierAtual === t ? `color-mix(in srgb, ${TIER_LABEL[t].cor} 15%, var(--surface))` : "var(--surface)",
              color: tierAtual === t ? TIER_LABEL[t].cor : "var(--ink-dim)",
              cursor: tierAtual === t ? "default" : "pointer",
              opacity: ocupado && tierAtual !== t ? 0.5 : 1,
            }}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}
