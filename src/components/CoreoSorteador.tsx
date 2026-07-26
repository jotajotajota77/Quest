"use client";

// v11: sorteador de coreografia — sugere a do dia (determinística) e permite
// sortear outra na hora se não quiser essa. Registro fica no DancaLog abaixo.
import { useState } from "react";

export interface Coreo {
  grupo: string;
  musica: string;
  nivel: string;
}

// Pool expandido — variedade K-pop rapaz do momento.
export const COREOGRAFIAS: Coreo[] = [
  { grupo: "TXT",         musica: "Sugar Rush Ride",           nivel: "médio" },
  { grupo: "NCT DREAM",   musica: "Smoothie",                  nivel: "difícil" },
  { grupo: "ZEROBASEONE", musica: "In Bloom",                  nivel: "médio" },
  { grupo: "TWS",         musica: "Plot Twist",                nivel: "fácil" },
  { grupo: "SEVENTEEN",   musica: "God of Music",              nivel: "difícil" },
  { grupo: "RIIZE",       musica: "Get A Guitar",              nivel: "médio" },
  { grupo: "BOYNEXTDOOR", musica: "Earth, Wind & Fire",        nivel: "fácil" },
  { grupo: "ATEEZ",       musica: "Bouncy (K-Hot Chilli Peppers)", nivel: "difícil" },
  { grupo: "Stray Kids",  musica: "S-Class",                   nivel: "difícil" },
  { grupo: "TWS",         musica: "Hey! (하이!)",              nivel: "médio" },
  { grupo: "TXT",         musica: "Deja Vu",                   nivel: "difícil" },
  { grupo: "NCT",         musica: "STICKER",                   nivel: "difícil" },
  { grupo: "ENHYPEN",     musica: "Bite Me",                   nivel: "médio" },
  { grupo: "RIIZE",       musica: "Impossible",                nivel: "médio" },
  { grupo: "BOYNEXTDOOR", musica: "Serenade",                  nivel: "fácil" },
  { grupo: "Stray Kids",  musica: "God's Menu",                nivel: "difícil" },
];

/** Coreografia do dia (determinística por data). */
export function coreografiaDoDia(iso: string): Coreo {
  let h = 0;
  for (const c of iso) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COREOGRAFIAS[h % COREOGRAFIAS.length];
}

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
