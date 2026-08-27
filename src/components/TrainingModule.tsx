"use client";

// ============================================================
// Módulo de treino rico (TRAVA 6) — design replicado da tela de treino antiga.
// Cards de exercício: badge de músculo, linhas de série (peso × reps + ✓),
// badge de PR, histórico, "Variar", renomear, remover. + seletor de exercícios
// do catálogo e timer de descanso flutuante. Tooling, não reforço.
// ============================================================

import { useEffect, useMemo, useState } from "react";
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
import {
  METRIC_LABEL,
  formatarSerie,
  metricTypeDe,
  type MetricType,
  type SerieCampos,
} from "@/lib/physique/exercicios";

type Entrada = Partial<Record<
  "peso" | "reps" | "seconds" | "assist_kg" | "distance_m",
  string
>>;
const ENTRADA_VAZIA: Entrada = {};

const ORDEM_SPLIT_SEMANA = SPLIT_SEMANA.map((s) => s.key);

// v13: dow → sigla. index 0=domingo.
const SIGLAS_DIA = ["dom", "seg", "ter", "qua", "qui", "sex", "sab"] as const;
// Ordem visual das pills: SEG-DOM.
const SIGLAS_DIA_ORDEM = ["seg", "ter", "qua", "qui", "sex", "sab", "dom"] as const;
const LABEL_DIA: Record<string, string> = {
  seg: "segunda",
  ter: "terça",
  qua: "quarta",
  qui: "quinta",
  sex: "sexta",
  sab: "sábado",
  dom: "domingo",
  extras: "extras",
};

// Extrai o dia-da-semana a partir do split key (prog_seg_push → 'seg',
// seg_pull → 'seg', dom_pump_cardio → 'dom'). Fallback = 'extras'.
function diaDoSplit(split: string): string {
  const s = split.replace(/^prog_/, "").toLowerCase();
  for (const dia of SIGLAS_DIA_ORDEM) {
    if (s.startsWith(`${dia}_`)) return dia;
  }
  return "extras";
}

// v14: retroativo — dado uma sigla de dia da semana (seg/ter/…/dom),
// retorna a data ISO (YYYY-MM-DD) DENTRO DA SEMANA ATUAL correspondente.
// Se o dia é hoje ou futuro (nesta semana), retorna undefined (usa now).
// Se é passado, retorna o ISO do dia — engine grava com ts = meio-dia
// daquele dia.
function dataDoDia(dia: string): string | undefined {
  const alvo = SIGLAS_DIA.indexOf(dia as (typeof SIGLAS_DIA)[number]);
  if (alvo < 0) return undefined;
  const hoje = new Date();
  const hojeDow = hoje.getDay();
  // Se o dia é hoje, sem retroatividade.
  if (alvo === hojeDow) return undefined;
  // Se o dia é DEPOIS de hoje na semana atual, também não faz sentido
  // registrar (mas deixamos passar como HOJE — usa now).
  // Se é ANTES de hoje, calcula o dia dessa semana.
  const diff = alvo - hojeDow;
  if (diff > 0) return undefined; // dia futuro
  const d = new Date(hoje);
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

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
  const [entradas, setEntradas] = useState<Record<string, Entrada>>({});
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

  // v13 §85: seletor por dia da semana. Extrai dow do split key
  // (prog_seg_push → 'seg', seg_pull → 'seg'). Agrupa todos os splits do
  // plano por dia e mostra 7 pills SEG-DOM. Splits sem dia claro
  // (core_cardio, custom) vão pro grupo "Extras".
  const splitPorDia = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of splits) {
      const dia = diaDoSplit(s);
      const arr = map.get(dia) ?? [];
      if (!arr.includes(s)) arr.push(s);
      map.set(dia, arr);
    }
    return map;
  }, [splits]);
  const [diaAtivo, setDiaAtivo] = useState<string>(() => {
    const hoje = SIGLAS_DIA[new Date().getDay()];
    if (splitPorDia.has(hoje)) return hoje;
    for (const dia of SIGLAS_DIA) {
      if (splitPorDia.has(dia)) return dia;
    }
    return hoje;
  });

  // PR3 §14: pre-preencher entradas com a última série do dia por exercício.
  // Só na primeira renderização — se o user editar depois, mantém o dele.
  useEffect(() => {
    setEntradas((prev) => {
      const next = { ...prev };
      for (const ex of plano) {
        if (next[ex.id]) continue; // já editado nesta sessão
        const hoje = hojePorNome.get(ex.nome);
        if (!hoje || hoje.length === 0) continue;
        const ult = hoje[hoje.length - 1];
        next[ex.id] = {
          peso: ult.peso != null ? String(ult.peso) : "",
          reps: ult.reps != null ? String(ult.reps) : "",
          seconds: ult.seconds != null ? String(ult.seconds) : "",
          assist_kg: ult.assist_kg != null ? String(ult.assist_kg) : "",
          distance_m: ult.distance_m != null ? String(ult.distance_m) : "",
        };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plano.length]);

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
        prs_batidos?: string[];
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
    const e = entradas[ex.id] ?? ENTRADA_VAZIA;
    const metric = metricTypeDe(ex.nome);
    const numOr = (s: string | undefined) => (s ? Number(s) : null);
    // v14: se o dia ativo é passado, envia `data` pra API gravar
    // retroativo. Dia futuro = ignora (sem sentido).
    const dataAlvo = dataDoDia(diaAtivo);
    const r = await api({
      action: "serie",
      exercicio_id: ex.id,
      nome: ex.nome,
      metric_type: metric,
      peso: numOr(e.peso),
      reps: numOr(e.reps),
      seconds: numOr(e.seconds),
      assist_kg: numOr(e.assist_kg),
      distance_m: numOr(e.distance_m),
      data: dataAlvo,
    });
    if (r.is_pr) {
      somPr();
      fire(r.recorde ? "승리!" : "최고!"); // seungri (vitória) vs. choego (melhor)
    } else {
      somSerie(); // tom curto de confirmação em toda série
    }
    // PR3 §54-57: PRs multidimensionais. Se vieram tipos, mostra flair curto.
    if (r.prs_batidos && r.prs_batidos.length > 0) {
      const labels = r.prs_batidos.map(labelDePr).filter(Boolean).join(" · ");
      if (labels) fire(labels);
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
    // PR3 §14: set-N pré-preenchido. Mantém os valores da última série
    // gravada (peso/reps/seconds/etc) pra próxima. Só zera se o registro
    // falhou (ok:false vira r.is_pr undefined + prs_batidos undefined,
    // aí a gente prefere manter o que estava — sem penalizar).
    // Nada a fazer: o objeto `entradas[ex.id]` já contém os valores.
  }

  function labelDePr(tipo: string): string {
    switch (tipo) {
      case "carga": return "PR carga";
      case "reps": return "PR reps";
      case "volume": return "PR volume";
      case "tempo": return "PR tempo";
      case "distancia": return "PR distância";
      default: return "";
    }
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

  // splitAlvo: se o user clicou explicitamente um split, respeita. Senão,
  // pega o primeiro split do dia ativo (default = split do plano pro dia).
  const splitsDoDia = splitPorDia.get(diaAtivo) ?? [];
  const splitAlvo = splitAtivo && splitsDoDia.includes(splitAtivo)
    ? splitAtivo
    : (splitsDoDia[0] ?? splitAtivo ?? splits[0]);
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

      {/* v13: seletor por dia da semana. Sempre mostra SEG-DOM.
          Sugere o split do plano pro dia. Se dia tem múltiplos splits
          (ex: user adicionou um custom), lista todos abaixo dos dias. */}
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", margin: "12px 0 6px" }}>
        {SIGLAS_DIA_ORDEM.map((dia) => {
          const temSplit = splitPorDia.has(dia);
          const eHoje = dia === SIGLAS_DIA[new Date().getDay()];
          const ativo = dia === diaAtivo;
          return (
            <button
              key={dia}
              type="button"
              onClick={() => {
                setDiaAtivo(dia);
                setSplitAtivo(null); // reset seleção manual pra usar default do dia
              }}
              className="chip"
              style={{
                padding: "6px 10px",
                fontSize: "0.75rem",
                minWidth: 42,
                fontWeight: 800,
                borderColor: ativo ? "var(--neon)" : eHoje ? "var(--gold)" : "var(--panel-border)",
                background: ativo ? "color-mix(in srgb, var(--neon) 15%, transparent)" : "transparent",
                color: ativo ? "var(--neon)" : temSplit ? "var(--text)" : "var(--text-dim)",
                opacity: temSplit ? 1 : 0.6,
              }}
              title={temSplit ? `${splitPorDia.get(dia)!.length} split(s) no plano` : "sem treino no plano"}
            >
              {dia.toUpperCase()}
              {eHoje && <span style={{ marginLeft: 3, fontSize: 8 }}>●</span>}
            </button>
          );
        })}
        {splitPorDia.has("extras") && (
          <button
            key="extras"
            type="button"
            onClick={() => { setDiaAtivo("extras"); setSplitAtivo(null); }}
            className="chip"
            style={{
              padding: "6px 10px",
              fontSize: "0.7rem",
              borderColor: diaAtivo === "extras" ? "var(--neon)" : "var(--panel-border)",
              color: diaAtivo === "extras" ? "var(--neon)" : "var(--text-dim)",
            }}
          >
            +
          </button>
        )}
      </div>

      {/* Se o dia tem mais de 1 split (raro — user adicionou um custom no
          mesmo dia), mostra as opções pra escolher. Se só 1, esconde. */}
      {splitsDoDia.length > 1 && (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
          {splitsDoDia.map((s) => {
            const grupos = gruposPorSplit.get(s);
            return (
              <button
                key={s}
                type="button"
                className="chip"
                style={{
                  padding: "4px 8px",
                  fontSize: "0.7rem",
                  borderColor: s === splitAlvo ? "var(--neon)" : "var(--panel-border)",
                }}
                onClick={() => setSplitAtivo(s)}
              >
                {LABEL_PROGRAMA_SPLIT[s as never] ?? SPLIT_LABEL[s] ?? s.toUpperCase()}
                {grupos && <span style={{ color: "var(--text-dim)" }}> · {grupos}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Label completo do split ativo + badge de retroativo. */}
      {splitAlvo && (() => {
        const dataAlvo = dataDoDia(diaAtivo);
        return (
          <div className="subtle" style={{ fontSize: "0.72rem", marginBottom: 8 }}>
            {LABEL_PROGRAMA_SPLIT[splitAlvo as never] ?? SPLIT_LABEL[splitAlvo] ?? splitAlvo}
            {gruposPorSplit.get(splitAlvo) ? ` · ${gruposPorSplit.get(splitAlvo)}` : ""}
            {dataAlvo && (
              <span
                style={{
                  marginLeft: 8,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "color-mix(in srgb, var(--belt-gold) 20%, transparent)",
                  color: "var(--belt-gold)",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
                title={`registrando em ${dataAlvo}`}
              >
                ⏪ RETROATIVO · {LABEL_DIA[diaAtivo]}
              </span>
            )}
          </div>
        );
      })()}

      {/* Empty state se o dia escolhido não tem split no plano. */}
      {splitsDoDia.length === 0 && (
        <div className="panel" style={{ padding: 12, marginBottom: 10, textAlign: "center" }}>
          <div className="subtle" style={{ fontSize: "0.75rem" }}>
            Sem treino previsto pra {LABEL_DIA[diaAtivo]}.
          </div>
        </div>
      )}

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
        const e = entradas[ex.id] ?? ENTRADA_VAZIA;
        const metric = metricTypeDe(ex.nome);
        const hist = (histPorNome.get(ex.nome) ?? []).slice(0, 3);
        const hoje = hojePorNome.get(ex.nome) ?? [];
        const pr = melhorLegado(metric, histPorNome.get(ex.nome) ?? []);
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
                {pr && <span className="pr-badge">PR {pr}</span>}
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
                  {formatarSerie(metricDeSerie(metric, s), s as SerieCampos)}
                  {s.is_pr ? " ⭐" : ""}
                </span>
                <button className="nav-link" style={{ ...smallBtn, color: "var(--neon)" }} onClick={() => api({ action: "remover_serie", id: s.id })}>
                  ✕
                </button>
              </div>
            ))}

            {/* Adicionar série — inputs mudam por metric_type */}
            <div className="set-row">
              <InputsPorTipo
                metric={metric}
                e={e}
                onChange={(patch) =>
                  setEntradas((prev) => ({ ...prev, [ex.id]: { ...(prev[ex.id] ?? {}), ...patch } }))
                }
              />
              <button className="btn btn-primary" style={{ padding: "8px 14px" }} disabled={ocupado} onClick={() => registrarSerie(ex)}>
                ✓
              </button>
            </div>

            {metric !== "weight_reps" && (
              <div className="subtle" style={{ fontSize: "0.65rem", marginTop: 4 }}>
                {METRIC_LABEL[metric]}
              </div>
            )}

            {hist.length > 0 && (
              <div className="subtle" style={{ fontSize: "0.7rem", marginTop: 6 }}>
                histórico: {hist.map((s) => formatarSerie(metricDeSerie(metric, s), s as SerieCampos)).join(" · ")}
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

// PR2: se a série antiga não tem metric_type gravado (linha pré-0035),
// usa o metric_type padrão do exercício. Preserva histórico sem migrar.
function metricDeSerie(fallback: MetricType, s: TreinoSerie): MetricType {
  const m = (s.metric_type ?? null) as MetricType | null;
  return m ?? fallback;
}

// Melhor série do histórico p/ mostrar como "PR X" na badge. Dimensão
// escolhida pelo metric_type. Retorna string formatada ou "".
function melhorLegado(metric: MetricType, series: TreinoSerie[]): string {
  if (!series.length) return "";
  switch (metric) {
    case "weight_reps":
    case "bw_weighted": {
      const kg = series.reduce((mx, s) => Math.max(mx, s.peso ?? 0), 0);
      return kg > 0 ? `${kg}kg` : "";
    }
    case "bw_reps": {
      const reps = series.reduce((mx, s) => Math.max(mx, s.reps ?? 0), 0);
      return reps > 0 ? `${reps} reps` : "";
    }
    case "time":
    case "duration": {
      const sec = series.reduce((mx, s) => Math.max(mx, s.seconds ?? 0), 0);
      return sec > 0 ? `${sec}s` : "";
    }
    case "distance": {
      const d = series.reduce((mx, s) => Math.max(mx, s.distance_m ?? 0), 0);
      return d > 0 ? `${d}m` : "";
    }
    default:
      return "";
  }
}

// PR2: inputs por metric_type. Cada tipo mostra os campos relevantes;
// os outros ficam ocultos pra evitar registrar "prancha 5kg × 8".
function InputsPorTipo({
  metric,
  e,
  onChange,
}: {
  metric: MetricType;
  e: Entrada;
  onChange: (patch: Entrada) => void;
}) {
  const input = (
    field: keyof Entrada,
    placeholder: string,
    width = 70,
  ) => (
    <input
      key={field}
      type="number"
      inputMode="decimal"
      placeholder={placeholder}
      value={e[field] ?? ""}
      onChange={(ev) => onChange({ [field]: ev.target.value } as Entrada)}
      style={{ ...inputMini, width }}
    />
  );

  switch (metric) {
    case "weight_reps":
      return (
        <>
          {input("peso", "kg")}
          <span className="subtle">×</span>
          {input("reps", "reps")}
        </>
      );
    case "bw_weighted":
      return (
        <>
          <span className="subtle" style={{ fontSize: "0.7rem" }}>+</span>
          {input("peso", "kg")}
          <span className="subtle">×</span>
          {input("reps", "reps")}
        </>
      );
    case "bw_assisted":
      return (
        <>
          <span className="subtle" style={{ fontSize: "0.7rem" }}>−</span>
          {input("assist_kg", "assist")}
          <span className="subtle">×</span>
          {input("reps", "reps")}
        </>
      );
    case "bw_reps":
      return <>{input("reps", "reps", 90)}</>;
    case "time":
      return <>{input("seconds", "segundos", 100)}</>;
    case "duration":
      return <>{input("seconds", "duração (s)", 110)}</>;
    case "distance":
      return <>{input("distance_m", "metros", 100)}</>;
    case "interval":
      return (
        <>
          {input("reps", "rounds")}
          <span className="subtle">×</span>
          {input("seconds", "s/round")}
        </>
      );
    case "custom":
      return (
        <>
          {input("peso", "kg?")}
          <span className="subtle">×</span>
          {input("reps", "reps?")}
        </>
      );
  }
}
