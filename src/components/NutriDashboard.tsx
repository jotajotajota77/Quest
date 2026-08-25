"use client";

// ============================================================
// Tela Nutri rica — design replicado do app antigo (anel de kcal + barras de
// macro + chips de categoria + lista de alimentos + cards de refeição).
// É o caminho OPCIONAL e detalhado: o 1-toque (acima, na BehaviorTab) segue
// sendo o piso. Registrar pelo alimento também dispara o reforço (hit-confirm
// + música), porque continua sendo um registro de Nutri.
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DecisaoReforco, LogRow } from "@/lib/types";
import {
  META_CARBO,
  META_GORDURA,
  META_KCAL,
  META_PROTEINA,
  escalar,
  type Alimento,
} from "@/lib/alimentos";
import { MODELOS_DIETA } from "@/lib/dietas";
import { useHitConfirm } from "@/components/HitConfirm";
import { tocarUri } from "@/lib/spotify/playback";
import { somComida } from "@/lib/som";

export interface NutriTarget {
  /** kcal alvo central. */
  kcal: number;
  /** faixa saudável [min, max] — banda em vez de meta rígida (§20). */
  kcal_range: [number, number];
  /** proteína g/dia alvo. */
  protein_g: number;
  /** proteína faixa saudável [min, max]. */
  protein_range: [number, number];
  /** origem do target: 'inicial' | 'engine' | 'manual' | 'phase_change'. */
  origem: string | null;
  /** tipo da fase ativa — afeta "Travel Mode" banner (§23). */
  fase_type: string;
}

export default function NutriDashboard({
  refeicoes,
  alimentosModelo,
  nomesHoje,
  target,
}: {
  refeicoes: LogRow[];
  // Só os alimentos referenciados pelos modelos de dieta (catálogo cheio é
  // consultado por busca server-side em /api/food).
  alimentosModelo: Alimento[];
  // food_id → nome dos registros de hoje (p/ a lista "Hoje").
  nomesHoje: Record<string, string>;
  /**
   * Target vigente vindo de nutrition_target (PR5, §20-24). Zonas em vez
   * de metas rígidas. Opcional pra não quebrar callsites; fallback usa
   * as constantes antigas.
   */
  target?: NutriTarget | null;
}) {
  const zonaKcal: [number, number] = target?.kcal_range ?? [META_KCAL, META_KCAL];
  const alvoKcal = target?.kcal ?? META_KCAL;
  const zonaProt: [number, number] = target?.protein_range ?? [META_PROTEINA, META_PROTEINA];
  const alvoProt = target?.protein_g ?? META_PROTEINA;
  const travelAtivo = target?.fase_type === "travel";
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [busca, setBusca] = useState("");
  const [porcao, setPorcao] = useState("100");
  const [ocupado, setOcupado] = useState(false);
  const [modeloId, setModeloId] = useState<string | null>(null);
  const [gramasModelo, setGramasModelo] = useState<Record<string, string>>({});
  const [musicaMsg, setMusicaMsg] = useState<string | null>(null);
  const [faixaPendente, setFaixaPendente] = useState<{
    id: string;
    uri: string;
    nome: string;
    artistas: string;
    capa: string | null;
    logId?: string;
    modoAudio: "reward" | "trilha";
  } | null>(null);
  const [resultados, setResultados] = useState<Alimento[]>([]);
  const [buscando, setBuscando] = useState(false);

  const porId = useMemo(
    () => new Map(alimentosModelo.map((f) => [f.id, f])),
    [alimentosModelo],
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

  // Busca server-side no catálogo grande (debounced), GERAL (sem categoria).
  useEffect(() => {
    let cancel = false;
    setBuscando(true);
    const t = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (busca.trim()) params.set("q", busca.trim());
        const res = await fetch(`/api/food?${params.toString()}`);
        const j = res.ok ? await res.json() : { alimentos: [] };
        if (!cancel) setResultados((j.alimentos as Alimento[]) ?? []);
      } catch {
        if (!cancel) setResultados([]);
      } finally {
        if (!cancel) setBuscando(false);
      }
    }, 250);
    return () => {
      cancel = true;
      clearTimeout(t);
    };
  }, [busca]);

  async function adicionar(alimento: Alimento) {
    // Reforço DIFERENCIAL: comida saudável → reforço imediato (HIT + som +
    // música). Junk (categoria "doce") → NULIDADE: registra honestamente pro
    // coach, mas sem nenhum reforço sensorial (sem pop, sem som, sem música).
    const junk = alimento.cat === "doce";
    const gramas = Number(porcao) || 100;
    const m = escalar(alimento, gramas);
    setOcupado(true);
    if (!junk) {
      fire("HIT!");
      somComida();
    }
    let dec: DecisaoReforco | null = null;
    try {
      const res = await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comportamento: "nutri_refeicao",
          food_id: alimento.id,
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
    // Junk não dispara reforço de áudio/jackpot — fica neutro.
    if (!junk && dec?.jackpot) fire("JACKPOT!");
    if (!junk) {
      if (!dec?.musica) {
        setMusicaMsg("🎵 sem faixa nova — conecte o Spotify (botão acima).");
        setFaixaPendente(null);
      } else if (dec.modoAudio) {
        // NÃO toca sozinho: libera o player pra você tocar com um toque (mais
        // confiável no celular — play precisa de gesto do usuário).
        setMusicaMsg(null);
        setFaixaPendente({
          id: dec.musica.id,
          uri: dec.musica.uri,
          nome: dec.musica.nome,
          artistas: dec.musica.artistas,
          capa: dec.musica.capa,
          logId: dec.logId,
          modoAudio: dec.modoAudio,
        });
      }
    }
    router.refresh();
    setOcupado(false);
  }

  // Toca a faixa liberada (clique do usuário). Marca como tocada só agora.
  async function tocarPendente() {
    if (!faixaPendente) return;
    const ok = await tocarUri(faixaPendente.uri);
    setMusicaMsg(
      ok
        ? `🎵 tocando: ${faixaPendente.nome} — ${faixaPendente.artistas}`
        : "🎵 não tocou — abra o app do Spotify e dê play em algo (vira o device ativo), depois toque aqui de novo.",
    );
    if (faixaPendente.modoAudio === "reward") {
      fetch("/api/spotify/mark-played", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          logId: faixaPendente.logId,
          faixaId: faixaPendente.id,
          tipo: ok ? "faixa_cheia" : "fallback_local",
        }),
      }).catch(() => {});
    }
    if (ok) setFaixaPendente(null);
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

      {/* Player liberado ao registrar — você toca com um clique (não autoplay). */}
      {faixaPendente && (
        <div
          className="panel"
          style={{
            marginBottom: 10,
            borderColor: "var(--neon)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {faixaPendente.capa && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={faixaPendente.capa}
              alt=""
              style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover", flexShrink: 0 }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="lbl" style={{ fontSize: "0.66rem" }}>
              Recompensa liberada
            </div>
            <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {faixaPendente.nome}
            </div>
            <div className="subtle" style={{ fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {faixaPendente.artistas}
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: "10px 16px", flexShrink: 0 }}
            onClick={tocarPendente}
          >
            ▶ Tocar
          </button>
          <button
            className="nav-link"
            style={{ padding: "6px 8px", fontSize: "0.72rem", flexShrink: 0 }}
            onClick={() => setFaixaPendente(null)}
            aria-label="Dispensar"
          >
            ✕
          </button>
        </div>
      )}

      {musicaMsg && (
        <div
          className="panel"
          style={{ marginBottom: 10, borderColor: "var(--neon-2)", display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}
        >
          <span className="subtle">{musicaMsg}</span>
          <button className="nav-link" style={{ padding: "4px 8px", fontSize: "0.72rem" }} onClick={() => setMusicaMsg(null)}>✕</button>
        </div>
      )}

      {travelAtivo && (
        <div
          className="panel"
          style={{ marginBottom: 10, borderColor: "var(--belt-gold)", padding: "8px 12px" }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--belt-gold)" }}>
            ✈ Travel Mode ativo
          </div>
          <div className="subtle" style={{ fontSize: "0.68rem", marginTop: 2 }}>
            Proteína piso: <strong>{zonaProt[0]}g</strong>. Kcal em zona ampla.
            Logging simplificado — sem estresse §23.
          </div>
        </div>
      )}

      {/* Topo: anel de kcal (zona) + barras de macro */}
      <div className="panel" style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <KcalRing consumido={totais.kcal} alvo={alvoKcal} zona={zonaKcal} />
        <div style={{ flex: 1 }}>
          <MacroBar rotulo="Proteína" v={totais.p} meta={alvoProt} zona={zonaProt} cor="#4dd0e1" />
          <MacroBar rotulo="Carbo" v={totais.c} meta={META_CARBO} cor="#ffb74d" />
          <MacroBar rotulo="Gordura" v={totais.g} meta={META_GORDURA} cor="#fff176" />
        </div>
      </div>
      {target && (
        <div className="subtle" style={{ fontSize: "0.65rem", marginTop: 4, marginBottom: 8, textAlign: "center" }}>
          zona {zonaKcal[0]}–{zonaKcal[1]} kcal · proteína {zonaProt[0]}–{zonaProt[1]}g
          {target.origem && target.origem !== "inicial" && ` · fonte: ${target.origem}`}
        </div>
      )}

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

      {/* Seletor de alimentos — busca GERAL (todas as categorias juntas) */}
      <div className="panel" style={{ marginTop: 12 }}>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Adicionar alimento avulso
        </div>

        <div style={{ display: "flex", gap: 8, margin: "0 0 10px" }}>
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
          {resultados.map((f) => {
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
                  onClick={() => adicionar(f)}
                >
                  +
                </button>
              </div>
            );
          })}
          {!buscando && resultados.length === 0 && (
            <p className="subtle">Nada encontrado.</p>
          )}
          {buscando && resultados.length === 0 && (
            <p className="subtle">Buscando…</p>
          )}
          {resultados.length >= 60 && (
            <p className="subtle" style={{ fontSize: "0.7rem", textAlign: "center" }}>
              Mostrando os primeiros 60 — refine a busca pra achar mais.
            </p>
          )}
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
                  : (r.food_id && nomesHoje[r.food_id]) || "Refeição"}
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

function KcalRing({
  consumido,
  alvo,
  zona,
}: {
  consumido: number;
  alvo: number;
  zona: [number, number];
}) {
  // §20: zona, não meta rígida. Anel usa o TETO da zona pra escala; a
  // parte "dentro da zona" fica verde-chama, "abaixo" ou "acima" fica
  // dim. Nenhuma penalidade — só sinalização.
  const [min, max] = zona;
  const escala = Math.max(max, 1);
  const pct = Math.min(100, (consumido / escala) * 100);
  const dentro = consumido >= min && consumido <= max;
  const acima = consumido > max;
  const cor = dentro ? "var(--chama)" : acima ? "var(--kihap)" : "var(--calm)";
  return (
    <div
      style={{
        width: 96,
        height: 96,
        borderRadius: "50%",
        background: `conic-gradient(${cor} ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
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
        <div className="subtle" style={{ fontSize: "0.55rem", textAlign: "center" }}>
          / {alvo} kcal
        </div>
      </div>
    </div>
  );
}

function MacroBar({
  rotulo,
  v,
  meta,
  cor,
  zona,
}: {
  rotulo: string;
  v: number;
  meta: number;
  cor: string;
  /** Se dado, mostra faixa saudável [min, max] em vez de meta fixa (§20). */
  zona?: [number, number];
}) {
  const escala = Math.max(zona?.[1] ?? meta, 1);
  const pct = Math.min(100, (v / escala) * 100);
  // Marker do piso (proteína piso §96-97 — importante em Travel Mode).
  const pisoPct = zona ? Math.min(100, (zona[0] / escala) * 100) : null;
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
          {zona && (
            <span style={{ marginLeft: 4, opacity: 0.7 }}>
              · zona {zona[0]}–{zona[1]}
            </span>
          )}
        </span>
      </div>
      <div className="xp-bar" style={{ height: 8, marginTop: 2, position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: cor }} />
        {pisoPct != null && (
          <div
            style={{
              position: "absolute",
              left: `${pisoPct}%`,
              top: -2,
              bottom: -2,
              width: 2,
              background: "var(--belt-gold)",
            }}
            title={`piso ${zona![0]}g`}
          />
        )}
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
