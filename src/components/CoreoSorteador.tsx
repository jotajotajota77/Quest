"use client";

// v11: sorteador de coreografia — sugere a do dia (determinística) e permite
// sortear outra na hora se não quiser essa. Registro fica no DancaLog abaixo.
// Pool + função determinística ficam em lib/coreo.ts (pure server-safe).
import { useState } from "react";
import { COREOGRAFIAS, type Coreo } from "@/lib/coreo";

export default function CoreoSorteador({ inicial }: { inicial: Coreo }) {
  const [atual, setAtual] = useState<Coreo>(inicial);
  const [rolls, setRolls] = useState(0);

  function sortear() {
    const filtrado = COREOGRAFIAS.filter(
      (c) => c.musica !== atual.musica || c.grupo !== atual.grupo,
    );
    const nova = filtrado[Math.floor(Math.random() * filtrado.length)];
    setAtual(nova);
    setRolls((r) => r + 1);
  }

  return (
    <div
      className="panel"
      style={{ marginBottom: 14, borderLeft: "3px solid var(--neon)" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div className="lbl">Coreografia do dia{rolls > 0 ? ` · sorteio ${rolls + 1}` : ""}</div>
        <button
          className="nav-link"
          onClick={sortear}
          style={{
            padding: "3px 10px",
            fontSize: "0.7rem",
            borderColor: "var(--neon)",
            color: "var(--neon)",
          }}
        >
          🎲 Sortear de novo
        </button>
      </div>
      <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
        <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{atual.musica}</div>
        <div className="subtle" style={{ fontSize: "0.85rem" }}>
          {atual.grupo} · nível {atual.nivel}
        </div>
      </div>
      <p className="subtle" style={{ marginTop: 8, fontSize: "0.72rem" }}>
        Dance 1-2 faixas seguidas. Se preferir outra música, escreva o nome
        direto no registro abaixo.
      </p>
    </div>
  );
}
