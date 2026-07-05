"use client";

// Painel de Objetivos Físicos na aba Treino — ÊNFASE/tooling, não reforço nem
// prescrição. Prioridade de treino + bloco corretivo postural (colapsável).
import { useState } from "react";
import { BLOCO_POSTURAL, OBJETIVOS } from "@/lib/objetivos";

export default function ObjetivosTreino() {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="panel" style={{ marginTop: 18, borderColor: "var(--gold)" }}>
      <div className="lbl">Foco físico · ênfase</div>
      <div style={{ fontWeight: 800, marginTop: 4 }}>{OBJETIVOS.prioridade}</div>
      <p className="subtle" style={{ margin: "6px 0 0" }}>
        Fortes: {OBJETIVOS.fortes.join(", ")}. A desenvolver: {OBJETIVOS.desenvolver.join(", ")}.
      </p>
      <p className="subtle" style={{ margin: "6px 0 0" }}>{OBJETIVOS.postura}</p>

      <button
        className="nav-link"
        style={{ marginTop: 10, padding: "6px 10px", fontSize: "0.75rem" }}
        onClick={() => setAberto((v) => !v)}
      >
        {aberto ? "Ocultar" : "Ver"} bloco corretivo postural
      </button>

      {aberto && (
        <div style={{ marginTop: 10 }}>
          {BLOCO_POSTURAL.map((e) => (
            <div className="set-row" key={e.nome}>
              <span style={{ flex: 1, fontWeight: 700 }}>{e.nome}</span>
              <span className="subtle" style={{ fontSize: "0.72rem", flex: "1 1 auto", textAlign: "right" }}>
                {e.foco}
              </span>
            </div>
          ))}
          <p className="subtle" style={{ margin: "8px 0 0", fontSize: "0.72rem" }}>
            Encaixa 1–2 desses por sessão. É ênfase, não obrigação — o registro segue 1-toque.
          </p>
        </div>
      )}
    </div>
  );
}
