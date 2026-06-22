"use client";

// Hero contextual do personagem (em ação / representando o atributo). Tenta os
// candidatos na ordem e cai num placeholder neutro se nenhum carregar — nunca
// quebra o layout. Ao TOCAR, abre a "dica do dia" que o personagem te dá.
import { useState } from "react";

export default function ContextualHero({
  candidatos,
  nome,
  titulo,
  dica,
  altura = 200,
}: {
  candidatos: string[];
  nome: string;
  titulo?: string | null;
  dica?: string | null;
  altura?: number;
}) {
  const [i, setI] = useState(0);
  const [aberto, setAberto] = useState(false);
  const src = candidatos[i];
  const clicavel = Boolean(dica);

  return (
    <>
      <div
        className="hero-contexto"
        style={{ height: altura, cursor: clicavel ? "pointer" : "default" }}
        aria-label={`${nome} em ação`}
        role={clicavel ? "button" : undefined}
        onClick={clicavel ? () => setAberto(true) : undefined}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={nome} onError={() => setI((n) => n + 1)} />
        ) : (
          <div className="hero-silhueta">
            <span>{nome}</span>
          </div>
        )}
        {clicavel && <span className="hero-dica-badge">💬 dica do dia</span>}
      </div>

      {aberto && dica && (
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
          onClick={() => setAberto(false)}
        >
          <div
            className="panel"
            style={{ maxWidth: 420, borderColor: "var(--neon)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lbl">{nome}{titulo ? ` · ${titulo}` : ""}</div>
            <p style={{ margin: "8px 0 0", fontSize: "1.05rem", lineHeight: 1.4 }}>
              “{dica}”
            </p>
            <p className="subtle" style={{ margin: "10px 0 0", fontSize: "0.72rem" }}>
              dica do dia
            </p>
            <button
              className="btn"
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => setAberto(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
