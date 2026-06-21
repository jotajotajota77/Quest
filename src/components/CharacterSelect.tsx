"use client";

// ============================================================
// Hub de seleção estilo tela de luta (MK/SF). (TRAVA de UX)
// ------------------------------------------------------------
//  * Grid mostra só o ROSTO (retrato).
//  * Clicar revela o CORPO inteiro + nome/info/bônus.
//  * Confirmar define o protagonista do dia e leva à home.
//  * Seleção 100% LIVRE — sem recomendação, sem bloqueio, sem "sugerido".
//  * Aceita roster maior sem refac (mapeia o array recebido).
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Personagem } from "@/lib/types";

export default function CharacterSelect({
  roster,
}: {
  roster: Personagem[];
}) {
  const router = useRouter();
  const [selId, setSelId] = useState<string | null>(roster[0]?.id ?? null);
  const [confirmando, setConfirmando] = useState(false);

  const sel = roster.find((p) => p.id === selId) ?? null;

  async function confirmar() {
    if (!sel) return;
    setConfirmando(true);
    try {
      await fetch("/api/selecao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ personagemId: sel.id }),
      });
      router.push("/home");
    } finally {
      setConfirmando(false);
    }
  }

  return (
    <div>
      <h1 className="title-fight" style={{ fontSize: "2rem", margin: "0 0 4px" }}>
        Selecione o protagonista
      </h1>
      <p className="subtle" style={{ marginTop: 0 }}>
        Escolha livre. Nenhum personagem é sugerido ou bloqueado.
      </p>

      {/* Reveal do corpo inteiro + info do selecionado */}
      {sel && (
        <div className="reveal" style={{ margin: "18px 0" }}>
          <div className="reveal-body">
            {sel.asset_corpo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sel.asset_corpo} alt={sel.nome} />
            ) : (
              <span className="roster-face-fallback" style={{ fontSize: "4rem" }}>
                {inicial(sel.nome)}
              </span>
            )}
          </div>
          <div className="panel">
            <h2 style={{ margin: "0 0 6px" }}>{sel.nome}</h2>
            <p className="subtle" style={{ marginTop: 0 }}>
              Foco: <strong>{sel.atributo_foco}</strong> · Alvo:{" "}
              <strong>{sel.comportamento_alvo}</strong>
            </p>
            <p style={{ margin: "8px 0" }}>
              Bônus aditivo: <strong>+{sel.bonus.magnitude}</strong> ao registrar{" "}
              {sel.comportamento_alvo}
            </p>
            <p className="subtle">
              {sel.lore ?? "Sem lore ainda — adicione depois."}
            </p>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 8 }}
              onClick={confirmar}
              disabled={confirmando}
            >
              {confirmando ? "Confirmando…" : "Confirmar e jogar"}
            </button>
          </div>
        </div>
      )}

      {/* Grid de rostos */}
      <div className="roster-grid">
        {roster.map((p) => (
          <button
            key={p.id}
            className={`roster-cell ${p.id === selId ? "selected" : ""}`}
            onClick={() => setSelId(p.id)}
            title={p.nome}
          >
            {p.asset_rosto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="roster-face" src={p.asset_rosto} alt={p.nome} />
            ) : (
              <span className="roster-face-fallback">{inicial(p.nome)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || "?";
}
