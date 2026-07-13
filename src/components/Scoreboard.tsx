// Placar de alta frequência: 4 atributos + TIER (ladder) + progresso +
// protagonista. Apresentacional — recebe a progressão ÚNICA já resolvida.
import Link from "next/link";
import type { Atributos, Personagem } from "@/lib/types";
import { tierDeXp, TOTAL_RANKS } from "@/lib/engine/tier";
import { FAMILIAS, FAMILIAS_ORDEM, LABEL_ATRIBUTO } from "@/lib/comportamentos";

const COR_ATRIBUTO: Record<string, string> = {
  forca: "var(--neon)",
  stamina: "var(--gold)",
};

export default function Scoreboard({
  attr,
  personagem,
}: {
  attr: Atributos;
  personagem: Personagem | null;
}) {
  const tier = tierDeXp(attr.xp);

  return (
    <div className="panel" style={{ marginBottom: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <h2 style={{ margin: 0 }} className="title-fight">
          {tier.nomeDivisao}
        </h2>
        <span className="subtle">nível {tier.rank + 1} de {TOTAL_RANKS}</span>
      </div>

      <div className="xp-bar" style={{ margin: "12px 0 4px" }}>
        <div className="xp-fill" style={{ width: `${tier.pctParaProximo}%` }} />
      </div>
      <div className="subtle" style={{ fontSize: "0.72rem" }}>
        {tier.proximoNomeDivisao
          ? `${tier.xpNoRank}/${tier.xpDoRank} XP → ${tier.proximoNomeDivisao}`
          : "rank máximo"}
      </div>

      <div
        className="stat-row"
        style={{ gridTemplateColumns: "repeat(2,1fr)", marginTop: 12 }}
      >
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
