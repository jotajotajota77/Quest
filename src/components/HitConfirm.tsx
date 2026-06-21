"use client";

// ============================================================
// Hit-confirm sensorial LOCAL — som + animação, atraso zero. (TRAVA)
// ------------------------------------------------------------
// NÃO depende de rede/API/Spotify. É o PISO do reforço: dispara no instante
// do toque, antes de qualquer chamada ao servidor. O som é sintetizado via
// WebAudio (sem arquivo a baixar) → zero latência, funciona offline.
// ============================================================

import { useCallback, useEffect, useRef, useState } from "react";

/** Toca um "hit-spark"/stinger curto sintetizado — sem rede, sem assets. */
function tocarStinger() {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    // Camada 1: "punch" grave com pitch caindo.
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.35, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.24);

    // Camada 2: "sparkle" agudo (brilho K-pop).
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(1760, now);
    osc2.frequency.exponentialRampToValueAtTime(2640, now + 0.12);
    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.16, now + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc2.connect(gain2).connect(ctx.destination);
    osc2.start(now);
    osc2.stop(now + 0.2);

    setTimeout(() => ctx.close().catch(() => {}), 400);
  } catch {
    // WebAudio indisponível: a animação visual ainda dispara. Reforço não cai a zero.
  }
}

export interface HitConfirmHandle {
  fire: (texto?: string) => void;
}

/**
 * Hook imperativo: chame `fire()` no instante do toque. Devolve o overlay para
 * renderizar e a função disparadora.
 */
export function useHitConfirm() {
  const [burst, setBurst] = useState<{ id: number; texto: string } | null>(
    null,
  );
  const idRef = useRef(0);

  const fire = useCallback((texto = "HIT!") => {
    tocarStinger(); // som local imediato
    idRef.current += 1;
    setBurst({ id: idRef.current, texto });
  }, []);

  useEffect(() => {
    if (!burst) return;
    const t = setTimeout(() => setBurst(null), 650);
    return () => clearTimeout(t);
  }, [burst]);

  const overlay = burst ? (
    <>
      <div className="hit-flash" key={`f-${burst.id}`} />
      <div className="hit-overlay" key={`o-${burst.id}`}>
        <div className="hit-spark">{burst.texto}</div>
      </div>
    </>
  ) : null;

  return { fire, overlay };
}
