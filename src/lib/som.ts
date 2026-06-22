// Sons curtos via Web Audio (sem assets). Tocados a partir de um gesto do
// usuário (toque no ✓), então o iOS libera o áudio. Falham em silêncio.
function tocarTom(freqs: number[], durMs = 130) {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    const dur = durMs / 1000;
    let t = ctx.currentTime;
    for (const f of freqs) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.32, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ctx.destination);
      o.start(t);
      o.stop(t + dur);
      t += dur;
    }
    setTimeout(() => ctx.close().catch(() => {}), freqs.length * durMs + 250);
  } catch {
    /* sem áudio: o reforço visual acontece mesmo assim */
  }
}

/** Tom curto de confirmação ao registrar uma série. */
export const somSerie = () => tocarTom([620], 80);

/** Arpejo ascendente de PR / top set (recorde igualado ou superado). */
export const somPr = () => tocarTom([660, 880, 1175], 120);

/** Tom positivo ao registrar comida SAUDÁVEL (reforço imediato). */
export const somComida = () => tocarTom([700, 1050], 110);
