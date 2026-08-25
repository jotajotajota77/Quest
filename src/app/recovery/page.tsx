// ============================================================
// /recovery — Readiness dashboard (PR6, §17, §24).
// ------------------------------------------------------------
// Server component. Mostra:
//   - Score do dia + veredicto (ready/caution/recovery_advised).
//   - Componentes desmontados.
//   - Evolução 14 dias (barras compactas).
//
// Nada aqui é "ordem médica" — só sugestão.
// ============================================================

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  historicoReadiness,
  precisaRecoveryBanner,
  recalcularReadinessDoDia,
  ultimoReadiness,
} from "@/lib/physique/data";
import BottomNav from "@/components/BottomNav";

export default async function RecoveryPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Sempre tenta recalcular o do dia antes de renderizar — se não houver
  // daily_checkin de hoje, `recalcularReadinessDoDia` retorna null e
  // usamos o último snapshot registrado.
  try { await recalcularReadinessDoDia(user.id); } catch { /* ok */ }

  const [ult, hist, banner] = await Promise.all([
    ultimoReadiness(user.id),
    historicoReadiness(user.id, 14),
    precisaRecoveryBanner(user.id),
  ]);

  const label = ult ? LABEL[ult.veredicto] : null;

  return (
    <main className="app-shell">
      <header style={{ marginBottom: 14 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>Recovery</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-dim)", fontSize: 14 }}>
          Sugestão. Não é diagnóstico. §17
        </p>
      </header>

      {banner.precisa && (
        <div
          style={{
            marginBottom: 14,
            padding: 12,
            borderRadius: 12,
            background: "color-mix(in srgb, var(--kihap) 15%, var(--surface))",
            borderLeft: "4px solid var(--kihap)",
          }}
        >
          <strong style={{ color: "var(--kihap)" }}>⚠ Recovery advised</strong>
          <p style={{ margin: "4px 0 0", fontSize: 13 }}>
            {banner.motivo}. Considere: sono 8h+ hoje, treino leve ou pular
            um dia. Nada aqui é obrigatório.
          </p>
        </div>
      )}

      {ult && label ? (
        <>
          <section style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <ScoreRing score={ult.score} veredicto={ult.veredicto} />
              <div>
                <strong style={{ fontSize: 20, color: label.cor }}>{label.txt}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--ink-dim)" }}>
                  {label.sub}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: 11, color: "var(--ink-dim)" }}>
                  cobertura {ult.componentes.cobertura_pct}% · avaliado {new Date(ult.atualizado_em).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </section>

          <section style={cardStyle}>
            <h2 style={h2Style}>Componentes</h2>
            <ComponenteBar rotulo="Sono" v={ult.componentes.sono} />
            <ComponenteBar rotulo="Folga de fome" v={ult.componentes.fome_folga} />
            <ComponenteBar rotulo="Folga de dor" v={ult.componentes.dor_folga} />
            <ComponenteBar rotulo="Performance" v={ult.componentes.performance} />
            <ComponenteBar rotulo="Folga de carga" v={ult.componentes.carga_folga} />
            <ComponenteBar rotulo="Folga de fadiga" v={ult.componentes.fadiga_folga} />
          </section>
        </>
      ) : (
        <section style={cardStyle}>
          <p style={{ margin: 0, fontSize: 14 }}>
            Sem readiness ainda. Registre o <Link href="/checkin" style={{ color: "var(--calm)" }}>check-in do dia</Link> pra gerar o primeiro score.
          </p>
        </section>
      )}

      <section style={cardStyle}>
        <h2 style={h2Style}>Últimos 14 dias</h2>
        {hist.length === 0 ? (
          <p style={{ margin: 0, fontSize: 13, color: "var(--ink-dim)" }}>
            Sem histórico ainda.
          </p>
        ) : (
          <div style={{ display: "flex", gap: 4, alignItems: "flex-end", height: 60 }}>
            {hist.map((h) => {
              const altura = Math.max(4, (h.score / 100) * 60);
              const cor = h.veredicto === "ready" ? "var(--chama)"
                : h.veredicto === "caution" ? "var(--calm)"
                : "var(--kihap)";
              return (
                <div
                  key={h.id}
                  style={{ flex: 1, height: altura, background: cor, borderRadius: 4 }}
                  title={`${h.data} · ${h.score}`}
                />
              );
            })}
          </div>
        )}
        <div style={{ marginTop: 6, fontSize: 11, color: "var(--ink-dim)", display: "flex", justifyContent: "space-between" }}>
          <span>{hist[0]?.data ?? ""}</span>
          <span>{hist[hist.length - 1]?.data ?? ""}</span>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}

function ScoreRing({ score, veredicto }: { score: number; veredicto: string }) {
  const cor = veredicto === "ready" ? "var(--chama)"
    : veredicto === "caution" ? "var(--calm)"
    : "var(--kihap)";
  return (
    <div
      style={{
        width: 80, height: 80, borderRadius: "50%",
        background: `conic-gradient(${cor} ${score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 64, height: 64, borderRadius: "50%",
          background: "var(--surface)",
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.3rem" }}>{score}</div>
        <div style={{ fontSize: "0.55rem", color: "var(--ink-dim)" }}>/ 100</div>
      </div>
    </div>
  );
}

function ComponenteBar({ rotulo, v }: { rotulo: string; v: number }) {
  const cor = v >= 70 ? "var(--chama)" : v >= 50 ? "var(--calm)" : "var(--kihap)";
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: "var(--ink-dim)" }}>{rotulo}</span>
        <span>{v}</span>
      </div>
      <div style={{ height: 6, background: "var(--ground)", borderRadius: 3, marginTop: 2 }}>
        <div style={{ height: "100%", width: `${v}%`, background: cor, borderRadius: 3 }} />
      </div>
    </div>
  );
}

const LABEL: Record<string, { txt: string; cor: string; sub: string }> = {
  ready:            { txt: "READY",            cor: "var(--chama)",  sub: "corpo pronto pra treino intenso" },
  caution:          { txt: "CAUTION",          cor: "var(--calm)",   sub: "reduz volume ou intensidade" },
  recovery_advised: { txt: "RECOVERY ADVISED", cor: "var(--kihap)",  sub: "hoje é dia de recuperar — não punir" },
};

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--hairline)",
  borderRadius: 16,
  padding: 14,
  marginBottom: 14,
};

const h2Style: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 14,
  letterSpacing: 0.5,
  textTransform: "uppercase",
  color: "var(--ink-dim)",
};
