"use client";

// Timer de descanso FLUTUANTE, baseado em RELÓGIO (não em contador): guarda o
// horário de término, então não perde tempo ao minimizar — ao voltar mostra o
// restante real ou "acabou". Persiste em localStorage (sobrevive a reload).
// Ao zerar: bip + notificação do sistema (avisa fora do app, se permitido).
// É ferramenta de treino — não é reforço.
import { useCallback, useEffect, useRef, useState } from "react";
import { TEMPOS_DESCANSO } from "@/lib/treino";
import {
  agendarDescanso,
  cancelarDescanso,
  notifPermitida,
  notifSuportada,
  notificarDescanso,
  pedirPermissaoNotif,
} from "@/lib/notificacao";

const KEY = "quest_rest_fim";

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
  const [fimEm, setFimEm] = useState<number | null>(null);
  const [restante, setRestante] = useState(0);
  const [aberto, setAberto] = useState(false);
  const [notifBloqueada, setNotifBloqueada] = useState(false);
  const disparou = useRef(false);
  const usouTrigger = useRef(false);

  // Restaura um descanso em andamento ao montar (continua de onde parou).
  useEffect(() => {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const f = Number(raw);
      if (Number.isFinite(f) && f > Date.now()) setFimEm(f);
      else localStorage.removeItem(KEY);
    }
    if (notifSuportada() && Notification.permission === "denied") {
      setNotifBloqueada(true);
    }
  }, []);

  // Loop de relógio: recalcula o restante a partir do horário de término.
  useEffect(() => {
    if (!fimEm) {
      setRestante(0);
      return;
    }
    disparou.current = false;
    const tick = () => {
      const r = Math.max(0, Math.ceil((fimEm - Date.now()) / 1000));
      setRestante(r);
      if (r <= 0 && !disparou.current) {
        disparou.current = true;
        bip();
        // Se a notificação foi AGENDADA (trigger), ela mesma dispara — não
        // duplica aqui. Senão, mostra agora (app vivo/ao voltar).
        if (!usouTrigger.current) void notificarDescanso();
        localStorage.removeItem(KEY);
        setFimEm(null);
      }
    };
    tick();
    const id = setInterval(tick, 250);
    // Ao voltar pro app, recalcula na hora (não espera o próximo tick).
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [fimEm]);

  const iniciar = useCallback(async (seg: number) => {
    const fim = Date.now() + seg * 1000;
    localStorage.setItem(KEY, String(fim));
    setFimEm(fim); // começa a contar já

    // Notificação (best-effort): pede permissão e tenta AGENDAR pro horário.
    const ok = await pedirPermissaoNotif();
    setNotifBloqueada(notifSuportada() && Notification.permission === "denied");
    usouTrigger.current = ok ? await agendarDescanso(fim) : false;
  }, []);

  const cancelar = useCallback(() => {
    void cancelarDescanso();
    localStorage.removeItem(KEY);
    setFimEm(null);
    setAberto(false);
  }, []);

  const contando = restante > 0 && fimEm != null;

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
            onClick={() => iniciar(t)}
          >
            {t}
          </button>
        ))}
        <button
          className="nav-link"
          style={{ padding: "6px 8px", fontSize: "0.72rem", color: "var(--neon)" }}
          onClick={cancelar}
          aria-label={contando ? "Cancelar" : "Fechar"}
        >
          ✕
        </button>
      </div>
      {notifBloqueada && (
        <p className="subtle" style={{ fontSize: "0.6rem", textAlign: "center", margin: "6px 0 0" }}>
          Ative as notificações p/ avisar fora do app
        </p>
      )}
      {!notifBloqueada && !notifPermitida() && contando && (
        <p className="subtle" style={{ fontSize: "0.6rem", textAlign: "center", margin: "6px 0 0" }}>
          Permita a notificação p/ avisar minimizado
        </p>
      )}
    </div>
  );
}
