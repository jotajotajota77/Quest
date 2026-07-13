"use client";

// ============================================================
// Protocolo diário (home) — quick-log de TRACKING. (referência VHYX)
// ------------------------------------------------------------
// Núcleo: os 4 comportamentos (tocar = registra de verdade → XP/atributo +
// hit-confirm). Trackers leves: água/sono/passos/álcool (alimentam só o
// %/streak do protocolo, NÃO os atributos). Coexiste com o foco único — é
// quick-log conforme você faz, não uma lista de decisões.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comportamento, Familia } from "@/lib/types";
import { FAMILIAS, FAMILIAS_ORDEM } from "@/lib/comportamentos";
import { AGUA_META, N_PROTOCOLO } from "@/lib/protocolo";
import { useHitConfirm } from "@/components/HitConfirm";

const COMP_NUCLEO: Record<Familia, Comportamento> = {
  treino: "treino",
  nutri: "nutri_refeicao",
};

interface Trackers {
  agua_count: number;
  sono_ok: boolean;
  passos_ok: boolean;
  sem_alcool: boolean;
}

export default function ProtocoloCard({
  nucleoInicial,
  trackersInicial,
}: {
  nucleoInicial: Familia[];
  trackersInicial: Trackers;
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [nucleo, setNucleo] = useState<Set<Familia>>(new Set(nucleoInicial));
  const [t, setT] = useState<Trackers>(trackersInicial);
  const [ocupado, setOcupado] = useState(false);

  const trackersFeitos =
    (t.agua_count >= AGUA_META ? 1 : 0) +
    (t.sono_ok ? 1 : 0) +
    (t.passos_ok ? 1 : 0) +
    (t.sem_alcool ? 1 : 0);
  const feitos = nucleo.size + trackersFeitos;
  const pct = Math.round((feitos / N_PROTOCOLO) * 100);

  async function logNucleo(f: Familia) {
    setOcupado(true);
    fire("HIT!");
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamento: COMP_NUCLEO[f] }),
      });
      setNucleo((s) => new Set(s).add(f));
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  async function tracker(action: string) {
    const res = await fetch("/api/protocolo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      const { trackers } = await res.json();
      setT(trackers);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16 }}>
      {overlay}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="lbl">Protocolo</div>
        <div className="title-fight" style={{ fontSize: "1rem" }}>
          {feitos}/{N_PROTOCOLO}
        </div>
      </div>
      <div className="xp-bar" style={{ margin: "8px 0 12px" }}>
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>

      {/* Núcleo — registra de verdade */}
      <div className="protocolo-grid">
        {FAMILIAS_ORDEM.map((f) => {
          const feito = nucleo.has(f);
          return (
            <button
              key={f}
              className={`proto-btn ${feito ? "feito" : ""}`}
              disabled={ocupado}
              onClick={() => logNucleo(f)}
            >
              {feito ? "✓ " : ""}
              {FAMILIAS[f].label}
            </button>
          );
        })}
      </div>

      {/* Trackers leves — só protocolo, não atributo */}
      <div className="protocolo-grid" style={{ marginTop: 8 }}>
        <button className={`proto-btn ${t.agua_count >= AGUA_META ? "feito" : ""}`} onClick={() => tracker("agua")}>
          💧 Água {t.agua_count}/{AGUA_META}
        </button>
        <button className={`proto-btn ${t.sono_ok ? "feito" : ""}`} onClick={() => tracker("sono")}>
          😴 Sono ≥7h
        </button>
        <button className={`proto-btn ${t.passos_ok ? "feito" : ""}`} onClick={() => tracker("passos")}>
          👟 Passos
        </button>
        <button className={`proto-btn ${t.sem_alcool ? "feito" : ""}`} onClick={() => tracker("alcool")}>
          🚫🍺 S/ álcool
        </button>
      </div>
    </div>
  );
}
