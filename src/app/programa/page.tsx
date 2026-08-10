// ============================================================
// Aba Programa (v11) — o plano fixo até 09/09.
// ------------------------------------------------------------
// Mostra: (1) hoje em destaque com todas as sessões, (2) semana atual em
// grid, (3) contagem regressiva de dias/semanas até a meta.
// TKD com sunbaenim aparece como "não editável" — o resto é o plano padrão.
// ============================================================
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import BottomNav from "@/components/BottomNav";
import {
  hojeISO,
  garantirMeta,
} from "@/lib/data";
import {
  programaAteMeta,
  programaDoDia,
  ICO_TIPO_SESSAO,
  LABEL_TIPO_SESSAO,
  type Sessao,
  type DiaPrograma,
} from "@/lib/programa";
import AtoHeader from "@/components/AtoHeader";
import { atoAtual } from "@/lib/ato";

export default async function ProgramaPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const meta = await garantirMeta(user.id);
  const hoje = hojeISO();
  const [hy, hm, hd] = hoje.split("-").map(Number);
  const dowHoje = new Date(Date.UTC(hy, hm - 1, hd)).getUTCDay();
  const programaHoje = programaDoDia(dowHoje);
  const calendario = programaAteMeta(hoje, meta.data_alvo);

  // v11.1: lê o que foi feito hoje pra bater no card de HOJE. Séries de
  // musculação por exercício, log de dança (aula ou coreo), quests TKD marcadas.
  const inicioHoje = new Date(Date.UTC(hy, hm - 1, hd, 3, 0, 0)).toISOString(); // 00:00 BR
  const [{ data: seriesHojeRaw }, { data: dancaHojeRaw }, { data: questsCompletas }] =
    await Promise.all([
      supabase
        .from("treino_series")
        .select("nome, peso, reps")
        .eq("user_id", user.id)
        .gte("ts", inicioHoje),
      supabase
        .from("logs_danca")
        .select("musica, duracao_min")
        .eq("user_id", user.id)
        .gte("ts", inicioHoje),
      supabase
        .from("quests")
        .select("quest_id, descricao, tipo")
        .eq("user_id", user.id)
        .eq("data", hoje)
        .eq("estado", "completa"),
    ]);
  const seriesHoje = (seriesHojeRaw ?? []) as { nome: string; peso: number | null; reps: number | null }[];
  const dancaHoje = (dancaHojeRaw ?? []) as { musica: string; duracao_min: number | null }[];
  const questsHoje = (questsCompletas ?? []) as { quest_id: string; descricao: string; tipo: string }[];
  const seriesPorNome = new Map<string, number>();
  for (const s of seriesHoje) {
    seriesPorNome.set(s.nome, (seriesPorNome.get(s.nome) ?? 0) + 1);
  }
  const tkdMarcados = questsHoje.filter((q) => q.tipo === "tkd").length;
  const muscMarcados = questsHoje.filter((q) => q.tipo === "musculacao").length;

  // Agrupa por semana (segunda como início)
  const semanas: { titulo: string; dias: { data: string; dia: DiaPrograma }[] }[] = [];
  let bufferSemana: { data: string; dia: DiaPrograma }[] = [];
  for (const d of calendario) {
    const [y, m, dd] = d.data.split("-").map(Number);
    const dow = new Date(Date.UTC(y, m - 1, dd)).getUTCDay();
    if (dow === 1 && bufferSemana.length > 0) {
      semanas.push({
        titulo: `Semana de ${bufferSemana[0].data.slice(8)}/${bufferSemana[0].data.slice(5, 7)}`,
        dias: bufferSemana,
      });
      bufferSemana = [];
    }
    bufferSemana.push(d);
  }
  if (bufferSemana.length > 0) {
    semanas.push({
      titulo: `Semana de ${bufferSemana[0].data.slice(8)}/${bufferSemana[0].data.slice(5, 7)}`,
      dias: bufferSemana,
    });
  }

  const diasRestantes = calendario.length;

  const ato = atoAtual(hoje);
  return (
    <main className="app-shell">
      <AtoHeader ato={ato} hojeISO={hoje} />
      <div className="panel" style={{ marginBottom: 16, borderColor: "var(--gold)" }}>
        <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
          Programa · até {fmtDataBR(meta.data_alvo)}
        </h1>
        <p className="subtle" style={{ marginTop: 4 }}>
          {diasRestantes} dias · plano 7× — musculação diária + dança diária +
          TKD 20:00-22:00 (seg/qua/sex). Split A–G por dia da semana.
        </p>
      </div>

      {/* HOJE em destaque */}
      <div
        className="panel"
        style={{
          marginBottom: 16,
          borderLeft: "3px solid var(--kihap)",
          background: "color-mix(in srgb, var(--kihap) 6%, var(--surface))",
        }}
      >
        <div
          className="lbl"
          style={{ color: "var(--kihap)", letterSpacing: "0.12em" }}
        >
          HOJE · {programaHoje.dia_semana} · {fmtDataBR(hoje)}
        </div>
        {programaHoje.observacao && (
          <p className="subtle" style={{ margin: "4px 0 0", fontSize: "0.78rem" }}>
            {programaHoje.observacao}
          </p>
        )}
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {programaHoje.sessoes.map((s, i) => (
            <SessaoCard
              key={i}
              sessao={s}
              destaque
              seriesPorNome={seriesPorNome}
              dancaHoje={dancaHoje}
              tkdMarcadosHoje={tkdMarcados}
              muscMarcadosHoje={muscMarcados}
            />
          ))}
        </div>
        {/* Resumo do que foi feito hoje */}
        <div
          className="subtle"
          style={{
            marginTop: 12,
            padding: "8px 12px",
            borderTop: "1px dashed var(--hairline)",
            fontSize: "0.75rem",
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <span>
            🏋️ <strong>{seriesHoje.length}</strong> séries logadas
          </span>
          <span>
            💃 <strong>{dancaHoje.length}</strong> sessão(ões) de dança
          </span>
          <span>
            🥋 <strong>{tkdMarcados}</strong> quests TKD marcadas
          </span>
          <span>
            ✓ <strong>{muscMarcados}</strong> quest musc marcada
          </span>
        </div>
      </div>

      {/* Semanas seguintes */}
      {semanas.map((sem) => (
        <div key={sem.titulo} className="panel" style={{ marginBottom: 14 }}>
          <div className="lbl">{sem.titulo}</div>
          <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
            {sem.dias.map(({ data, dia }) => {
              const ehHoje = data === hoje;
              return (
                <div
                  key={data}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${ehHoje ? "var(--kihap)" : "var(--hairline)"}`,
                    background: ehHoje
                      ? "color-mix(in srgb, var(--kihap) 8%, transparent)"
                      : "transparent",
                    display: "grid",
                    gap: 4,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: 8,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color: ehHoje ? "var(--kihap)" : "var(--text)",
                      }}
                    >
                      {dia.dia_semana} · {data.slice(8)}/{data.slice(5, 7)}
                    </span>
                    {dia.observacao && (
                      <span
                        className="subtle"
                        style={{ fontSize: "0.68rem", fontStyle: "italic" }}
                      >
                        {dia.observacao}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 6,
                    }}
                  >
                    {dia.sessoes.map((s, i) => (
                      <span
                        key={i}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 12,
                          fontSize: "0.7rem",
                          border: `1px solid ${corDoTipo(s.tipo)}`,
                          color: corDoTipo(s.tipo),
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {ICO_TIPO_SESSAO[s.tipo]} {LABEL_TIPO_SESSAO[s.tipo]}
                        {s.duracao_min ? ` ${s.duracao_min}min` : ""}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <BottomNav />
    </main>
  );
}

function SessaoCard({
  sessao,
  destaque,
  seriesPorNome,
  dancaHoje,
  tkdMarcadosHoje = 0,
  muscMarcadosHoje = 0,
}: {
  sessao: Sessao;
  destaque?: boolean;
  seriesPorNome?: Map<string, number>;
  dancaHoje?: { musica: string; duracao_min: number | null }[];
  tkdMarcadosHoje?: number;
  muscMarcadosHoje?: number;
}) {
  // Status de conclusão por tipo:
  //  - musculacao: X/Y exercícios com pelo menos 1 série hoje
  //  - danca: N sessões logadas
  //  - tkd: N quests TKD marcadas (proxy — sem log direto)
  let statusLinha: React.ReactNode = null;
  if (sessao.tipo === "musculacao" && sessao.exercicios && seriesPorNome) {
    const feitos = sessao.exercicios.filter((e) => (seriesPorNome.get(e.nome) ?? 0) > 0).length;
    const total = sessao.exercicios.length;
    const cor = feitos === total ? "var(--good)" : feitos > 0 ? "var(--gold)" : "var(--text-dim)";
    statusLinha = (
      <div style={{ fontSize: "0.75rem", color: cor, fontWeight: 700 }}>
        {feitos === total ? "✓ Sessão completa" : `${feitos}/${total} exercícios hoje`}
      </div>
    );
  } else if (sessao.tipo === "danca" && dancaHoje) {
    if (dancaHoje.length > 0) {
      statusLinha = (
        <div style={{ fontSize: "0.75rem", color: "var(--good)", fontWeight: 700 }}>
          ✓ Registrou {dancaHoje.length} sessão(ões) hoje
        </div>
      );
    }
  } else if (sessao.tipo === "tkd" && tkdMarcadosHoje > 0) {
    statusLinha = (
      <div style={{ fontSize: "0.75rem", color: "var(--good)", fontWeight: 700 }}>
        ✓ {tkdMarcadosHoje} quest(s) TKD marcada(s)
      </div>
    );
  }
  void muscMarcadosHoje; // reserved
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        border: `1px solid ${corDoTipo(sessao.tipo)}`,
        background: destaque
          ? "color-mix(in srgb, var(--surface) 92%, transparent)"
          : "transparent",
        display: "grid",
        gap: 6,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 8,
        }}
      >
        <div style={{ fontWeight: 800 }}>
          {ICO_TIPO_SESSAO[sessao.tipo]} {sessao.titulo}
        </div>
        <span
          className="subtle"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem" }}
        >
          {sessao.hora} · {sessao.duracao_min}min
        </span>
      </div>
      <div className="subtle" style={{ fontSize: "0.82rem" }}>
        {sessao.descricao}
      </div>
      {!sessao.editavel && (
        <div
          className="subtle"
          style={{
            fontSize: "0.68rem",
            fontStyle: "italic",
            color: "var(--kihap)",
          }}
        >
          🥋 rotina do sunbaenim · não editável
        </div>
      )}
      {statusLinha}
      {sessao.exercicios && (
        <div style={{ marginTop: 4, display: "grid", gap: 4 }}>
          {sessao.exercicios.map((ex, i) => {
            const feitas = seriesPorNome?.get(ex.nome) ?? 0;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 8,
                  fontSize: "0.82rem",
                  padding: "4px 0",
                  borderBottom: "1px dashed var(--hairline)",
                }}
              >
                <span style={{ color: feitas > 0 ? "var(--good)" : "var(--text)" }}>
                  {feitas > 0 ? "✓ " : ""}
                  {ex.nome}
                </span>
                <span
                  className="subtle"
                  style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
                >
                  {ex.series ?? ""}
                  {feitas > 0 ? ` · ${feitas}× logadas` : ""}
                </span>
              </div>
            );
          })}
        </div>
      )}
      {sessao.tkd_moves && sessao.tkd_moves.length > 0 && (
        <div style={{ marginTop: 4 }}>
          <div className="subtle" style={{ fontSize: "0.7rem", marginBottom: 4 }}>
            Techniques do dia:
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
            {sessao.tkd_moves.map((m) => (
              <span
                key={m}
                style={{
                  padding: "2px 8px",
                  borderRadius: 10,
                  fontSize: "0.7rem",
                  background: "color-mix(in srgb, var(--kihap) 18%, transparent)",
                  color: "var(--kihap)",
                }}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
      )}
      {sessao.tipo === "danca" && (
        <Link
          href="/danca"
          className="nav-link"
          style={{
            marginTop: 6,
            padding: "6px 10px",
            fontSize: "0.75rem",
            textAlign: "center",
            borderColor: "var(--gold)",
            color: "var(--gold)",
          }}
        >
          Ver coreografia do dia →
        </Link>
      )}
    </div>
  );
}

function corDoTipo(tipo: string): string {
  switch (tipo) {
    case "musculacao":
      return "var(--neon)";
    case "tkd":
      return "var(--kihap)";
    case "danca":
      return "var(--gold)";
    case "cardio":
      return "var(--neon-2)";
    case "mobilidade":
      return "var(--calm)";
    default:
      return "var(--hairline)";
  }
}

function fmtDataBR(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
