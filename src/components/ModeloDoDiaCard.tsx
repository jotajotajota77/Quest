// v12.8: card compacto da dieta do dia — modelo A-G do plano de cutting
// puxado direto de lib/plano_alimentar.ts. Aparece no topo da /nutri como
// resumo do que comer hoje (5 refeições + macros do dia).
import { modeloDoDia, METAS_CUTTING } from "@/lib/plano_alimentar";

interface Props {
  /** dia da semana (0=Dom..6=Sab). */
  dow: number;
}

export default function ModeloDoDiaCard({ dow }: Props) {
  const modelo = modeloDoDia(dow);
  const nomeDia = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"][dow];
  const eDuplo = [1, 3, 5].includes(dow); // seg / qua / sex

  return (
    <div
      className="panel"
      style={{
        marginBottom: 14,
        padding: 14,
        borderLeft: "3px solid var(--gold)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
        <div>
          <div className="lbl" style={{ color: "var(--gold)", letterSpacing: "0.14em" }}>
            🍱 DIETA DE HOJE · {nomeDia}
          </div>
          <div style={{ fontWeight: 800, fontSize: "1.05rem", marginTop: 4 }}>
            Modelo {modelo.slug} — {modelo.nome}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.78rem", color: "var(--gold)" }}>
            {modelo.kcal} kcal · {modelo.proteina_g}g P
          </div>
          <div className="subtle" style={{ fontSize: "0.66rem", fontFamily: "var(--font-mono)" }}>
            {modelo.carbo_g}g C · {modelo.gordura_g}g G
          </div>
        </div>
      </div>

      {modelo.observacao && (
        <p className="subtle" style={{ margin: "6px 0 8px", fontSize: "0.76rem", fontStyle: "italic" }}>
          {modelo.observacao}
        </p>
      )}

      <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
        {modelo.refeicoes.map((r) => (
          <div
            key={r.refeicao}
            style={{
              padding: "8px 10px",
              border: "1px solid var(--hairline)",
              borderRadius: 6,
              background: "color-mix(in srgb, var(--surface) 60%, transparent)",
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.62rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-dim)",
                marginBottom: 3,
              }}
            >
              {r.refeicao}
            </div>
            <ul style={{ margin: 0, paddingLeft: 16, fontSize: "0.78rem" }}>
              {r.itens.map((item, i) => (
                <li key={i} style={{ marginBottom: 2 }}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p
        className="subtle"
        style={{
          margin: "10px 0 0",
          fontSize: "0.72rem",
          borderTop: "1px dashed var(--hairline)",
          paddingTop: 8,
        }}
      >
        Meta diária: <strong>{METAS_CUTTING.kcal} kcal</strong> · <strong>{METAS_CUTTING.proteina_g}g proteína</strong> · <strong>{METAS_CUTTING.agua_L_min}-{METAS_CUTTING.agua_L_max}L água</strong>.
        {eDuplo && " Dia de treino duplo — +1 fruta pré-TKD."}
      </p>
    </div>
  );
}
