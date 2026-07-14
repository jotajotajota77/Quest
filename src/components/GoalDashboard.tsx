// ============================================================
// Goal dashboard — o CORAÇÃO da home (v9). Contagem regressiva pra 09/09,
// peso/BF atual vs alvo, tendência semanal e semana do programa de 8.
// Apresentacional — recebe meta + progresso já resolvidos (lib/engine/meta.ts).
// v9.2 TRAVA 8: chama viva (streak) embutida — o marco visual de aderência
// (verde = hoje bateu, amarela = em risco, cinza = apagada). Recorde é o piso
// que o operante busca superar.
// ============================================================
import type { Meta } from "@/lib/types";
import type { ProgressoMeta } from "@/lib/engine/meta";
import type { StreakDetalhado } from "@/lib/engine/streak";

function fmtData(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function ChamaViva({ streak }: { streak: StreakDetalhado }) {
  const cor = streak.hitHoje
    ? "var(--good)"
    : streak.emRisco
      ? "var(--gold)"
      : "var(--text-dim)";
  const rotulo = streak.hitHoje
    ? "chama viva"
    : streak.emRisco
      ? "em risco — logue hoje"
      : "chama apagada";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginTop: 12,
        padding: "10px 12px",
        border: `1px solid ${cor}`,
        borderRadius: 10,
      }}
    >
      <div style={{ fontSize: "1.8rem", lineHeight: 1 }} aria-hidden>
        {streak.hitHoje ? "🔥" : streak.emRisco ? "🟡" : "◯"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 800, fontSize: "1.05rem", color: cor }}>
          {streak.streak} {streak.streak === 1 ? "dia" : "dias"}
          <span className="subtle" style={{ marginLeft: 8, fontSize: "0.72rem" }}>
            · recorde {streak.recorde}
          </span>
        </div>
        <div className="subtle" style={{ fontSize: "0.72rem", marginTop: 2 }}>
          {rotulo}
          {streak.proximoMarco && streak.hitHoje
            ? ` · próximo marco: ${streak.proximoMarco}`
            : ""}
        </div>
      </div>
    </div>
  );
}

export default function GoalDashboard({
  meta,
  progresso,
  streak,
}: {
  meta: Meta;
  progresso: ProgressoMeta;
  streak: StreakDetalhado;
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

      <ChamaViva streak={streak} />
    </div>
  );
}
