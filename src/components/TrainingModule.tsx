"use client";

// ============================================================
// Módulo de treino rico (TRAVA 6) — design replicado da tela de treino antiga.
// Cards de exercício: badge de músculo, linhas de série (peso × reps + ✓),
// badge de PR, histórico, "Variar", renomear, remover. + seletor de exercícios
// do catálogo e timer de descanso flutuante. Tooling, não reforço.
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { TreinoExercicio, TreinoSerie } from "@/lib/types";
import {
  CATALOGO,
  GLOSSARIO,
  GRUPOS,
  PRESETS,
  type Preset,
} from "@/lib/treino";
import { useHitConfirm } from "@/components/HitConfirm";
import RestTimer from "@/components/RestTimer";

export default function TrainingModule({
  plano,
  series,
  seriesHoje,
  sessoesHoje = [],
}: {
  plano: TreinoExercicio[];
  series: TreinoSerie[];
  seriesHoje: TreinoSerie[];
  sessoesHoje?: { split: string; finalizada: boolean }[];
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [splitAtivo, setSplitAtivo] = useState<string | null>(plano[0]?.split ?? null);
  const [fechadas, setFechadas] = useState<Set<string>>(
    new Set(sessoesHoje.filter((s) => s.finalizada).map((s) => s.split)),
  );
  const [entradas, setEntradas] = useState<Record<string, { peso: string; reps: string }>>({});
  const [glossarioAberto, setGlossario] = useState(false);
  const [catalogoAberto, setCatalogo] = useState(false);
  const [iaAberta, setIa] = useState(false);
  const [iaTexto, setIaTexto] = useState<string | null>(null);
  const [iaCarregando, setIaCarregando] = useState(false);
  const [grupoFiltro, setGrupoFiltro] = useState<string>("peito");
  const [ocupado, setOcupado] = useState(false);

  const splits = useMemo(() => [...new Set(plano.map((e) => e.split ?? "—"))], [plano]);
  const histPorNome = useMemo(() => agruparPorNome(series), [series]);
  const hojePorNome = useMemo(() => agruparPorNome(seriesHoje), [seriesHoje]);

  async function api(body: Record<string, unknown>) {
    setOcupado(true);
    try {
      const res = await fetch("/api/treino", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json().catch(() => ({}))) as { is_pr?: boolean };
      router.refresh();
      return json;
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

  if (plano.length === 0) {
    return (
      <div className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Monte seu plano</h3>
        <p className="subtle">Escolha um preset (editável depois):</p>
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

  const splitAlvo = splitAtivo ?? splits[0];
  const exercicios = plano.filter((e) => (e.split ?? "—") === splitAlvo);
  const catalogoFiltrado = CATALOGO.filter((c) => c.grupo === grupoFiltro);

  // Sessão do dia: exercícios com pelo menos uma série hoje / total no split.
  const feitosHoje = exercicios.filter(
    (e) => (hojePorNome.get(e.nome)?.length ?? 0) > 0,
  ).length;
  const sessaoFechada = fechadas.has(splitAlvo);

  async function concluirSessao() {
    fire("SESSÃO!"); // reforço local imediato
    try {
      // Camada universal: concluir a sessão registra treino → Força + hit-confirm.
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comportamento: "treino" }),
      });
    } catch {
      /* reforço local já ocorreu */
    }
    await api({ action: "fechar_sessao", split: splitAlvo });
    setFechadas((s) => new Set(s).add(splitAlvo));
  }

  return (
    <div style={{ marginTop: 18 }}>
      {overlay}
      <RestTimer />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0 }}>Treino</h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="nav-link"
            onClick={async () => {
              setIa(true);
              setIaCarregando(true);
              setIaTexto(null);
              try {
                const res = await fetch("/api/treino/analise", { method: "POST" });
                const j = await res.json();
                setIaTexto(j.disponivel ? j.analise : j.msg);
              } catch {
                setIaTexto("Sem análise nesta sessão.");
              } finally {
                setIaCarregando(false);
              }
            }}
          >
            Análise IA
          </button>
          <button className="nav-link" onClick={() => setGlossario(true)}>
            Glossário
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
        {splits.map((s) => (
          <button
            key={s}
            className="chip"
            style={{ borderColor: s === splitAlvo ? "var(--neon)" : "var(--panel-border)", textTransform: "uppercase" }}
            onClick={() => setSplitAtivo(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Sessão do dia — invólucro com encerramento explícito. */}
      <div
        className="panel"
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          borderColor: sessaoFechada ? "var(--good)" : "var(--panel-border)",
        }}
      >
        <div>
          <div className="lbl">Sessão de hoje · {splitAlvo}</div>
          <div className="subtle" style={{ marginTop: 2 }}>
            {feitosHoje}/{exercicios.length} exercícios com série hoje
          </div>
        </div>
        {sessaoFechada ? (
          <span className="pr-badge" style={{ color: "var(--good)" }}>✓ concluída</span>
        ) : (
          <button
            className="btn btn-primary"
            style={{ padding: "10px 16px" }}
            disabled={ocupado}
            onClick={concluirSessao}
          >
            Concluir sessão
          </button>
        )}
      </div>

      {exercicios.map((ex) => {
        const e = entradas[ex.id] ?? { peso: "", reps: "" };
        const hist = (histPorNome.get(ex.nome) ?? []).slice(0, 3);
        const hoje = hojePorNome.get(ex.nome) ?? [];
        const pr = (histPorNome.get(ex.nome) ?? []).reduce((mx, s) => Math.max(mx, s.peso ?? 0), 0);
        return (
          <div className="panel" key={ex.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <button
                onClick={async () => {
                  const novo = window.prompt("Renomear exercício", ex.nome);
                  if (novo && novo.trim()) await api({ action: "rename", id: ex.id, nome: novo.trim() });
                }}
                style={{ background: "none", border: "none", color: "var(--text)", fontWeight: 800, cursor: "pointer", textAlign: "left" }}
                title="Renomear"
              >
                {ex.nome}
              </button>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {pr > 0 && <span className="pr-badge">PR {pr}kg</span>}
                <button className="nav-link" style={smallBtn} disabled={ocupado} onClick={() => api({ action: "variar", id: ex.id })}>
                  Variar
                </button>
                <button className="nav-link" style={{ ...smallBtn, color: "var(--neon)" }} disabled={ocupado} onClick={() => api({ action: "remover", id: ex.id })}>
                  ✕
                </button>
              </div>
            </div>

            {ex.grupo_muscular && <span className="muscle-badge">{ex.grupo_muscular}</span>}

            {/* Séries de hoje (linhas) */}
            {hoje.map((s, i) => (
              <div className="set-row" key={s.id}>
                <span className="subtle" style={{ width: 22 }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>
                  {s.peso ?? "–"}kg × {s.reps ?? "–"}
                  {s.is_pr ? " ⭐" : ""}
                </span>
                <button className="nav-link" style={{ ...smallBtn, color: "var(--neon)" }} onClick={() => api({ action: "remover_serie", id: s.id })}>
                  ✕
                </button>
              </div>
            ))}

            {/* Adicionar série */}
            <div className="set-row">
              <input type="number" placeholder="kg" value={e.peso}
                onChange={(ev) => setEntradas((s) => ({ ...s, [ex.id]: { ...e, peso: ev.target.value } }))}
                style={inputMini} />
              <span className="subtle">×</span>
              <input type="number" placeholder="reps" value={e.reps}
                onChange={(ev) => setEntradas((s) => ({ ...s, [ex.id]: { ...e, reps: ev.target.value } }))}
                style={inputMini} />
              <button className="btn btn-primary" style={{ padding: "8px 14px" }} disabled={ocupado} onClick={() => registrarSerie(ex)}>
                ✓
              </button>
            </div>

            {hist.length > 0 && (
              <div className="subtle" style={{ fontSize: "0.7rem", marginTop: 6 }}>
                histórico: {hist.map((s) => `${s.peso ?? "–"}×${s.reps ?? "–"}`).join(" · ")}
              </div>
            )}
          </div>
        );
      })}

      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <button className="nav-link" disabled={ocupado} onClick={() => setCatalogo(true)}>
          + Adicionar exercício
        </button>
      </div>

      <div style={{ marginTop: 10 }}>
        <span className="subtle" style={{ fontSize: "0.72rem" }}>Trocar plano (substitui): </span>
        {(Object.keys(PRESETS) as Preset[]).map((p) => (
          <button key={p} className="nav-link" style={{ ...smallBtn, marginLeft: 6 }} disabled={ocupado}
            onClick={() => { if (confirm(`Trocar para ${PRESETS[p].rotulo}? Substitui o plano atual.`)) { setSplitAtivo(null); api({ action: "seed", preset: p }); } }}>
            {PRESETS[p].rotulo}
          </button>
        ))}
      </div>

      {/* Catálogo de exercícios (lista montada do zero) */}
      {catalogoAberto && (
        <ModalBase onClose={() => setCatalogo(false)} titulo="Adicionar exercício">
          <div className="chips-row" style={{ marginBottom: 10 }}>
            {GRUPOS.map((g) => (
              <button key={g} className="chip"
                style={{ borderColor: g === grupoFiltro ? "var(--neon)" : "var(--panel-border)" }}
                onClick={() => setGrupoFiltro(g)}>
                {g}
              </button>
            ))}
          </div>
          <div style={{ maxHeight: 300, overflowY: "auto" }}>
            {catalogoFiltrado.map((c) => (
              <div key={c.nome} className="food-row">
                <span>{c.nome}</span>
                <button className="btn btn-primary" style={{ padding: "6px 12px" }} disabled={ocupado}
                  onClick={async () => { await api({ action: "add", nome: c.nome, grupo: c.grupo, split: splitAlvo }); setCatalogo(false); }}>
                  +
                </button>
              </div>
            ))}
          </div>
        </ModalBase>
      )}

      {iaAberta && (
        <ModalBase onClose={() => setIa(false)} titulo="Análise de treino (IA)">
          {iaCarregando ? (
            <p className="subtle">Analisando…</p>
          ) : (
            <p className="subtle" style={{ whiteSpace: "pre-wrap" }}>
              {iaTexto}
            </p>
          )}
        </ModalBase>
      )}

      {glossarioAberto && (
        <ModalBase onClose={() => setGlossario(false)} titulo="Glossário de técnica">
          {GLOSSARIO.map((g) => (
            <div key={g.termo} style={{ marginBottom: 10 }}>
              <strong style={{ color: "var(--neon-2)" }}>{g.termo}</strong>
              <p className="subtle" style={{ margin: "2px 0 0" }}>{g.def}</p>
            </div>
          ))}
        </ModalBase>
      )}
    </div>
  );
}

function ModalBase({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 18 }}
      onClick={onClose}
    >
      <div className="panel" style={{ maxWidth: 440, maxHeight: "82vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{titulo}</h3>
        {children}
        <button className="btn" style={{ width: "100%", marginTop: 8 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function agruparPorNome(series: TreinoSerie[]): Map<string, TreinoSerie[]> {
  const m = new Map<string, TreinoSerie[]>();
  for (const s of series) {
    const arr = m.get(s.nome) ?? [];
    arr.push(s);
    m.set(s.nome, arr);
  }
  return m;
}

const smallBtn: React.CSSProperties = { padding: "4px 8px", fontSize: "0.72rem" };
const inputMini: React.CSSProperties = {
  width: 70,
  padding: 8,
  borderRadius: 8,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
};
