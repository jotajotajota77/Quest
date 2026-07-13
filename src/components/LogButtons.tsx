"use client";

// ============================================================
// Botões de registro 1-TOQUE — camada universal + áudio assimétrico.
// + Afinamento: jackpot de comeback, registro rico opcional (coach, gated),
//   e long-press com o "porquê" científico (educação ABA, opt-in).
// O 1-toque continua sendo o piso; tudo extra é opcional e nunca o bloqueia.
// ============================================================

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Comportamento, DecisaoReforco } from "@/lib/types";
import { useHitConfirm } from "@/components/HitConfirm";
import { tocarUri } from "@/lib/spotify/playback";

export interface AcaoLog {
  comportamento: Comportamento;
  label: string;
  hit: string;
  cor?: string;
}

const ehNutri = (c: Comportamento) =>
  c === "nutri_refeicao" || c === "nutri_agua";

export default function LogButtons({
  acoes,
  coachAtivo = false,
  abaPorque,
}: {
  acoes: AcaoLog[];
  coachAtivo?: boolean;
  abaPorque?: string;
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [ultimo, setUltimo] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [macroPara, setMacroPara] = useState<string | null>(null);
  const [macros, setMacros] = useState({ kcal: "", proteina: "", carbs: "", gordura: "" });
  const [abaAberta, setAbaAberta] = useState(false);

  const longRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function startPress() {
    longRef.current = false;
    if (!abaPorque) return;
    timerRef.current = setTimeout(() => {
      longRef.current = true;
      setAbaAberta(true);
    }, 550);
  }
  function endPress() {
    if (timerRef.current) clearTimeout(timerRef.current);
  }

  async function registrar(acao: AcaoLog) {
    if (longRef.current) {
      longRef.current = false;
      return; // foi long-press (abriu o "porquê"), não registra
    }
    setOcupado(true);
    fire(acao.hit); // (1) reforço local imediato

    let dec: DecisaoReforco | null = null;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamento: acao.comportamento }),
      });
      if (res.ok) dec = await res.json();
    } catch {
      dec = null;
    }

    if (dec) {
      if (dec.jackpot) fire("JACKPOT!");
      setUltimo(
        `+${dec.ganho.total} ${dec.atributo}` +
          (dec.jackpot ? ` · 🎰 +${dec.jackpot.xp} XP (${dec.jackpot.rotulo})` : ""),
      );

      // Coach (gated): oferece registro rico OPCIONAL do log de Nutri recém-criado.
      if (coachAtivo && ehNutri(acao.comportamento) && dec.logId) {
        setMacroPara(dec.logId);
      }

      if (dec.musica && dec.modoAudio) {
        const ok = await tocarUri(dec.musica.uri);
        if (dec.modoAudio === "reward") {
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
            /* histórico falhou; reforço já entregue */
          }
        }
      }
      router.refresh();
    }
    setOcupado(false);
  }

  async function salvarMacros() {
    if (!macroPara) return;
    await fetch("/api/log/macros", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        logId: macroPara,
        kcal: macros.kcal ? Number(macros.kcal) : undefined,
        proteina: macros.proteina ? Number(macros.proteina) : undefined,
        carbs: macros.carbs ? Number(macros.carbs) : undefined,
        gordura: macros.gordura ? Number(macros.gordura) : undefined,
      }),
    }).catch(() => {});
    setMacroPara(null);
    setMacros({ kcal: "", proteina: "", carbs: "", gordura: "" });
    router.refresh();
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
            onPointerDown={startPress}
            onPointerUp={endPress}
            onPointerLeave={endPress}
          >
            {a.label}
          </button>
        ))}
      </div>

      {abaPorque && (
        <p className="subtle" style={{ textAlign: "center", marginTop: 6, fontSize: "0.7rem" }}>
          (segure o botão para o porquê científico)
        </p>
      )}

      {ultimo && (
        <p className="subtle" style={{ marginTop: 10, textAlign: "center" }}>
          {ultimo}
        </p>
      )}

      {/* Registro rico OPCIONAL (coach gated) — nunca bloqueia o 1-toque. */}
      {macroPara && (
        <div className="panel" style={{ marginTop: 12, borderColor: "var(--gold)" }}>
          <div className="lbl" style={{ marginBottom: 8 }}>
            Coach (opcional) — anexar macros a este registro
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {(["kcal", "proteina", "carbs", "gordura"] as const).map((k) => (
              <input
                key={k}
                type="number"
                placeholder={k}
                value={macros[k]}
                onChange={(e) => setMacros((s) => ({ ...s, [k]: e.target.value }))}
                style={{
                  width: 80,
                  padding: 8,
                  borderRadius: 8,
                  border: "1px solid var(--panel-border)",
                  background: "rgba(0,0,0,0.25)",
                  color: "var(--text)",
                }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button className="btn btn-primary" onClick={salvarMacros}>
              Salvar macros
            </button>
            <button className="btn" onClick={() => setMacroPara(null)}>
              Pular
            </button>
          </div>
        </div>
      )}

      {/* "Porquê" científico (ABA) — revelado por long-press. */}
      {abaAberta && abaPorque && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 18,
          }}
          onClick={() => setAbaAberta(false)}
        >
          <div className="panel" style={{ maxWidth: 380 }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Por que isso funciona</h3>
            <p className="subtle">{abaPorque}</p>
            <button className="btn" style={{ width: "100%" }} onClick={() => setAbaAberta(false)}>
              Entendi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
