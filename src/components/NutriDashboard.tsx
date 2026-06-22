"use client";

// ============================================================
// Tela Nutri rica — design replicado do app antigo (anel de kcal + barras de
// macro + chips de categoria + lista de alimentos + cards de refeição).
// É o caminho OPCIONAL e detalhado: o 1-toque (acima, na BehaviorTab) segue
// sendo o piso. Registrar pelo alimento também dispara o reforço (hit-confirm
// + música), porque continua sendo um registro de Nutri.
// ============================================================

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisaoReforco, LogRow } from "@/lib/types";
import {
  CATEGORIAS,
  META_CARBO,
  META_GORDURA,
  META_KCAL,
  META_PROTEINA,
  escalar,
  type Alimento,
  type CategoriaAlimento,
} from "@/lib/alimentos";
import { MODELOS_DIETA } from "@/lib/dietas";
import { useHitConfirm } from "@/components/HitConfirm";
import { tocarUri } from "@/lib/spotify/playback";

export default function NutriDashboard({
  refeicoes,
  alimentos,
}: {
  refeicoes: LogRow[];
  alimentos: Alimento[];
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [cat, setCat] = useState<CategoriaAlimento>("proteina");
  const [busca, setBusca] = useState("");
  const [porcao, setPorcao] = useState("100");
  const [ocupado, setOcupado] = useState(false);
  const [modeloId, setModeloId] = useState<string | null>(null);
  const [gramasModelo, setGramasModelo] = useState<Record<string, string>>({});

  const porId = useMemo(
    () => new Map(alimentos.map((f) => [f.id, f])),
    [alimentos],
  );
  const nomePorId = useMemo(
    () => new Map(alimentos.map((f) => [f.id, f.nome])),
    [alimentos],
  );

  const totais = useMemo(() => {
    return refeicoes.reduce(
      (a, r) => ({
        kcal: a.kcal + (r.kcal ?? 0),
        p: a.p + (r.proteina ?? 0),
        c: a.c + (r.carbs ?? 0),
        g: a.g + (r.gordura ?? 0),
      }),
      { kcal: 0, p: 0, c: 0, g: 0 },
    );
  }, [refeicoes]);

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return alimentos.filter(
      (f) => f.cat === cat && (q === "" || f.nome.toLowerCase().includes(q)),
    );
  }, [cat, busca, alimentos]);

  async function adicionar(foodId: string) {
    const alimento = alimentos.find((f) => f.id === foodId);
    if (!alimento) return;
    const gramas = Number(porcao) || 100;
    const m = escalar(alimento, gramas);
    setOcupado(true);
    fire("HIT!");
    let dec: DecisaoReforco | null = null;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comportamento: "nutri_refeicao",
          food_id: foodId,
          kcal: m.kcal,
          proteina: m.p,
          carbs: m.c,
          gordura: m.g,
        }),
      });
      if (res.ok) dec = await res.json();
    } catch {
      dec = null;
    }
    if (dec?.jackpot) fire("JACKPOT!");
    if (dec?.musica && dec.modoAudio) {
      const ok = await tocarUri(dec.musica.uri);
      if (dec.modoAudio === "reward") {
        fetch("/api/spotify/mark-played", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            logId: dec.logId,
            faixaId: dec.musica.id,
            tipo: ok ? "faixa_cheia" : "fallback_local",
          }),
        }).catch(() => {});
      }
    }
    router.refresh();
    setOcupado(false);
  }

  // Registro em lote a partir de um modelo de dieta. Cada item vira um log de
  // nutri_refeicao (conta XP/atributo normalmente). A música (camada de reward)
  // é suprimida no lote pra não disparar N faixas de uma vez — o registro
  // avulso de alimento (acima) segue entregando a música normalmente.
  async function registrarItens(itens: { foodId: string; gramas: number }[]) {
    if (ocupado) return;
    setOcupado(true);
    fire("REFEIÇÃO!");
    for (const it of itens) {
      const al = porId.get(it.foodId);
      if (!al) continue;
      const g = it.gramas || 100;
      const m = escalar(al, g);
      try {
        await fetch("/api/log", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            comportamento: "nutri_refeicao",
            food_id: al.id,
            kcal: m.kcal,
            proteina: m.p,
            carbs: m.c,
            gordura: m.g,
          }),
        });
      } catch {
        /* segue o lote; o que entrou já contou */
      }
    }
    router.refresh();
    setOcupado(false);
  }

  async function remover(id: string) {
    await fetch(`/api/log?id=${id}`, { method: "DELETE" }).catch(() => {});
    router.refresh();
  }

  return (
    <div style={{ marginTop: 18 }}>
      {overlay}

      {/* Topo: anel de kcal + barras de macro */}
      <div className="panel" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <KcalRing consumido={totais.kcal} meta={META_KCAL} />
        <div style={{ flex: 1 }}>
          <MacroBar rotulo="Proteína" v={totais.p} meta={META_PROTEINA} cor="#4dd0e1" />
          <MacroBar rotulo="Carbo" v={totais.c} meta={META_CARBO} cor="#ffb74d" />
          <MacroBar rotulo="Gordura" v={totais.g} meta={META_GORDURA} cor="#fff176" />
        </div>
      </div>

      {/* Modelos de dieta prontos — só ajustar as gramas e registrar. */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Modelos de dieta · só ajuste as quantidades
        </div>
        <div className="chips-row">
          {MODELOS_DIETA.map((d) => (
            <button
              key={d.id}
              className="chip"
              style={{
                borderColor: modeloId === d.id ? "var(--gold)" : "var(--panel-border)",
                color: modeloId === d.id ? "var(--gold)" : "var(--text-dim)",
              }}
              onClick={() => setModeloId(modeloId === d.id ? null : d.id)}
            >
              {d.nome}
            </button>
          ))}
        </div>

        {(() => {
          const modelo = MODELOS_DIETA.find((d) => d.id === modeloId);
          if (!modelo) return null;
          // grama resolvida (override do usuário ou padrão do modelo).
          const gramaDe = (refIdx: number, i: number, padrao: number) => {
            const k = `${modelo.id}:${refIdx}:${i}`;
            const v = gramasModelo[k];
            return { k, g: v != null && v !== "" ? Number(v) || padrao : padrao };
          };
          return (
            <div style={{ marginTop: 10 }}>
              <p className="subtle" style={{ margin: "0 0 10px" }}>{modelo.descricao}</p>
              {modelo.refeicoes.map((ref, refIdx) => {
                const resolvidos = ref.itens.map((it, i) => {
                  const { g } = gramaDe(refIdx, i, it.gramas);
                  return { foodId: it.foodId, gramas: g };
                });
                return (
                  <div className="panel" key={ref.nome} style={{ marginBottom: 10, padding: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <strong>{ref.nome}</strong>
                      <button
                        className="btn btn-primary"
                        style={{ padding: "6px 12px" }}
                        disabled={ocupado}
                        onClick={() => registrarItens(resolvidos)}
                      >
                        Registrar refeição
                      </button>
                    </div>
                    {ref.itens.map((it, i) => {
                      const al = porId.get(it.foodId);
                      if (!al) return null;
                      const { k, g } = gramaDe(refIdx, i, it.gramas);
                      const m = escalar(al, g);
                      return (
                        <div className="set-row" key={k}>
                          <span style={{ flex: 1 }}>{al.nome}</span>
                          <input
                            type="number"
                            value={gramasModelo[k] ?? String(it.gramas)}
                            onChange={(e) =>
                              setGramasModelo((s) => ({ ...s, [k]: e.target.value }))
                            }
                            style={{ ...inputStyle, flex: "0 0 64px", width: 64, padding: 8 }}
                            aria-label={`gramas de ${al.nome}`}
                          />
                          <span className="subtle">g</span>
                          <span className="subtle" style={{ flex: "0 0 auto", fontSize: "0.7rem" }}>
                            {m.kcal}kcal
                          </span>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <button
                className="btn"
                style={{ width: "100%" }}
                disabled={ocupado}
                onClick={() =>
                  registrarItens(
                    modelo.refeicoes.flatMap((ref, refIdx) =>
                      ref.itens.map((it, i) => ({
                        foodId: it.foodId,
                        gramas: gramaDe(refIdx, i, it.gramas).g,
                      })),
                    ),
                  )
                }
              >
                Registrar o dia inteiro
              </button>
            </div>
          );
        })()}
      </div>

      {/* Seletor de alimentos */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Adicionar alimento avulso
        </div>
        <div className="chips-row">
          {CATEGORIAS.map((c) => (
            <button
              key={c.key}
              className="chip"
              style={{
                borderColor: cat === c.key ? c.cor : "var(--panel-border)",
                color: cat === c.key ? c.cor : "var(--text-dim)",
              }}
              onClick={() => setCat(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, margin: "10px 0" }}>
          <input
            placeholder="Buscar…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={inputStyle}
          />
          <input
            type="number"
            value={porcao}
            onChange={(e) => setPorcao(e.target.value)}
            style={{ ...inputStyle, width: 80 }}
            aria-label="porção em gramas"
          />
          <span className="subtle" style={{ alignSelf: "center" }}>g</span>
        </div>

        <div style={{ maxHeight: 240, overflowY: "auto" }}>
          {lista.map((f) => {
            const m = escalar(f, Number(porcao) || 100);
            return (
              <div key={f.id} className="food-row">
                <div>
                  <div style={{ fontWeight: 700 }}>{f.nome}</div>
                  <div className="subtle" style={{ fontSize: "0.72rem" }}>
                    {m.kcal} kcal · {m.p}p · {m.c}c · {m.g}g
                  </div>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ padding: "6px 12px" }}
                  disabled={ocupado}
                  onClick={() => adicionar(f.id)}
                >
                  +
                </button>
              </div>
            );
          })}
          {lista.length === 0 && <p className="subtle">Nada encontrado.</p>}
        </div>
      </div>

      {/* Refeições de hoje */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ marginBottom: 8 }}>Hoje</h3>
        {refeicoes.length === 0 && <p className="subtle">Nada registrado ainda.</p>}
        {refeicoes.map((r) => (
          <div className="meal-card" key={r.id}>
            <div>
              <div style={{ fontWeight: 700 }}>
                {r.comportamento === "nutri_agua"
                  ? "Água"
                  : (r.food_id && nomePorId.get(r.food_id)) || "Refeição"}
              </div>
              <div className="subtle" style={{ fontSize: "0.72rem" }}>
                {r.kcal != null
                  ? `${r.kcal} kcal · ${r.proteina ?? 0}p · ${r.carbs ?? 0}c · ${r.gordura ?? 0}g`
                  : new Date(r.ts).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
              </div>
            </div>
            <button
              className="nav-link"
              style={{ padding: "4px 8px", color: "var(--neon)" }}
              onClick={() => remover(r.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function KcalRing({ consumido, meta }: { consumido: number; meta: number }) {
  const pct = Math.min(100, (consumido / meta) * 100);
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: `conic-gradient(var(--neon) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 76,
          height: 76,
          borderRadius: "50%",
          background: "var(--bg-2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontWeight: 900, fontSize: "1.1rem" }}>{consumido}</div>
        <div className="subtle" style={{ fontSize: "0.6rem" }}>/ {meta} kcal</div>
      </div>
    </div>
  );
}

function MacroBar({
  rotulo,
  v,
  meta,
  cor,
}: {
  rotulo: string;
  v: number;
  meta: number;
  cor: string;
}) {
  const pct = Math.min(100, (v / meta) * 100);
  return (
    <div style={{ marginBottom: 8 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.72rem",
        }}
      >
        <span className="subtle">{rotulo}</span>
        <span className="subtle">
          {v}/{meta}g
        </span>
      </div>
      <div className="xp-bar" style={{ height: 8, marginTop: 2 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cor }} />
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
};
