// ============================================================
// Aba-espelho (corpo real) — PASSIVA e ENTERRADA. (TRAVA de exposição)
// ------------------------------------------------------------
//  * Só abre quando o usuário clica explicitamente nesta rota.
//  * O sistema NÃO convoca, não notifica, não puxa o usuário pra cá.
//    (O gancho de convocação existe em lib/engine/gates.ts, mas DESARMADO.)
//  * Único lugar com input deliberado fora do registro 1-toque.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import MirrorForm from "@/components/MirrorForm";
import BottomNav from "@/components/BottomNav";
import { ESPELHO_FRAMING } from "@/lib/objetivos";
import { garantirMeta, corpoRealRecente } from "@/lib/data";
import { progressoMeta, comparacaoHistorica } from "@/lib/engine/meta";

export default async function EspelhoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: registros }, meta, corpoRecente] = await Promise.all([
    supabase
      .from("corpo_real")
      .select("*")
      .eq("user_id", user.id)
      .order("ts", { ascending: false })
      .limit(30),
    garantirMeta(user.id),
    corpoRealRecente(user.id, 21),
  ]);
  const progresso = progressoMeta(meta, corpoRecente);
  const comparacao = comparacaoHistorica(corpoRecente);
  const temComparacao =
    comparacao.peso.delta != null || comparacao.bf.delta != null;

  return (
    <main className="app-shell">
      <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
        Espelho
      </h1>
      <p className="subtle" style={{ marginTop: 4 }}>
        Corpo real. Passivo — só você abre, ninguém te chama aqui.
      </p>

      <div className="panel" style={{ marginTop: 14, borderColor: "var(--gold)" }}>
        <div className="lbl">Progresso do cutting</div>
        <div style={{ marginTop: 4 }}>
          {progresso.pesoAtual != null ? `${progresso.pesoAtual}kg` : "sem peso ainda"}
          {" → alvo "}
          {meta.peso_alvo}kg
          {" · "}
          {progresso.bfAtual != null ? `${progresso.bfAtual}% BF` : "sem BF ainda"}
          {" → alvo "}
          {meta.bf_alvo}%
          {progresso.pctCaminho != null ? ` · ${progresso.pctCaminho}% do caminho` : ""}
        </div>
        <div className="subtle" style={{ marginTop: 2 }}>
          {progresso.diasRestantes >= 0
            ? `${progresso.diasRestantes} dias até 09/09`
            : "meta vencida"}
          {" · semana "}
          {progresso.semanaAtual}/{progresso.totalSemanas} do programa
        </div>
      </div>

      {temComparacao && (
        <div className="panel" style={{ marginTop: 14, borderLeft: "3px solid var(--neon)" }}>
          <div className="lbl">Você vs você-de-{comparacao.diasAtras}-dias-atrás</div>
          <div style={{ marginTop: 6, display: "grid", gap: 4 }}>
            {comparacao.peso.delta != null && (
              <div>
                <span>Peso: {comparacao.peso.entao}kg → {comparacao.peso.agora}kg</span>{" "}
                <span
                  className="pr-badge"
                  style={{
                    marginLeft: 6,
                    color:
                      comparacao.peso.delta < 0
                        ? "var(--good)"
                        : comparacao.peso.delta > 0
                          ? "var(--neon)"
                          : "var(--text-dim)",
                  }}
                >
                  {comparacao.peso.delta < 0 ? "↓" : comparacao.peso.delta > 0 ? "↑" : "="}{" "}
                  {Math.abs(comparacao.peso.delta).toFixed(2)}kg
                </span>
              </div>
            )}
            {comparacao.bf.delta != null && (
              <div>
                <span>BF: {comparacao.bf.entao}% → {comparacao.bf.agora}%</span>{" "}
                <span
                  className="pr-badge"
                  style={{
                    marginLeft: 6,
                    color:
                      comparacao.bf.delta < 0
                        ? "var(--good)"
                        : comparacao.bf.delta > 0
                          ? "var(--neon)"
                          : "var(--text-dim)",
                  }}
                >
                  {comparacao.bf.delta < 0 ? "↓" : comparacao.bf.delta > 0 ? "↑" : "="}{" "}
                  {Math.abs(comparacao.bf.delta).toFixed(2)} pp
                </span>
              </div>
            )}
          </div>
          <p className="subtle" style={{ marginTop: 8, fontSize: "0.72rem" }}>
            O corpo mente no espelho. Os números não.
          </p>
        </div>
      )}

      <div className="panel" style={{ marginTop: 14, borderLeft: "3px solid var(--neon-2)" }}>
        <div className="lbl">Como o corpo revela (segura o curso)</div>
        <p className="subtle" style={{ margin: "6px 0 0" }}>{ESPELHO_FRAMING}</p>
      </div>

      <MirrorForm />

      <div style={{ marginTop: 20 }}>
        {(registros ?? []).length === 0 && (
          <p className="subtle">Nenhum registro ainda.</p>
        )}
        {(registros ?? []).map((r) => (
          <div className="panel" key={r.id} style={{ marginBottom: 10 }}>
            <div className="subtle">
              {new Date(r.ts as string).toLocaleString("pt-BR")}
            </div>
            <div style={{ marginTop: 4 }}>
              {r.peso != null && <span>Peso: {r.peso as number}kg · </span>}
              {(r.medidas as { cintura?: number } | null)?.cintura != null && (
                <span>
                  Cintura: {(r.medidas as { cintura: number }).cintura}cm ·{" "}
                </span>
              )}
              {(r.composicao as { gordura_pct?: number } | null)?.gordura_pct !=
                null && (
                <span>
                  Gordura: {(r.composicao as { gordura_pct: number }).gordura_pct}
                  %
                </span>
              )}
            </div>
            {r.descricao && (
              <p className="subtle" style={{ marginTop: 6 }}>
                {r.descricao as string}
              </p>
            )}
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
