"use client";

// ============================================================
// Módulo de treino rico (TRAVA 6) — TOOLING, não reforço.
// ------------------------------------------------------------
// Plano (presets), "Variar", detecção de PR, glossário, histórico, custom,
// renomear inline + timer de descanso flutuante. O reforço do treino segue
// sendo só a camada universal (o botão "Registrar treino" da aba). Aqui é
// utilidade que traz o usuário pro app (alavanca de Premack).
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TreinoExercicio, TreinoSerie } from "@/lib/types";
import { GLOSSARIO, PRESETS, type Preset } from "@/lib/treino";
import { useHitConfirm } from "@/components/HitConfirm";
import RestTimer from "@/components/RestTimer";

export default function TrainingModule({
  plano,
  series,
}: {
  plano: TreinoExercicio[];
  series: TreinoSerie[];
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [splitAtivo, setSplitAtivo] = useState<string | null>(
    plano[0]?.split ?? null,
  );
  const [entradas, setEntradas] = useState<Record<string, { peso: string; reps: string }>>(
    {},
  );
  const [glossarioAberto, setGlossario] = useState(false);
  const [ocupado, setOcupado] = useState(false);

  const splits = useMemo(
    () => [...new Set(plano.map((e) => e.split ?? "—"))],
    [plano],
  );

  // histórico por nome de exercício (mais recentes primeiro já vêm ordenadas)
  const historicoPorNome = useMemo(() => {
    const m = new Map<string, TreinoSerie[]>();
    for (const s of series) {
      const arr = m.get(s.nome) ?? [];
      arr.push(s);
      m.set(s.nome, arr);
    }
    return m;
  }, [series]);

  async function api(body: Record<string, unknown>) {
    setOcupado(true);
    try {
      const res = await fetch("/api/treino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      router.refresh();
      return json as { is_pr?: boolean; nome?: string };
    } finally {
      setOcupado(false);
    }
  }

  async function registrarSerie(ex: TreinoExercicio) {
    const e = entradas[ex.id] ?? { peso: "", reps: "" };
    const r = await api({
      action: "serie",
      exercicio_id: ex.id,
      nome: ex.nome,
      peso: e.peso ? Number(e.peso) : null,
      reps: e.reps ? Number(e.reps) : null,
    });
    if (r.is_pr) fire("PR!");
    setEntradas((s) => ({ ...s, [ex.id]: { peso: "", reps: "" } }));
  }

  // Sem plano: escolher um preset.
  if (plano.length === 0) {
    return (
      <div className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Monte seu plano</h3>
        <p className="subtle">Escolha um preset (dá pra editar e variar depois):</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(Object.keys(PRESETS) as Preset[]).map((p) => (
            <button
              key={p}
              className="btn btn-primary"
              disabled={ocupado}
              onClick={() => api({ action: "seed", preset: p })}
            >
              {PRESETS[p].rotulo}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const exerciciosDoSplit = plano.filter(
    (e) => (e.split ?? "—") === (splitAtivo ?? splits[0]),
  );

  return (
    <div style={{ marginTop: 18 }}>
      {overlay}
      <RestTimer />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h3 style={{ margin: 0 }}>Treino</h3>
        <button className="nav-link" onClick={() => setGlossario(true)}>
          Glossário
        </button>
      </div>

      {/* Chips de split */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
        {splits.map((s) => (
          <button
            key={s}
            className="nav-link"
            style={{
              borderColor:
                s === (splitAtivo ?? splits[0]) ? "var(--neon)" : "var(--panel-border)",
              textTransform: "uppercase",
            }}
            onClick={() => setSplitAtivo(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {exerciciosDoSplit.map((ex) => {
        const e = entradas[ex.id] ?? { peso: "", reps: "" };
        const hist = (historicoPorNome.get(ex.nome) ?? []).slice(0, 3);
        const pr = (historicoPorNome.get(ex.nome) ?? []).reduce(
          (mx, s) => Math.max(mx, s.peso ?? 0),
          0,
        );
        return (
          <div className="panel" key={ex.id} style={{ marginBottom: 10 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <button
                onClick={async () => {
                  const novo = window.prompt("Renomear exercício", ex.nome);
                  if (novo && novo.trim()) await api({ action: "rename", id: ex.id, nome: novo.trim() });
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text)",
                  fontWeight: 800,
                  cursor: "pointer",
                  textAlign: "left",
                }}
                title="Renomear"
              >
                {ex.nome}
              </button>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="nav-link"
                  style={{ padding: "4px 8px", fontSize: "0.72rem" }}
                  disabled={ocupado}
                  onClick={() => api({ action: "variar", id: ex.id })}
                >
                  Variar
                </button>
                <button
                  className="nav-link"
                  style={{ padding: "4px 8px", fontSize: "0.72rem", color: "var(--neon)" }}
                  disabled={ocupado}
                  onClick={() => api({ action: "remover", id: ex.id })}
                >
                  ✕
                </button>
              </div>
            </div>

            {ex.grupo_muscular && (
              <div className="subtle" style={{ fontSize: "0.7rem" }}>
                {ex.grupo_muscular}
                {pr > 0 && <span style={{ color: "var(--gold)" }}> · PR {pr}kg</span>}
              </div>
            )}

            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input
                type="number"
                placeholder="kg"
                value={e.peso}
                onChange={(ev) =>
                  setEntradas((s) => ({ ...s, [ex.id]: { ...e, peso: ev.target.value } }))
                }
                style={inputMini}
              />
              <input
                type="number"
                placeholder="reps"
                value={e.reps}
                onChange={(ev) =>
                  setEntradas((s) => ({ ...s, [ex.id]: { ...e, reps: ev.target.value } }))
                }
                style={inputMini}
              />
              <button
                className="btn btn-primary"
                style={{ padding: "8px 14px" }}
                disabled={ocupado}
                onClick={() => registrarSerie(ex)}
              >
                Série
              </button>
            </div>

            {hist.length > 0 && (
              <div className="subtle" style={{ fontSize: "0.72rem", marginTop: 6 }}>
                {hist.map((s) => (
                  <span key={s.id} style={{ marginRight: 10 }}>
                    {s.peso ?? "–"}kg×{s.reps ?? "–"}
                    {s.is_pr ? " ⭐" : ""}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <button
          className="nav-link"
          disabled={ocupado}
          onClick={async () => {
            const nome = window.prompt("Nome do exercício custom");
            if (!nome) return;
            const grupo = window.prompt("Grupo muscular (peito, costas, ombro, biceps, triceps, pernas, posterior, panturrilha)") ?? "";
            await api({
              action: "add",
              nome: nome.trim(),
              grupo: grupo.trim(),
              split: splitAtivo ?? splits[0],
            });
          }}
        >
          + Exercício custom
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="subtle" style={{ fontSize: "0.72rem" }}>
          Trocar plano (substitui o atual):{" "}
        </span>
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button
            key={p}
            className="nav-link"
            style={{ padding: "4px 8px", fontSize: "0.72rem", marginLeft: 6 }}
            disabled={ocupado}
            onClick={() => {
              if (confirm(`Trocar para ${PRESETS[p].rotulo}? Isso substitui o plano atual.`)) {
                setSplitAtivo(null);
                api({ action: "seed", preset: p });
              }
            }}
          >
            {PRESETS[p].rotulo}
          </button>
        ))}
      </div>

      {/* Glossário */}
      {glossarioAberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 18,
          }}
          onClick={() => setGlossario(false)}
        >
          <div
            className="panel"
            style={{ maxWidth: 440, maxHeight: "82vh", overflowY: "auto" }}
            onClick={(ev) => ev.stopPropagation()}
          >
            <h3 style={{ marginTop: 0 }}>Glossário de técnica</h3>
            {GLOSSARIO.map((g) => (
              <div key={g.termo} style={{ marginBottom: 10 }}>
                <strong style={{ color: "var(--neon-2)" }}>{g.termo}</strong>
                <p className="subtle" style={{ margin: "2px 0 0" }}>
                  {g.def}
                </p>
              </div>
            ))}
            <button
              className="btn"
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => setGlossario(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputMini: React.CSSProperties = {
  width: 70,
  padding: 8,
  borderRadius: 8,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
};
