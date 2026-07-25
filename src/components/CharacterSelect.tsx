"use client";

// ============================================================
// Hub de seleção — 2 fases (v10):
//   Fase 1 (identidade): retrato do Sanha (avatar do jogador) + botão
//     "Entrar no dojang". Ritual de auto-reconhecimento antes de agir.
//   Fase 2 (mestres): grid dos 5 mestres + 1 slot bloqueado ("em breve").
//     Escolher define o protagonista do dia e leva à home. O domínio do
//     mestre escolhido direciona o foco do dia.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Personagem } from "@/lib/types";
import { LABEL_ATRIBUTO } from "@/lib/comportamentos";
import { LABEL_DOMINIO, LABEL_FAIXA, corDaFaixa } from "@/lib/personagens";
import CharacterImage from "@/components/CharacterImage";
import {
  faixaAtual,
  decodificarFaixaCanonica,
  alcancouCanonica,
  type ProgressoDominio,
} from "@/lib/engine/faixa";

type Phase = "identidade" | "mestres";

export default function CharacterSelect({
  roster,
  avatar,
  progressos = [],
}: {
  roster: Personagem[];
  avatar: Personagem | null;
  progressos?: ProgressoDominio[];
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>(avatar ? "identidade" : "mestres");
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

  // ── Fase 1: identidade do jogador (Sanha) ─────────────────
  if (phase === "identidade" && avatar) {
    return (
      <div style={{ display: "grid", gap: 20, placeItems: "center", padding: "24px 0" }}>
        <div
          className="panel"
          style={{
            maxWidth: 360,
            width: "100%",
            display: "grid",
            gap: 14,
            padding: 24,
            borderColor: "var(--calm)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 160,
              height: 200,
              borderRadius: 12,
              overflow: "hidden",
              margin: "0 auto",
              background: "linear-gradient(160deg, var(--lilac), var(--surface))",
              border: "1px solid var(--hairline)",
              boxShadow: "0 8px 30px var(--kihap-glow)",
            }}
          >
            <CharacterImage
              src={avatar.asset_corpo ?? avatar.asset_rosto}
              nome={avatar.nome}
              fallbackSize="4rem"
            />
          </div>
          <div>
            <h2 className="title-fight" style={{ margin: "0 0 4px", fontSize: "2rem" }}>
              {avatar.nome}
            </h2>
            {avatar.nome_kr && (
              <div
                className="subtle"
                style={{ fontFamily: "var(--font-body)", fontSize: "1.1rem" }}
              >
                {avatar.nome_kr}
              </div>
            )}
            {avatar.titulo && (
              <div className="subtle" style={{ color: "var(--calm)", marginTop: 6 }}>
                {avatar.titulo}
              </div>
            )}
            {avatar.lore && (
              <p
                className="subtle"
                style={{ margin: "12px 0 0", fontStyle: "italic", fontSize: "0.85rem" }}
              >
                {avatar.lore}
              </p>
            )}
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            onClick={() => setPhase("mestres")}
          >
            Entrar no dojang · 시작
          </button>
        </div>
      </div>
    );
  }

  // ── Fase 2: escolher o mestre do dia ──────────────────────
  return (
    <div>
      <h1 className="title-fight" style={{ fontSize: "2rem", margin: "0 0 4px" }}>
        Escolha o mestre de hoje
      </h1>
      <p className="subtle" style={{ marginTop: 0 }}>
        Cada mestre guarda um domínio numa faixa canônica. O escolhido direciona
        o foco do dia (upper, core, lower, dança ou taekwondo).
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

            {/* v10.2: seu progresso no domínio do mestre vs a faixa canônica dele. */}
            {sel.dominio && sel.dominio !== "avatar" && (() => {
              const meu = progressos.find((p) => p.dominio === sel.dominio);
              if (!meu) return null;
              const minha = faixaAtual(meu);
              const alvo = decodificarFaixaCanonica(sel.faixa_canonica);
              const bateu = alcancouCanonica({ kup: meu.kup, dan: meu.dan }, alvo);
              return (
                <div
                  className="panel"
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderColor: bateu ? "var(--kihap)" : "var(--hairline)",
                    background: "color-mix(in srgb, var(--surface) 96%, transparent)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.7rem",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                        color: "var(--ink-dim)",
                      }}
                    >
                      Sua faixa em {LABEL_DOMINIO[sel.dominio] ?? sel.dominio}
                    </span>
                    {bateu ? (
                      <span
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.66rem",
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: "var(--kihap)",
                          fontWeight: 800,
                        }}
                      >
                        ✓ desafiável
                      </span>
                    ) : (
                      <span
                        className="subtle"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.66rem",
                        }}
                      >
                        alvo · {LABEL_FAIXA[sel.faixa_canonica ?? ""] ?? sel.faixa_canonica}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: 4, fontWeight: 700 }}>
                    {minha.rotulo}
                  </div>
                  {!minha.atingiuMaxima && (
                    <>
                      <div className="xp-bar" style={{ marginTop: 6 }}>
                        <div
                          className="xp-fill"
                          style={{ width: `${minha.pctPraProxima}%` }}
                        />
                      </div>
                      <div
                        className="subtle"
                        style={{ marginTop: 4, fontSize: "0.68rem", fontFamily: "var(--font-mono)" }}
                      >
                        {minha.xpNoNivel} / {minha.xpPraProxima} xp no domínio
                      </div>
                    </>
                  )}
                  <div
                    className="subtle"
                    style={{ marginTop: 6, fontSize: "0.7rem", fontStyle: "italic" }}
                  >
                    Log com {sel.nome} como mestre do dia → XP soma aqui.
                  </div>
                </div>
              );
            })()}

            {sel.atributo_foco && (
              <p style={{ margin: "10px 0 6px" }}>
                Atributo: <strong>{LABEL_ATRIBUTO[sel.atributo_foco]}</strong>
              </p>
            )}
            {sel.atributo_foco && sel.bonus && (
              <p style={{ margin: "0 0 8px", color: "var(--belt-gold)" }}>
                Bônus: +{Math.round(sel.bonus.valor * 100)}%{" "}
                {LABEL_ATRIBUTO[sel.atributo_foco]} no dia em que é o mestre.
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

        {/* 1 slot bloqueado — placeholder pro próximo mestre ("em breve"). */}
        <div
          className="roster-cell locked"
          aria-hidden
          title="Em breve — próximo mestre"
        >
          <div className="lock-badge">
            <span className="lock-ico">🔒</span>
            <span style={{ fontSize: "0.6rem", opacity: 0.7 }}>em breve</span>
          </div>
        </div>
      </div>
    </div>
  );
}
