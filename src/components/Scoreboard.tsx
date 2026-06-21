// Placar de alta frequência: elo, XP, Stamina + personagem do dia.
// Apresentacional — recebe a progressão ÚNICA do usuário já resolvida.
import type { Atributos, Personagem } from "@/lib/types";
import { xpParaElo } from "@/lib/engine/reinforcement";

export default function Scoreboard({
  attr,
  personagem,
}: {
  attr: Pick<Atributos, "stamina" | "elo" | "xp">;
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
          Protagonista de hoje: {personagem ? personagem.nome : "—"}
        </span>
      </div>

      <div className="xp-bar" style={{ margin: "12px 0" }}>
        <div className="xp-fill" style={{ width: `${pct}%` }} />
      </div>

      <div className="stat-row">
        <div className="stat">
          <div className="num" style={{ color: "var(--gold)" }}>
            {attr.stamina}
          </div>
          <div className="lbl">Stamina</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: "var(--neon-2)" }}>
            {attr.xp}
          </div>
          <div className="lbl">XP total</div>
        </div>
        <div className="stat">
          <div className="num" style={{ color: "var(--neon)" }}>
            {attr.elo}
          </div>
          <div className="lbl">Elo</div>
        </div>
      </div>
    </div>
  );
}
