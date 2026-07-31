"use client";

// v11.9: histórico de sessões anteriores agrupado por data. Aparece com ou
// sem "Concluir sessão" clicado — enquanto tiver uma série no dia, ela é
// visível aqui. Resolve o susto de "meu treino sumiu" no dia seguinte.
import { useMemo, useState } from "react";
import type { TreinoSerie } from "@/lib/types";

// Fuso de referência (America/São_Paulo). Inlinado aqui pra evitar
// importar de lib/data (server-only).
const TZ_OFFSET_MIN = -180;
function dataLocalDe(ts: string | number | Date): string {
  return new Date(new Date(ts).getTime() + TZ_OFFSET_MIN * 60_000)
    .toISOString()
    .slice(0, 10);
}

interface Props {
  series: TreinoSerie[];
}

interface GrupoDia {
  data: string; // YYYY-MM-DD
  series: TreinoSerie[];
  totalSeries: number;
  exercicios: number;
}

function agruparPorDia(series: TreinoSerie[]): GrupoDia[] {
  const m = new Map<string, TreinoSerie[]>();
  for (const s of series) {
    const dia = dataLocalDe(s.ts);
    const arr = m.get(dia) ?? [];
    arr.push(s);
    m.set(dia, arr);
  }
  return [...m.entries()]
    .map(([data, arr]) => ({
      data,
      series: arr,
      totalSeries: arr.length,
      exercicios: new Set(arr.map((x) => x.nome)).size,
    }))
    .sort((a, b) => (a.data < b.data ? 1 : -1));
}

function formataData(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const hoje = new Date();
  const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-${String(hoje.getDate()).padStart(2, "0")}`;
  const ontem = new Date(hoje);
  ontem.setDate(hoje.getDate() - 1);
  const ontemStr = `${ontem.getFullYear()}-${String(ontem.getMonth() + 1).padStart(2, "0")}-${String(ontem.getDate()).padStart(2, "0")}`;
  if (iso === hojeStr) return "Hoje";
  if (iso === ontemStr) return "Ontem";
  const dias = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];
  return `${dias[dt.getDay()]} · ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`;
}

export default function HistoricoTreino({ series }: Props) {
  const grupos = useMemo(() => agruparPorDia(series), [series]);
  const [abertos, setAbertos] = useState<Set<string>>(new Set());

  function toggle(dia: string) {
    setAbertos((s) => {
      const n = new Set(s);
      if (n.has(dia)) n.delete(dia);
      else n.add(dia);
      return n;
    });
  }

  if (grupos.length === 0) {
    return null;
  }

  return (
    <div className="panel" style={{ marginTop: 14 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div className="lbl">Histórico · sessões anteriores</div>
        <span
          className="subtle"
          style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem" }}
        >
          {grupos.length} dias
        </span>
      </div>
      <p className="subtle" style={{ margin: "4px 0 10px", fontSize: "0.72rem" }}>
        Toda série que você registra fica aqui — não depende de clicar em
        &quot;Concluir sessão&quot;. Toque num dia pra expandir.
      </p>
      <div style={{ display: "grid", gap: 6 }}>
        {grupos.map((g) => {
          const aberto = abertos.has(g.data);
          const porNome = new Map<string, TreinoSerie[]>();
          for (const s of g.series) {
            const arr = porNome.get(s.nome) ?? [];
            arr.push(s);
            porNome.set(s.nome, arr);
          }
          return (
            <div
              key={g.data}
              style={{
                borderRadius: 8,
                border: "1px solid var(--hairline)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => toggle(g.data)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  background: "transparent",
                  border: "none",
                  color: "var(--text)",
                  cursor: "pointer",
                  gap: 8,
                }}
              >
                <span style={{ fontWeight: 700 }}>{formataData(g.data)}</span>
                <span
                  className="subtle"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "0.72rem",
                  }}
                >
                  {g.exercicios} exs · {g.totalSeries} séries {aberto ? "▾" : "▸"}
                </span>
              </button>
              {aberto && (
                <div
                  style={{
                    padding: "0 12px 10px",
                    display: "grid",
                    gap: 6,
                    borderTop: "1px solid var(--hairline)",
                  }}
                >
                  {[...porNome.entries()].map(([nome, arr]) => (
                    <div key={nome} style={{ paddingTop: 8 }}>
                      <div style={{ fontWeight: 600, fontSize: "0.82rem" }}>
                        {nome}
                      </div>
                      <div
                        className="subtle"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: "0.72rem",
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 6,
                          marginTop: 2,
                        }}
                      >
                        {arr.map((s, i) => (
                          <span
                            key={s.id ?? i}
                            style={{
                              padding: "2px 6px",
                              borderRadius: 4,
                              background: s.is_pr
                                ? "rgba(255,215,0,0.15)"
                                : "rgba(255,255,255,0.04)",
                              border: s.is_pr
                                ? "1px solid var(--gold)"
                                : "1px solid var(--hairline)",
                            }}
                          >
                            {s.peso != null ? `${s.peso}kg` : "—"} ×{" "}
                            {s.reps ?? "?"}
                            {s.is_pr ? " ★" : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
