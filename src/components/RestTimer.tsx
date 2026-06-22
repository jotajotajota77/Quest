"use client";

// Timer de descanso FLUTUANTE global. 60/90/120/180s. Toca um bip leve (local)
// ao zerar. É ferramenta de treino — não é reforço.
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

  return (
    <div
      style={{
        position: "fixed",
        right: 14,
        bottom: 70,
        zIndex: 40,
        background: "rgba(20,10,36,0.95)",
        border: "1px solid var(--panel-border)",
        borderRadius: 14,
        padding: 10,
        boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 6 }}>
        <span
          className="title-fight"
          style={{ fontSize: restante > 0 ? "1.4rem" : "0.8rem" }}
        >
          {restante > 0 ? `${restante}s` : "descanso"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 4 }}>
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
        {restante > 0 && (
          <button
            className="nav-link"
            style={{ padding: "6px 8px", fontSize: "0.72rem", color: "var(--neon)" }}
            onClick={() => setRestante(0)}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
