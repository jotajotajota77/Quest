"use client";

// ============================================================
// Hub de seleção estilo tela de luta (MK/SF). (TRAVA 4)
// ------------------------------------------------------------
//  * Grid mostra o ROSTO (retrato) + tag do domínio.
//  * Clicar revela o CORPO inteiro + nome (+ KR) + título + faixa canônica +
//    domínio + inspiração + bio/lore.
//  * Confirmar define o protagonista do dia e leva à home.
//  * v10: 5 mestres (Braços · Abs · Pernas · Dança · Taekwondo), cada um
//    guardando um domínio numa faixa canônica. Sanha (avatar do jogador) é
//    filtrado no /hub/page.tsx — aparece só no Espelho.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Personagem } from "@/lib/types";
import { LABEL_ATRIBUTO } from "@/lib/comportamentos";
import { LABEL_DOMINIO, LABEL_FAIXA, corDaFaixa } from "@/lib/personagens";
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
        Escolha livre. Todos estão desbloqueados — nenhum é sugerido ou
        bloqueado. O bônus (+25%) é só identidade.
      </p>

      {sel && (
        <div className="reveal" style={{ margin: "18px 0" }}>
          <div className="reveal-body">
            <CharacterImage src={sel.asset_corpo} nome={sel.nome} fallbackSize="4rem" />
          </div>
          <div className="panel">
            <h2 style={{ margin: "0 0 2px" }}>
              {sel.nome}
              {sel.nome_kr && (
                <span
                  className="subtle"
                  style={{ marginLeft: 8, fontSize: "0.72em", fontWeight: 500 }}
                >
                  {sel.nome_kr}
                </span>
              )}
            </h2>
            {sel.titulo && (
              <div className="subtle" style={{ color: "var(--calm)" }}>
                {sel.titulo}
              </div>
            )}

            {sel.dominio && sel.dominio !== "avatar" && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
                <span
                  className="muscle-badge"
                  style={{ color: "var(--kihap)", borderColor: "var(--kihap)" }}
                >
                  Mestre · {LABEL_DOMINIO[sel.dominio] ?? sel.dominio}
                </span>
                {sel.faixa_canonica && (
                  <span
                    className="muscle-badge"
                    style={{
                      background: corDaFaixa(sel.faixa_canonica),
                      color:
                        sel.faixa_canonica.startsWith("preta") ||
                        sel.faixa_canonica.startsWith("azul") ||
                        sel.faixa_canonica.startsWith("vermelha") ||
                        sel.faixa_canonica.startsWith("verde")
                          ? "#fff"
                          : "var(--ink)",
                      borderColor: "transparent",
                    }}
                  >
                    {LABEL_FAIXA[sel.faixa_canonica] ?? sel.faixa_canonica}
                  </span>
                )}
              </div>
            )}

            {sel.atributo_foco && (
              <p style={{ margin: "10px 0 6px" }}>
                Atributo: <strong>{LABEL_ATRIBUTO[sel.atributo_foco]}</strong>
              </p>
            )}
            {sel.atributo_foco && sel.bonus && (
              <p style={{ margin: "0 0 8px", color: "var(--belt-gold)" }}>
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
            {sel.inspiracao && (
              <p
                className="subtle"
                style={{ margin: "6px 0 0", fontSize: "0.72rem", opacity: 0.7 }}
              >
                inspirado em · {sel.inspiracao}
              </p>
            )}
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 12 }}
              onClick={confirmar}
              disabled={confirmando}
            >
              {confirmando ? "Confirmando…" : "Confirmar e jogar"}
            </button>
          </div>
        </div>
      )}

      <div className="roster-grid">
        {roster.map((p) => (
          <button
            key={p.id}
            className={`roster-cell ${p.id === selId ? "selected" : ""}`}
            onClick={() => setSelId(p.id)}
            title={p.nome}
            style={{ position: "relative" }}
          >
            <CharacterImage src={p.asset_rosto} nome={p.nome} className="roster-face" />
            {p.dominio && p.dominio !== "avatar" && (
              <span
                style={{
                  position: "absolute",
                  bottom: 4,
                  left: 4,
                  right: 4,
                  padding: "3px 6px",
                  borderRadius: 6,
                  fontFamily: "var(--font-mono)",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  background: "color-mix(in srgb, var(--ground) 82%, transparent)",
                  color: "var(--ink)",
                  textAlign: "center",
                  backdropFilter: "blur(4px)",
                }}
              >
                {LABEL_DOMINIO[p.dominio] ?? p.dominio}
              </span>
            )}
            {p.faixa_canonica && (
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  top: 4,
                  right: 4,
                  width: 22,
                  height: 4,
                  borderRadius: 2,
                  background: corDaFaixa(p.faixa_canonica),
                  boxShadow: "0 0 0 1px var(--hairline)",
                }}
                title={LABEL_FAIXA[p.faixa_canonica] ?? p.faixa_canonica}
              />
            )}
          </button>
        ))}

        {/* 4 slots bloqueados — placeholders pros mestres futuros. */}
        {[0, 1, 2, 3].map((i) => (
          <div
            key={`locked-${i}`}
            className="roster-cell locked"
            aria-hidden
            title="Slot bloqueado — mestre a ser adicionado"
          >
            <div className="lock-badge">
              <span className="lock-ico">🔒</span>
              <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>
                slot bloqueado
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
