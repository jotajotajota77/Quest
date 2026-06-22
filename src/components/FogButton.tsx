"use client";

// ============================================================
// Modo Névoa — "⊘ Não consigo hoje". (TRAVA névoa, NÃO-NEGOCIÁVEL)
// ------------------------------------------------------------
// Modal com perguntas BINÁRIAS (mínimo input). Marcar névoa preserva o streak
// e é neutro ao motor. Tom sem julgamento. Não é formulário de dados — é uma
// afordância de auto-compaixão.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";

const PERGUNTAS = [
  "Bebeu água hoje?",
  "Se moveu ou respirou fundo?",
  "Saiu da cama?",
];

export default function FogButton({ jaEhNevoa }: { jaEhNevoa: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function confirmar() {
    setEnviando(true);
    try {
      await fetch("/api/fog", { method: "POST" });
      setAberto(false);
      router.refresh();
    } finally {
      setEnviando(false);
    }
  }

  if (jaEhNevoa) {
    return (
      <div className="panel" style={{ borderColor: "#5a6b8c", textAlign: "center" }}>
        <strong style={{ color: "#9fb3d4" }}>Modo névoa ativo hoje</strong>
        <p className="subtle" style={{ margin: "4px 0 0" }}>
          Recolhimento declarado. Streak protegido. Sem julgamento.
        </p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", marginTop: 8 }}>
      <button
        className="nav-link"
        style={{ borderColor: "#5a6b8c", color: "#9fb3d4" }}
        onClick={() => setAberto(true)}
      >
        ⊘ Não consigo hoje (modo névoa)
      </button>

      {aberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 18,
          }}
          onClick={() => setAberto(false)}
        >
          <div
            className="panel"
            style={{ maxWidth: 380, textAlign: "left" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Dia de névoa</h3>
            <p className="subtle">
              Tudo bem recolher. Nada disso é obrigatório — só um respiro:
            </p>
            <ul style={{ lineHeight: 1.9 }}>
              {PERGUNTAS.map((p) => (
                <li key={p} className="subtle">
                  {p}
                </li>
              ))}
            </ul>
            <p className="subtle" style={{ fontStyle: "italic" }}>
              Marcar névoa preserva seu streak e não conta contra você.
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={confirmar}
              disabled={enviando}
            >
              {enviando ? "…" : "Declarar dia de névoa"}
            </button>
            <button
              className="btn"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => setAberto(false)}
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
