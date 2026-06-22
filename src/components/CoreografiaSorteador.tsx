"use client";

// Sorteador de coreografia (aba Dança) — tooling. Sorteia uma coreografia e
// mostra links de busca no YouTube e TikTok. O reforço continua na camada
// universal: depois de dançar, o usuário registra no botão grande acima.
import { useState } from "react";
import {
  linkTikTok,
  linkYouTube,
  sortearCoreografia,
  type Coreografia,
} from "@/lib/coreografias";

export default function CoreografiaSorteador() {
  const [c, setC] = useState<Coreografia | null>(null);

  return (
    <div style={{ marginTop: 18 }}>
      <div className="panel">
        <div className="lbl">Sorteador de coreografia</div>
        <p className="subtle" style={{ margin: "4px 0 10px" }}>
          Não sabe o que dançar? Deixa o sistema escolher.
        </p>
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={() => setC((prev) => sortearCoreografia(prev))}
        >
          🎲 {c ? "Sortear outra" : "Sortear coreografia"}
        </button>

        {c && (
          <div className="panel" style={{ marginTop: 12, borderColor: "var(--neon-2)" }}>
            <div style={{ fontWeight: 800, fontSize: "1.15rem" }}>{c.nome}</div>
            <span className="muscle-badge" style={{ marginTop: 4 }}>
              {c.estilo}
            </span>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              <a
                className="btn"
                href={linkYouTube(c)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
              >
                ▶ YouTube
              </a>
              <a
                className="btn"
                href={linkTikTok(c)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ flex: 1, textAlign: "center", textDecoration: "none" }}
              >
                ♪ TikTok
              </a>
            </div>
            <p className="subtle" style={{ margin: "12px 0 0", fontSize: "0.72rem" }}>
              Dançou? Toca em <strong>REGISTRAR DANÇA</strong> lá em cima. 💃
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
