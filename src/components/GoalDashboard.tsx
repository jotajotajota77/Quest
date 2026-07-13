// ============================================================
// Goal dashboard — o CORAÇÃO da home (v9). Contagem regressiva pra 09/09,
// peso/BF atual vs alvo, tendência semanal e semana do programa de 8.
// Apresentacional — recebe meta + progresso já resolvidos (lib/engine/meta.ts).
// ============================================================
import type { Meta } from "@/lib/types";
import type { ProgressoMeta } from "@/lib/engine/meta";

function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export default function GoalDashboard({
  meta,
  progresso,
}: {
  meta: Meta;
  progresso: ProgressoMeta;
}) {
  const {
    diasRestantes,
    semanaAtual,
    totalSemanas,
    pesoAtual,
    bfAtual,
    pctCaminho,
    tendenciaSemanalKg,
    ritmoNecessarioKg,
  } = progresso;

  const tendenciaTxt =
    tendenciaSemanalKg == null
      ? "sem dado suficiente ainda"
      : tendenciaSemanalKg < -0.05
        ? `↓ ${Math.abs(tendenciaSemanalKg).toFixed(2)} kg/semana`
        : tendenciaSemanalKg > 0.05
          ? `↑ ${tendenciaSemanalKg.toFixed(2)} kg/semana`
          : "estável";

  return (
    <div className="panel" style={{ marginBottom: 18, borderColor: "var(--gold)" }}>
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
          Cutting → {meta.bf_alvo}% BF
        </h2>
        <span className="subtle">
          {diasRestantes >= 0 ? `${diasRestantes} dias até ${fmtData(meta.data_alvo)}` : "meta vencida"}
        </span>
      </div>

      {pctCaminho != null && (
        <>
          <div className="xp-bar" style={{ margin: "12px 0 4px" }}>
            <div className="xp-fill" style={{ width: `${pctCaminho}%` }} />
          </div>
          <div className="subtle" style={{ fontSize: "0.72rem" }}>
            {pctCaminho}% do caminho percorrido
          </div>
        </>
      )}

      <div
        className="stat-row"
        style={{ gridTemplateColumns: "repeat(3,1fr)", marginTop: 12 }}
      >
        <div className="stat">
          <div className="num">{pesoAtual != null ? `${pesoAtual}kg` : "—"}</div>
          <div className="lbl">peso atual (alvo {meta.peso_alvo}kg)</div>
        </div>
        <div className="stat">
          <div className="num">{bfAtual != null ? `${bfAtual}%` : "—"}</div>
          <div className="lbl">BF atual (alvo {meta.bf_alvo}%)</div>
        </div>
        <div className="stat">
          <div className="num" style={{ fontSize: "1.1rem" }}>
            {tendenciaTxt}
          </div>
          <div className="lbl">tendência (meta ~{ritmoNecessarioKg}kg/sem)</div>
        </div>
      </div>

      <div className="subtle" style={{ marginTop: 10, fontSize: "0.78rem" }}>
        Semana {semanaAtual} de {totalSemanas} do programa
        {semanaAtual === 4 ? " — deload" : semanaAtual === totalSemanas ? " — taper" : ""}
        {" · "}
        {meta.prioridades.slice(0, 3).join(" · ")}
      </div>
    </div>
  );
}
