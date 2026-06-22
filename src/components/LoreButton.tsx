"use client";

// Lore em modal — IDENTIDADE, não engine diária. Acesso opcional, sem atrito.
import { useState } from "react";
import type { Personagem } from "@/lib/types";

export default function LoreButton({ personagem }: { personagem: Personagem }) {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button className="nav-link" onClick={() => setAberto(true)}>
        Lore de {personagem.nome}
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
            style={{ maxWidth: 420 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 2px" }}>{personagem.nome}</h3>
            {personagem.titulo && (
              <div className="subtle" style={{ color: "var(--neon-2)" }}>
                {personagem.titulo}
              </div>
            )}
            {personagem.bio && <p style={{ marginTop: 10 }}>{personagem.bio}</p>}
            {personagem.lore && (
              <p className="subtle" style={{ fontStyle: "italic" }}>
                {personagem.lore}
              </p>
            )}
            <button
              className="btn"
              style={{ width: "100%", marginTop: 8 }}
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
