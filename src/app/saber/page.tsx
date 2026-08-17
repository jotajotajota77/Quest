// ============================================================
// /saber (Fase 1) — index. Escolhe a ordem de estudo e mostra o
// próximo conceito. Botão "Iniciar sessão" leva pra /saber/sessao.
//
// Fase 1: só didática está exposta como sequenciador. Cronológica e
// projeto aparecem como VISUALIZAÇÃO (lista secundária), nunca como
// portão — coerente com "cronológica não pode ser a primeira passada".
// ============================================================
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import {
  carregarConceitos,
  carregarArestas,
  carregarMasteryConceito,
} from "@/lib/saber/data";
import { ordemDidatica, ordemCronologica } from "@/lib/saber/dag";

export default async function SaberPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [conceitos, arestas, masteries] = await Promise.all([
    carregarConceitos(),
    carregarArestas(),
    carregarMasteryConceito(user.id),
  ]);

  const didatica = ordemDidatica(conceitos, arestas, masteries);
  const abertos = didatica.filter((c) => c.aberto);
  const proximos = abertos.slice(0, 3);
  const bloqueados = didatica.filter((c) => !c.aberto);
  const cronologica = ordemCronologica(conceitos, arestas, masteries);

  return (
    <main className="app-shell" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "12px 0 6px", borderBottom: "1px solid var(--hairline)", marginBottom: 16 }}>
        <div className="lbl" style={{ color: "var(--gold)", letterSpacing: "0.18em" }}>
          📚 SABER · MÓDULO DE ESTUDOS
        </div>
        <h1 className="title-fight" style={{ fontSize: "1.6rem", margin: "2px 0 4px", textTransform: "uppercase" }}>
          {conceitos.length} conceitos · {abertos.length} abertos
        </h1>
        <p className="subtle" style={{ fontSize: "0.82rem", margin: 0 }}>
          Um grafo, três ordens. Comece pela didática — cronológica e projeto
          são visualizações do mesmo material, não sequenciadores.
        </p>
      </div>

      {/* Próximo conceito */}
      {proximos.length > 0 ? (
        <section style={{ marginBottom: 20 }}>
          <div className="lbl" style={{ color: "var(--kihap)", marginBottom: 6 }}>
            PRÓXIMO NA DIDÁTICA
          </div>
          {proximos.map((c, i) => (
            <div
              key={c.slug}
              className="panel"
              style={{
                padding: 14,
                marginBottom: 10,
                borderLeft: i === 0 ? "4px solid var(--kihap)" : "3px solid var(--hairline)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <div style={{ fontWeight: 800, fontSize: "1.05rem" }}>{c.titulo}</div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.66rem", color: "var(--ink-dim)", letterSpacing: "0.14em", textTransform: "uppercase" }}>
                  {c.apostila === "genero" ? "gênero" : "qv/hap"} · {c.dominio} · nv.{c.nivel}
                </span>
              </div>
              <p className="subtle" style={{ margin: "6px 0 8px", fontSize: "0.82rem", fontStyle: "italic" }}>
                {c.tese}
              </p>
              {c.criterio && (
                <p className="subtle" style={{ margin: "6px 0", fontSize: "0.74rem" }}>
                  <strong style={{ color: "var(--gold)" }}>Critério:</strong> {c.criterio}
                </p>
              )}
              {i === 0 && (
                <div style={{ marginTop: 10 }}>
                  <Link
                    href={`/saber/sessao?slug=${c.slug}`}
                    className="btn btn-primary"
                    style={{ padding: "8px 14px", fontSize: "0.86rem" }}
                  >
                    ▶ Iniciar sessão com {c.titulo}
                  </Link>
                </div>
              )}
            </div>
          ))}
        </section>
      ) : (
        <div className="panel" style={{ padding: 14, marginBottom: 20, borderLeft: "3px solid var(--gold)" }}>
          <div className="lbl" style={{ color: "var(--gold)" }}>Nada aberto</div>
          <p className="subtle" style={{ margin: "4px 0 0", fontSize: "0.82rem" }}>
            Suba o mastery de conceitos-raiz pra abrir o resto. Fase 1 ainda
            não credita XP automaticamente — use a autonota da sessão pra
            atualizar mastery na Fase 2.
          </p>
        </div>
      )}

      {/* Cronológica (visualização) */}
      <section style={{ marginBottom: 20 }}>
        <div className="lbl" style={{ color: "var(--ink-dim)", marginBottom: 6 }}>
          VISUALIZAÇÃO · ORDEM CRONOLÓGICA (só abertos)
        </div>
        {cronologica.filter((c) => c.aberto).length === 0 ? (
          <p className="subtle" style={{ fontSize: "0.78rem" }}>
            Vazia — a cronologia respeita a didática (Engels em 1884 só depois
            de "prática cultural").
          </p>
        ) : (
          <div style={{ display: "grid", gap: 4 }}>
            {cronologica.filter((c) => c.aberto).map((c) => (
              <div key={c.slug} style={{
                padding: "6px 10px",
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                background: "var(--surface)",
                fontSize: "0.78rem",
              }}>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--gold)", marginRight: 8 }}>
                  {c.ano_origem}
                </span>
                {c.titulo}
                {c.autor_origem && <span className="subtle" style={{ marginLeft: 6, fontSize: "0.7rem" }}>· {c.autor_origem}</span>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bloqueados (visualização) */}
      {bloqueados.length > 0 && (
        <section>
          <div className="lbl" style={{ color: "var(--ink-dim)", marginBottom: 6 }}>
            BLOQUEADOS · REQUEREM PRÉ-REQUISITOS ({bloqueados.length})
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            {bloqueados.slice(0, 20).map((c) => (
              <div key={c.slug} style={{
                padding: "6px 10px",
                border: "1px solid var(--hairline)",
                borderRadius: 6,
                background: "color-mix(in srgb, var(--surface) 60%, transparent)",
                fontSize: "0.76rem",
                color: "var(--ink-dim)",
                opacity: 0.7,
              }}>
                🔒 {c.titulo}
              </div>
            ))}
            {bloqueados.length > 20 && (
              <div className="subtle" style={{ fontSize: "0.72rem", padding: "4px 10px" }}>
                … +{bloqueados.length - 20}
              </div>
            )}
          </div>
        </section>
      )}

      <BottomNav />
    </main>
  );
}
