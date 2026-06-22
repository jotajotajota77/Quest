"use client";

// ============================================================
// Hub de seleção estilo tela de luta (MK/SF). (TRAVA 4)
// ------------------------------------------------------------
//  * Grid mostra só o ROSTO (retrato).
//  * Clicar revela o CORPO inteiro + nome + título + atributo/bônus + bio/lore.
//  * Confirmar define o protagonista do dia e leva à home.
//  * Seleção 100% LIVRE — os 4 desbloqueados, sem recomendação nem bloqueio.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Personagem } from "@/lib/types";
import { LABEL_ATRIBUTO } from "@/lib/comportamentos";
import CharacterImage from "@/components/CharacterImage";

export default function CharacterSelect({ roster }: { roster: Personagem[] }) {
  const router = useRouter();
  const [selId, setSelId] = useState<string | null>(
    roster.find((p) => p.desbloqueado)?.id ?? null,
  );
  const [confirmando, setConfirmando] = useState(false);

  const sel = roster.find((p) => p.id === selId && p.desbloqueado) ?? null;

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
        Escolha livre. Os quatro estão desbloqueados — nenhum é sugerido ou
        bloqueado. O bônus (+25%) é só identidade.
      </p>

      {sel && (
        <div className="reveal" style={{ margin: "18px 0" }}>
          <div className="reveal-body">
            <CharacterImage src={sel.asset_corpo} nome={sel.nome} fallbackSize="4rem" />
          </div>
          <div className="panel">
            <h2 style={{ margin: "0 0 2px" }}>{sel.nome}</h2>
            {sel.titulo && (
              <div className="subtle" style={{ color: "var(--neon-2)" }}>
                {sel.titulo}
              </div>
            )}
            {sel.atributo_foco && (
              <p style={{ margin: "10px 0 6px" }}>
                Atributo: <strong>{LABEL_ATRIBUTO[sel.atributo_foco]}</strong>
              </p>
            )}
            {sel.atributo_foco && sel.bonus && (
              <p style={{ margin: "0 0 8px", color: "var(--gold)" }}>
                Bônus: +{Math.round(sel.bonus.valor * 100)}%{" "}
                {LABEL_ATRIBUTO[sel.atributo_foco]} no dia em que é protagonista.
              </p>
            )}
            {sel.bio && <p className="subtle" style={{ margin: "8px 0" }}>{sel.bio}</p>}
            {sel.lore && (
              <p className="subtle" style={{ margin: "8px 0", fontStyle: "italic" }}>
                {sel.lore}
              </p>
            )}
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

      <div className="roster-grid">
        {roster.map((p) =>
          p.desbloqueado ? (
            <button
              key={p.id}
              className={`roster-cell ${p.id === selId ? "selected" : ""}`}
              onClick={() => setSelId(p.id)}
              title={p.nome}
            >
              <CharacterImage src={p.asset_rosto} nome={p.nome} className="roster-face" />
            </button>
          ) : (
            <div key={p.id} className="roster-cell locked" title="Em breve">
              <div className="lock-badge">
                <span className="lock-ico">🔒</span>
                <span>EM BREVE</span>
              </div>
            </div>
          ),
        )}
      </div>
      <p className="subtle" style={{ marginTop: 10 }}>
        🔒 5 slots a desbloquear — novos operadores a caminho.
      </p>
    </div>
  );
}
