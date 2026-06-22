// Placar de alta frequência: os 4 atributos + Elo + progresso + protagonista.
// Apresentacional — recebe a progressão ÚNICA do jogador já resolvida.
import Link from "next/link";
import type { Atributos, Personagem } from "@/lib/types";
import { xpParaElo } from "@/lib/engine/reinforcement";
import { FAMILIAS, FAMILIAS_ORDEM, LABEL_ATRIBUTO } from "@/lib/comportamentos";

const COR_ATRIBUTO: Record<string, string> = {
  forca: "var(--neon)",
  stamina: "var(--gold)",
  sabedoria: "var(--neon-2)",
  destreza: "#b16cff",
};

export default function Scoreboard({
  attr,
  personagem,
}: {
  attr: Atributos;
  personagem: Personagem | null;
}) {
  const baseElo = xpParaElo(attr.elo);
  const proxElo = xpParaElo(attr.elo + 1);
  const pct =
    proxElo > baseElo
      ? Math.min(100, ((attr.xp - baseElo) / (proxElo - baseElo)) * 100)
      : 0;

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <h2 style={{ margin: 0 }} className="title-fight">
          Elo {attr.elo}
        </h2>
        <span className="subtle">
          Protagonista: {personagem ? personagem.nome : "—"}
        </span>
      </div>

      <div className="xp-bar" style={{ margin: "12px 0" }}>
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="stat-row" style={{ gridTemplateColumns: "repeat(4,1fr)" }}>
        {FAMILIAS_ORDEM.map((fam) => {
          const a = FAMILIAS[fam].atributo;
          const favorecido = personagem?.comportamento_alvo === fam;
          return (
            <Link
              key={fam}
              href={`/${fam}`}
              className="stat"
              style={{ textDecoration: "none", position: "relative" }}
            >
              <div className="num" style={{ color: COR_ATRIBUTO[a] }}>
                {attr[a]}
              </div>
              <div className="lbl">{LABEL_ATRIBUTO[a]}</div>
              {favorecido && (
                <div
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 8,
                    fontSize: "0.6rem",
                    color: "var(--gold)",
                    fontWeight: 800,
                  }}
                >
                  +25%
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
