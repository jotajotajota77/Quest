"use client";

// Fontes abertas de Stamina (v8) — cardio/vôlei/resistência em 1-toque. Camada
// universal (hit-confirm + Stamina ponderada), SEM música. A variedade está nas
// opções; registrar segue 1-toque (piso intacto).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ATIVIDADES_STAMINA } from "@/lib/atividades";
import { useHitConfirm } from "@/components/HitConfirm";

export default function AtividadesStamina() {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [ocupado, setOcupado] = useState(false);
  const [ultimo, setUltimo] = useState<string | null>(null);

  async function registrar(comportamento: string, label: string) {
    setOcupado(true);
    fire("STAMINA!");
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamento }),
      });
      if (res.ok) {
        const dec = await res.json();
        setUltimo(`${label} · +${dec?.ganho?.total ?? ""} Stamina`);
      }
    } catch {
      /* hit-confirm local já ocorreu */
    }
    router.refresh();
    setOcupado(false);
  }

  return (
    <div className="panel" style={{ marginTop: 12, borderColor: "var(--gold)" }}>
      {overlay}
      <div className="lbl" style={{ marginBottom: 8 }}>
        Atividade de fôlego · Stamina (1-toque)
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {ATIVIDADES_STAMINA.map((a) => (
          <button
            key={a.comportamento}
            className="btn"
            style={{ flex: "1 1 30%", minWidth: 96 }}
            disabled={ocupado}
            onClick={() => registrar(a.comportamento, a.label)}
          >
            {a.emoji} {a.label}
          </button>
        ))}
      </div>
      {ultimo && (
        <p className="subtle" style={{ marginTop: 8, textAlign: "center" }}>
          {ultimo}
        </p>
      )}
    </div>
  );
}
