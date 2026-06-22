"use client";

// ============================================================
// Botões de registro 1-TOQUE — camada universal + áudio assimétrico.
// ------------------------------------------------------------
// Ordem TRAVADA:
//   1. Hit-confirm LOCAL dispara JÁ (som+animação), antes de qualquer rede.
//   2. POST /api/log aplica ganho/atributo e devolve a decisão de áudio.
//   3. Áudio conforme a família:
//        - 'reward' (Nutri): toca faixa cheia; marca faixa_cheia/fallback_local.
//        - 'trilha' (Dança): toca como trilha; NÃO marca (não esmaece).
//        - null (Treino/Leitura): sem música — o hit-confirm já reforçou.
// O reforço NUNCA cai a zero: o passo 1 independe de tudo.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Comportamento, DecisaoReforco } from "@/lib/types";
import { useHitConfirm } from "@/components/HitConfirm";
import { tocarUri } from "@/lib/spotify/playback";

export interface AcaoLog {
  comportamento: Comportamento;
  label: string;
  hit: string; // texto do hit-confirm
  cor?: string; // gradiente opcional
}

export default function LogButtons({ acoes }: { acoes: AcaoLog[] }) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function registrar(acao: AcaoLog) {
    setOcupado(true);
    // (1) Reforço local imediato — sem esperar rede.
    fire(acao.hit);

    let dec: DecisaoReforco | null = null;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamento: acao.comportamento }),
      });
      if (res.ok) dec = await res.json();
    } catch {
      dec = null; // rede caiu — reforço local já ocorreu
    }

    if (dec) {
      setUltimo(
        `+${dec.ganho.total} ${dec.atributo} (base ${dec.ganho.base}` +
          (dec.ganho.bonus ? ` + bônus ${dec.ganho.bonus}` : "") +
          ")" +
          (dec.esquema ? ` · esquema ${dec.esquema}` : ""),
      );

      // (3) Áudio assimétrico.
      if (dec.musica && dec.modoAudio) {
        const ok = await tocarUri(dec.musica.uri);
        if (dec.modoAudio === "reward") {
          // Só a Nutri marca histórico (controla nova-no-sistema + fading).
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
        // 'trilha' (Dança): não marca — a faixa não é recompensa esmaecível.
      }
      router.refresh();
    }
    setOcupado(false);
  }

  return (
    <div>
      {overlay}
      <div className={acoes.length > 1 ? "log-row" : ""}>
        {acoes.map((a) => (
          <button
            key={a.comportamento}
            className="log-tap"
            disabled={ocupado}
            style={a.cor ? { background: a.cor, color: "#001018" } : undefined}
            onClick={() => registrar(a)}
          >
            {a.label}
          </button>
        ))}
      </div>
      {ultimo && (
        <p className="subtle" style={{ marginTop: 10, textAlign: "center" }}>
          {ultimo}
        </p>
      )}
    </div>
  );
}
