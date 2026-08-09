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
import type { ExercicioBib } from "@/lib/data";
import { GLOSSARIO, SPLIT_LABEL, SPLIT_SEMANA, gruposDoSplit } from "@/lib/treino";
import {
  DOW_TO_SPLIT_KEY,
  LABEL_PROGRAMA_SPLIT,
  PROGRAMA_SPLIT_KEYS,
} from "@/lib/programa";
import { useHitConfirm } from "@/components/HitConfirm";
import { usePhotocardDrop } from "@/components/PhotocardDropToast";
import RestTimer from "@/components/RestTimer";
import BibliotecaExercicios from "@/components/BibliotecaExercicios";
import { FichaCompleta, ProgramaLinha } from "@/components/FichaExercicio";
import { somPr, somSerie } from "@/lib/som";

const ORDEM_SPLIT_SEMANA = SPLIT_SEMANA.map((s) => s.key);

export default function TrainingModule({
  plano,
  series,
  seriesHoje,
  sessoesHoje = [],
  biblioteca = [],
}: {
  plano: TreinoExercicio[];
  series: TreinoSerie[];
  seriesHoje: TreinoSerie[];
  sessoesHoje?: { split: string; finalizada: boolean }[];
  biblioteca?: ExercicioBib[];
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const { showDrop, dropOverlay } = usePhotocardDrop();
  // v11: default = split do programa pro dia da semana atual, se existir.
  const splitHoje = DOW_TO_SPLIT_KEY[new Date().getDay()];
  const inicial = plano.some((e) => e.split === splitHoje)
    ? splitHoje
    : (plano[0]?.split ?? null);
  const [splitAtivo, setSplitAtivo] = useState<string | null>(inicial);
  const [fechadas, setFechadas] = useState<Set<string>>(
    new Set(sessoesHoje.filter((s) => s.finalizada).map((s) => s.split)),
  );
  const [entradas, setEntradas] = useState<Record<string, { peso: string; reps: string }>>({});
  const [glossarioAberto, setGlossario] = useState(false);
  const [catalogoAberto, setCatalogo] = useState(false);
  const [iaAberta, setIa] = useState(false);
  const [iaTexto, setIaTexto] = useState<string | null>(null);
  const [iaCarregando, setIaCarregando] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [fichaAberta, setFichaAberta] = useState<string | null>(null);

  const bibPorId = useMemo(() => {
    const m = new Map<string, ExercicioBib>();
    for (const b of biblioteca) m.set(b.id, b);
    return m;
  }, [biblioteca]);

  // v11: ordem canônica = splits do /plano (seg → dom) + core_cardio +
  // qualquer outro custom que o user tenha criado. Splits antigos do
  // Apêndice A (dom_pump_cardio, seg_pull, etc.) e presets ABC/UL/PPL
  // ficam ESCONDIDOS — o botão "Sincronizar com /plano" limpa tudo.
  const ORDEM_PROGRAMA: string[] = [
    ...PROGRAMA_SPLIT_KEYS,
    "core_cardio",
  ];
  const SPLITS_LEGADOS = new Set([...ORDEM_SPLIT_SEMANA, "A", "B", "C", "upper", "lower", "push", "pull", "legs", "core"]);
  const splits = useMemo(() => {
    const s = [...new Set(plano.map((e) => e.split ?? "—"))];
    const naOrdem = s.filter((k) => ORDEM_PROGRAMA.includes(k));
    const custom = s.filter((k) => !ORDEM_PROGRAMA.includes(k) && !SPLITS_LEGADOS.has(k));
    naOrdem.sort((a, b) => ORDEM_PROGRAMA.indexOf(a) - ORDEM_PROGRAMA.indexOf(b));
    return [...naOrdem, ...custom];
  }, [plano]);
  const temLegado = useMemo(
    () => plano.some((e) => SPLITS_LEGADOS.has(e.split ?? "")),
    [plano],
  );
  // Rótulo de músculos por split (ex.: A → "Peito / Ombro / Tríceps").
  const gruposPorSplit = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of new Set(plano.map((e) => e.split ?? "—"))) {
      m.set(s, gruposDoSplit(plano.filter((e) => (e.split ?? "—") === s)));
    }
    return m;
  }, [plano]);
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
      const json = (await res.json().catch(() => ({}))) as {
        is_pr?: boolean;
        recorde?: boolean;
        photocardId?: string | null;
        boss?: {
          derrotou?: boolean;
          xp?: number;
          shards?: number;
          photocardId?: string | null;
        };
        bonus?: {
          creditou?: boolean;
          xp?: number;
          shards?: number;
          boss?: { derrotou?: boolean; photocardId?: string | null };
        };
      };
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
    if (r.is_pr) {
      somPr();
      fire(r.recorde ? "승리!" : "최고!"); // seungri (vitória) vs. choego (melhor)
    } else {
      somSerie(); // tom curto de confirmação em toda série
    }
    // v12 PR3: HOLO por PR real → mostra unbox da photocard.
    if (r.photocardId) {
      showDrop({
        photocardId: r.photocardId,
        header: "HOLO · PR REAL",
        bonus: r.recorde ? "novo recorde!" : "empate no top set",
      });
    }
    // v12 PR3: se essa série derrubou o boss semanal, mostra o drop do boss.
    if (r.boss?.derrotou && r.boss.photocardId) {
      showDrop({
        photocardId: r.boss.photocardId,
        header: "BOSS DERROTADO",
        bonus: `+${r.boss.xp ?? 0} XP · +${r.boss.shards ?? 0} shards`,
      });
    }
    setEntradas((s) => ({ ...s, [ex.id]: { peso: "", reps: "" } }));
  }

  if (plano.length === 0) {
    return (
      <div className="panel" style={{ marginTop: 18 }}>
        <h3 style={{ marginTop: 0 }}>Popular plano</h3>
        <p className="subtle">
          Sincronize com o <strong>/plano</strong> e todos os exercícios da semana
          aparecem aqui, organizados por dia. Depois dá pra registrar avulso qualquer
          coisa fora do plano.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            disabled={ocupado}
            onClick={() => api({ action: "sync_programa" })}
          >
            🔄 Sincronizar com /plano
          </button>
        </div>
      </div>
    );
  }

  const splitAlvo = splitAtivo ?? splits[0];
  const exercicios = plano.filter((e) => (e.split ?? "—") === splitAlvo);

  // Sessão do dia: exercícios com pelo menos uma série hoje / total no split.
  const feitosHoje = exercicios.filter(
    (e) => (hojePorNome.get(e.nome)?.length ?? 0) > 0,
  ).length;
  const sessaoFechada = fechadas.has(splitAlvo);

  async function concluirSessao() {
    fire("완벽!"); // wanbyeok — perfect / flawless (substitui SESSÃO!)
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
    const r = await api({ action: "fechar_sessao", split: splitAlvo });
    // v12 PR3: bônus por fechar o split (idempotente pelo servidor); se essa
    // conclusão derrubou o boss, mostra a drop; senão só reforça no chip.
    if (r.bonus?.boss?.derrotou && r.bonus.boss.photocardId) {
      showDrop({
        photocardId: r.bonus.boss.photocardId,
        header: "BOSS DERROTADO",
        bonus: `+150 XP · +3 shards`,
      });
    }
    setFechadas((s) => new Set(s).add(splitAlvo));
  }

  return (
    <div style={{ marginTop: 18 }}>
      {overlay}
      {dropOverlay}
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

      {/* v11: banner de sincronização quando o plano tem splits antigos */}
      {temLegado && (
        <div
          className="panel"
          style={{
            margin: "10px 0",
            padding: "10px 12px",
            borderLeft: "3px solid var(--gold)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div>
            <div className="lbl" style={{ color: "var(--gold)" }}>
              Seu plano tem splits antigos
            </div>
            <div className="subtle" style={{ fontSize: "0.72rem" }}>
              Sincronize pra deixar só os exercícios do /plano (custom não é apagado).
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: "8px 12px", fontSize: "0.8rem" }}
            disabled={ocupado}
            onClick={() => {
              if (confirm("Substituir plano atual pelo /plano? Exercícios custom são preservados.")) {
                api({ action: "sync_programa" });
              }
            }}
          >
            🔄 Sincronizar
          </button>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "10px 0" }}>
        {splits.map((s) => {
          const grupos = gruposPorSplit.get(s);
          return (
            <button
              key={s}
              className="chip"
              style={{ borderColor: s === splitAlvo ? "var(--neon)" : "var(--panel-border)" }}
              onClick={() => setSplitAtivo(s)}
            >
              <span style={{ fontWeight: 800 }}>
                {LABEL_PROGRAMA_SPLIT[s as never] ?? SPLIT_LABEL[s] ?? s.toUpperCase()}
              </span>
              {grupos && <span style={{ color: "var(--text-dim)" }}> · {grupos}</span>}
            </button>
          );
        })}
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
          <div className="lbl">
            Sessão de hoje · {LABEL_PROGRAMA_SPLIT[splitAlvo as never] ?? SPLIT_LABEL[splitAlvo] ?? splitAlvo}
            {gruposPorSplit.get(splitAlvo) ? ` · ${gruposPorSplit.get(splitAlvo)}` : ""}
          </div>
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
        const catalogo = ex.exercicio_id ? bibPorId.get(ex.exercicio_id) : undefined;
        const fichaAbertaAqui = fichaAberta === ex.id;
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

            {/* Prescrição do programa embutido (Apêndice A) + ficha técnica opt-in. */}
            {catalogo && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <ProgramaLinha ex={catalogo} />
                  {(catalogo.cue || catalogo.erro_comum) && (
                    <button
                      className="nav-link"
                      style={{ ...smallBtn, marginTop: 4 }}
                      onClick={() => setFichaAberta(fichaAbertaAqui ? null : ex.id)}
                    >
                      {fichaAbertaAqui ? "ocultar ficha ▲" : "ver ficha ▾"}
                    </button>
                  )}
                </div>
                {fichaAbertaAqui && (
                  <div style={{ marginTop: 6 }}>
                    <FichaCompleta ex={catalogo} />
                  </div>
                )}
              </>
            )}

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

      <QuickAddExercicio splitAlvo={splitAlvo} ocupado={ocupado} api={api} />

      <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
        <button className="nav-link" disabled={ocupado} onClick={() => setCatalogo(true)}>
          📚 Biblioteca de exercícios
        </button>
      </div>

      {/* v11: o plano é fixo (definido em lib/programa.ts) — não tem mais
          swap de preset. Só o botão de merge do Core + Cardio (útil pra
          adicionar core ao dia) e o Registrar avulso. */}
      <div style={{ marginTop: 10 }}>
        <button
          className="nav-link"
          style={{ ...smallBtn, borderColor: "var(--gold)", color: "var(--gold)" }}
          disabled={ocupado}
          onClick={() => api({ action: "merge_preset", preset: "CORE" })}
        >
          ➕ Adicionar Core + Cardio ao plano
        </button>
      </div>

      {/* Biblioteca viva de exercícios (fichas + descoberta) */}
      {catalogoAberto && (
        <BibliotecaExercicios
          exercicios={biblioteca}
          onAdd={async (nome, grupo) => {
            await api({ action: "add", nome, grupo, split: splitAlvo });
            setCatalogo(false);
          }}
          onClose={() => setCatalogo(false)}
        />
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

// v10.3: "Registrar avulso" — versão em branco pra adicionar exercício que
// foi feito mas não tá no split do dia. Vai pro split ativo como custom, e a
// partir daí você loga série normalmente. Cobre o caso "fiz X, quero anotar".
function QuickAddExercicio({
  splitAlvo,
  ocupado,
  api,
}: {
  splitAlvo: string;
  ocupado: boolean;
  api: (body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [nome, setNome] = useState("");
  const [grupo, setGrupo] = useState<string>("peito");
  const [aberto, setAberto] = useState(false);

  async function adicionar() {
    const n = nome.trim();
    if (!n) return;
    await api({ action: "add", nome: n, grupo, split: splitAlvo });
    setNome("");
    setAberto(false);
  }

  if (!aberto) {
    return (
      <div style={{ marginTop: 10 }}>
        <button
          className="nav-link"
          disabled={ocupado}
          onClick={() => setAberto(true)}
          style={{ borderColor: "var(--neon-2)" }}
        >
          ➕ Registrar avulso
        </button>
      </div>
    );
  }

  return (
    <div
      className="panel"
      style={{
        marginTop: 10,
        display: "grid",
        gap: 8,
        borderLeft: "3px solid var(--neon-2)",
      }}
    >
      <div className="lbl">Registrar avulso · adiciona ao split ativo</div>
      <input
        type="text"
        placeholder="Nome do exercício (ex.: Elevação de pernas)"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{
          padding: 10,
          borderRadius: 8,
          border: "1px solid var(--panel-border)",
          background: "rgba(0,0,0,0.25)",
          color: "var(--text)",
        }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <label className="subtle" style={{ fontSize: "0.72rem" }}>
          grupo:
        </label>
        <select
          value={grupo}
          onChange={(e) => setGrupo(e.target.value)}
          style={{
            padding: 8,
            borderRadius: 8,
            border: "1px solid var(--panel-border)",
            background: "rgba(0,0,0,0.25)",
            color: "var(--text)",
          }}
        >
          {["peito", "costas", "ombro", "biceps", "triceps", "pernas", "posterior", "panturrilha", "core"].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="btn btn-primary"
          style={{ flex: 1 }}
          disabled={ocupado || !nome.trim()}
          onClick={adicionar}
        >
          Adicionar
        </button>
        <button
          className="nav-link"
          onClick={() => {
            setNome("");
            setAberto(false);
          }}
        >
          Cancelar
        </button>
      </div>
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
