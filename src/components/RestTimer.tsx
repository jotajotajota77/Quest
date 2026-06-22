"use client";

// Timer de descanso FLUTUANTE. 60/90/120/180s. Toca um bip leve ao zerar.
// É ferramenta de treino — não é reforço. Recolhível: parado vira uma pílula
// pequena (não cobre conteúdo nem a nav); só expande ao tocar ou ao contar.
import { useEffect, useRef, useState } from "react";
import { TEMPOS_DESCANSO } from "@/lib/treino";

function bip() {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.5);
    setTimeout(() => ctx.close().catch(() => {}), 700);
  } catch {
    /* sem áudio: o visual zera mesmo assim */
  }
}

export default function RestTimer() {
  const [restante, setRestante] = useState(0);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (restante <= 0) {
      if (ref.current) clearInterval(ref.current);
      return;
    }
    ref.current = setInterval(() => {
      setRestante((r) => {
        if (r <= 1) {
          if (ref.current) clearInterval(ref.current);
          bip();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => {
      if (ref.current) clearInterval(ref.current);
    };
  }, [restante > 0]); // reinicia o intervalo só quando liga/desliga

  const contando = restante > 0;

  // Parado e recolhido: só a pílula compacta (sem cobrir conteúdo/nav).
  if (!contando && !aberto) {
    return (
      <button className="rest-fab" onClick={() => setAberto(true)} aria-label="Timer de descanso">
        ⏱ descanso
      </button>
    );
  }

  return (
    <div className="rest-timer">
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <span className="title-fight" style={{ fontSize: contando ? "1.5rem" : "0.78rem" }}>
          {contando ? `${restante}s` : "descanso"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", justifyContent: "center" }}>
        {TEMPOS_DESCANSO.map((t) => (
          <button
            key={t}
            className="nav-link"
            style={{ padding: "6px 8px", fontSize: "0.72rem" }}
            onClick={() => setRestante(t)}
          >
            {t}
          </button>
        ))}
        <button
          className="nav-link"
          style={{ padding: "6px 8px", fontSize: "0.72rem", color: "var(--neon)" }}
          onClick={() => {
            setRestante(0);
            setAberto(false);
          }}
          aria-label={contando ? "Cancelar" : "Fechar"}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
