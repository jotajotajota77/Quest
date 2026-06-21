"use client";

// ============================================================
// Botão de registro — 1 TOQUE. (coração da UX do V1)
// ------------------------------------------------------------
// Ordem TRAVADA:
//   1. Hit-confirm LOCAL dispara JÁ (som+animação), antes de qualquer rede.
//   2. POST /api/log aplica ganho/fading e decide se toca música.
//   3. Se houver música, tenta a faixa cheia (Web Playback SDK):
//        sucesso → marca 'faixa_cheia';  falha → 'fallback_local' (fila).
// O reforço NUNCA cai a zero: o passo 1 já aconteceu independom de tudo.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisaoReforco } from "@/lib/types";
import { useHitConfirm } from "@/components/HitConfirm";
import { tocarUri } from "@/lib/spotify/playback";

export default function LogButton() {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [ultimo, setUltimo] = useState<string | null>(null);

  async function registrar(tipo: "refeicao" | "hidratacao") {
    // (1) Reforço local imediato — sem esperar rede.
    fire(tipo === "hidratacao" ? "GULP!" : "HIT!");

    // (2) Loop central no servidor.
    let dec: (DecisaoReforco & { logId?: string }) | null = null;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      });
      if (res.ok) dec = await res.json();
    } catch {
      dec = null; // rede caiu — reforço local já ocorreu, segue a vida
    }

    if (dec) {
      setUltimo(
        `+${dec.ganho.total} stamina (base ${dec.ganho.base}` +
          (dec.ganho.bonus ? ` + bônus ${dec.ganho.bonus}` : "") +
          `) · esquema ${dec.esquema}`,
      );

      // (3) Música como bônus por cima — com fallback.
      if (dec.musica) {
        const ok = await tocarUri(dec.musica.uri);
        try {
          await fetch("/api/spotify/mark-played", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              logId: dec.logId,
              faixaId: dec.musica.id,
              tipo: ok ? "faixa_cheia" : "fallback_local",
            }),
          });
        } catch {
          /* histórico falhou; reforço sensorial já entregue */
        }
      }
      router.refresh(); // atualiza o placar
    }
  }

  return (
    <div>
      {overlay}
      <div className="log-row">
        <button className="log-tap" onClick={() => registrar("refeicao")}>
          Registrar refeição
        </button>
        <button
          className="log-tap"
          style={{
            background: "linear-gradient(135deg, var(--neon-2), #0077b6)",
            color: "#001018",
          }}
          onClick={() => registrar("hidratacao")}
        >
          Água
        </button>
      </div>
      {ultimo && (
        <p className="subtle" style={{ marginTop: 10, textAlign: "center" }}>
          {ultimo}
        </p>
      )}
    </div>
  );
}
