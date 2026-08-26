"use client";

// ============================================================
// TravelToggle — inicia/encerra Travel Mode (PR10 §23).
// ------------------------------------------------------------
// Ativa também troca a fase pra 'travel' automaticamente. Encerra
// preserva reentry de 3 dias por default (targets voltam gradual).
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { TravelPeriod } from "@/lib/physique/data";

export default function TravelToggle({ travel }: { travel: TravelPeriod | null }) {
  const router = useRouter();
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function chamar(action: "iniciar" | "encerrar") {
    setOcupado(true);
    setErro(null);
    try {
      const res = await fetch("/api/travel", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const j = await res.json();
      if (!res.ok) setErro(j?.error ?? "falha");
      else router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section
      style={{
        background: travel ? "color-mix(in srgb, var(--belt-gold) 12%, var(--surface))" : "var(--surface)",
        border: `1px solid ${travel ? "var(--belt-gold)" : "var(--hairline)"}`,
        borderRadius: 16,
        padding: 14,
        marginBottom: 14,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--ink-dim)", letterSpacing: 0.5, textTransform: "uppercase" }}>
            Travel Mode · §23
          </div>
          {travel ? (
            <div style={{ fontSize: 14, marginTop: 4 }}>
              <strong style={{ color: "var(--belt-gold)" }}>✈ Ativo</strong>
              <span style={{ marginLeft: 8, color: "var(--ink-dim)", fontSize: 12 }}>
                desde {new Date(travel.iniciado_em).toLocaleDateString("pt-BR")}
                {travel.config.proteina_min ? ` · piso ${travel.config.proteina_min}g` : ""}
              </span>
            </div>
          ) : (
            <div style={{ fontSize: 13, marginTop: 4, color: "var(--ink-dim)" }}>
              Viagem, hotel, ensaio fora — proteína piso + logging simplificado + quests reduzidas.
            </div>
          )}
        </div>
        <button
          type="button"
          className={travel ? "btn" : "btn btn-primary"}
          disabled={ocupado}
          onClick={() => chamar(travel ? "encerrar" : "iniciar")}
          style={{ padding: "8px 14px", fontSize: 12 }}
        >
          {ocupado ? "…" : travel ? "Encerrar" : "Ativar"}
        </button>
      </div>
      {erro && <div style={{ marginTop: 8, color: "var(--kihap)", fontSize: 12 }}>{erro}</div>}
    </section>
  );
}
