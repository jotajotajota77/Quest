// v12: grid de photocards do usuário (client component).
// v12.4: legenda de raridade + modal on click (favoritar + trocar duplicata).
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PHOTOCARDS, SHARDS_POR_DUPLICATA, SHARDS_PARA_TROCA, type Photocard } from "@/lib/photocards";
import { SEASONS, seasonPorSlug } from "@/lib/seasons";
import { usePhotocardDrop } from "@/components/PhotocardDropToast";
import PhotocardArt from "@/components/PhotocardArt";

interface Props {
  itens: {
    item_id: string;
    quantidade: number;
    favorito: boolean;
    visto: boolean;
  }[];
  shards: number;
}

const CORES_RARIDADE: Record<string, string> = {
  regular: "var(--hairline)",
  rare: "var(--gold)",
  holo: "var(--lilac)",
  signature: "var(--neon-2)",
};

const LABEL_RARIDADE: Record<string, string> = {
  regular: "Regular",
  rare: "Rare",
  holo: "Holo",
  signature: "Signature",
};

// v12.4: definição curta pra tooltip/legenda.
const DEF_RARIDADE: Record<string, string> = {
  regular: "Comum — drop de boss semanal. Cresce a coleção rápido.",
  rare: "Rara — dropa em quests + finais de Ato. Cor dourada.",
  holo: "Holográfica — bater PR real de musculação dropa HOLO do personagem responsável pelo grupo.",
  signature: "Assinatura — drop único de boss de Ato derrotado. Peça mais valiosa.",
};

const LABEL_PERSONAGEM: Record<string, string> = {
  "ryuki-han":     "Ryuki",
  "ji-seok-moon":  "Ji-seok",
  "hujin-kim":     "Hujin",
  "sanhee-park":   "Sanhee",
  "chan-ho-lee":   "Chan-ho",
  "sanha":         "Sanha",
  "min":           "Min",
};

interface CardEstado {
  quantidade: number;
  favorito: boolean;
  visto: boolean;
}

export default function ColecaoGrid({ itens, shards: shardsInicial }: Props) {
  const router = useRouter();
  const [filtroSeason, setFiltroSeason] = useState<string>("todas");
  const [ocultarNaoPossuidas, setOcultar] = useState<boolean>(false);
  const [legendaAberta, setLegendaAberta] = useState<boolean>(false);
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [shards, setShards] = useState<number>(shardsInicial);
  const [ocupado, setOcupado] = useState<boolean>(false);
  const { showDrop, dropOverlay } = usePhotocardDrop();

  // Snapshot inicial das não vistas (mantém badge por sessão mesmo depois de marcar).
  const naoVistasIniciais = useMemo(() => {
    const s = new Set<string>();
    for (const i of itens) if (!i.visto) s.add(i.item_id);
    return s;
  }, [itens]);

  // Estado local por card (updates otimistas de favorito/quantidade).
  const [porItem, setPorItem] = useState<Map<string, CardEstado>>(() => {
    const m = new Map<string, CardEstado>();
    for (const i of itens) {
      m.set(i.item_id, { quantidade: i.quantidade, favorito: i.favorito, visto: i.visto });
    }
    return m;
  });

  const cardsFiltrados = useMemo(() => {
    return PHOTOCARDS.filter((p) => {
      if (filtroSeason !== "todas" && p.season !== filtroSeason) return false;
      if (ocultarNaoPossuidas && !porItem.has(p.id)) return false;
      return true;
    });
  }, [filtroSeason, porItem, ocultarNaoPossuidas]);

  const totalPossuidas = porItem.size;
  const totalCatalogo = PHOTOCARDS.length;

  const jaDisparado = useRef(false);
  useEffect(() => {
    if (jaDisparado.current) return;
    jaDisparado.current = true;
    const ids = Array.from(naoVistasIniciais);
    if (ids.length === 0) return;
    ids.slice(0, 3).forEach((id, i) => {
      setTimeout(() => {
        showDrop({ photocardId: id, header: `NOVA · ${i + 1}/${ids.length}` });
      }, i * 2800);
    });
    fetch("/api/colecao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "marcar_visto", item_ids: ids }),
    }).catch(() => {});
  }, [naoVistasIniciais, showDrop]);

  // ── actions ──
  async function favoritar(itemId: string, marcar: boolean) {
    setOcupado(true);
    setPorItem((prev) => {
      const n = new Map(prev);
      // se ligando favorito, desliga demais
      if (marcar) {
        for (const [k, v] of n) if (k !== itemId) n.set(k, { ...v, favorito: false });
      }
      const atual = n.get(itemId);
      if (atual) n.set(itemId, { ...atual, favorito: marcar });
      return n;
    });
    try {
      await fetch("/api/colecao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "favoritar", item_id: itemId, favorito: marcar }),
      });
    } finally {
      setOcupado(false);
    }
  }

  async function trocarDuplicata(itemId: string) {
    setOcupado(true);
    try {
      const res = await fetch("/api/colecao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "trocar_duplicata", item_id: itemId }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        shards_ganhos?: number;
        shards_totais?: number;
        quantidade_restante?: number;
      };
      if (json.error) {
        alert(`erro: ${json.error}`);
        return;
      }
      if (json.shards_totais != null) setShards(json.shards_totais);
      if (json.quantidade_restante != null) {
        setPorItem((prev) => {
          const n = new Map(prev);
          const atual = n.get(itemId);
          if (atual) n.set(itemId, { ...atual, quantidade: json.quantidade_restante ?? atual.quantidade });
          return n;
        });
      }
      showDrop({
        photocardId: itemId,
        header: "DUPLICATA TROCADA",
        bonus: `+${json.shards_ganhos ?? 0} shards`,
      });
      router.refresh();
    } finally {
      setOcupado(false);
    }
  }

  const cardSelecionado = selecionada ? PHOTOCARDS.find((p) => p.id === selecionada) ?? null : null;
  const estadoSelecionado = selecionada ? porItem.get(selecionada) ?? null : null;

  return (
    <>
      {dropOverlay}

      {/* Header + stats */}
      <div className="panel" style={{ marginBottom: 8, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="lbl">Coleção · photocards</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.85rem", marginTop: 2 }}>
              {totalPossuidas} / {totalCatalogo}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="lbl">Shards</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", color: "var(--gold)" }}>
              ✦ {shards}
            </div>
          </div>
        </div>
      </div>

      {/* v12.4: Legenda de raridade colapsável */}
      <div className="panel" style={{ marginBottom: 12, padding: "6px 12px" }}>
        <button
          onClick={() => setLegendaAberta((x) => !x)}
          style={{
            background: "transparent",
            border: "none",
            padding: 0,
            color: "var(--ink)",
            cursor: "pointer",
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "0.78rem",
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          <span>ℹ Legenda de raridade · shards</span>
          <span>{legendaAberta ? "▲" : "▼"}</span>
        </button>
        {legendaAberta && (
          <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
            {(["regular", "rare", "holo", "signature"] as const).map((r) => (
              <div key={r} style={{
                display: "grid", gap: 2, padding: "6px 8px",
                borderLeft: `3px solid ${CORES_RARIDADE[r]}`,
                background: "color-mix(in srgb, var(--surface) 60%, transparent)",
                borderRadius: 4,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ color: CORES_RARIDADE[r], fontSize: "0.82rem" }}>{LABEL_RARIDADE[r]}</strong>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.7rem", color: "var(--gold)" }}>
                    +{SHARDS_POR_DUPLICATA[r]} shards / duplicata
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--ink-dim)" }}>{DEF_RARIDADE[r]}</span>
              </div>
            ))}
            <p style={{ fontSize: "0.72rem", color: "var(--ink-dim)", margin: "4px 0 2px" }}>
              <strong style={{ color: "var(--gold)" }}>{SHARDS_PARA_TROCA} shards</strong> = 1 card aleatório da season (em breve na UI).
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
        <button
          className="chip"
          onClick={() => setFiltroSeason("todas")}
          style={{ borderColor: filtroSeason === "todas" ? "var(--neon)" : "var(--panel-border)" }}
        >
          Todas
        </button>
        {SEASONS.map((s) => (
          <button
            key={s.slug}
            className="chip"
            onClick={() => setFiltroSeason(s.slug)}
            style={{
              borderColor: filtroSeason === s.slug ? s.cor_primaria : "var(--panel-border)",
              color: filtroSeason === s.slug ? s.cor_primaria : undefined,
            }}
          >
            {s.nome}
          </button>
        ))}
        <button
          className="chip"
          onClick={() => setOcultar((x) => !x)}
          style={{ marginLeft: "auto", borderColor: ocultarNaoPossuidas ? "var(--gold)" : "var(--panel-border)" }}
        >
          {ocultarNaoPossuidas ? "Mostrar todas" : "Só as minhas"}
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
        {cardsFiltrados.map((card) => (
          <PhotocardTile
            key={card.id}
            card={card}
            estado={porItem.get(card.id) ?? null}
            isNew={naoVistasIniciais.has(card.id)}
            onClick={() => setSelecionada(card.id)}
          />
        ))}
      </div>

      {cardsFiltrados.length === 0 && (
        <p className="subtle" style={{ textAlign: "center", marginTop: 30 }}>
          Nenhuma photocard nesse filtro. Bata PR ou derrote o boss semanal pra desbloquear.
        </p>
      )}

      {/* v12.4: Modal detalhe + ações */}
      {cardSelecionado && (
        <CardDetalheModal
          card={cardSelecionado}
          estado={estadoSelecionado}
          ocupado={ocupado}
          onClose={() => setSelecionada(null)}
          onFavoritar={(marcar) => favoritar(cardSelecionado.id, marcar)}
          onTrocarDuplicata={() => trocarDuplicata(cardSelecionado.id)}
        />
      )}
    </>
  );
}

function PhotocardTile({
  card, estado, isNew, onClick,
}: {
  card: Photocard;
  estado: CardEstado | null;
  isNew: boolean;
  onClick: () => void;
}) {
  const possui = estado !== null;
  const season = seasonPorSlug(card.season);
  const borderColor = isNew ? "var(--neon)" : possui ? CORES_RARIDADE[card.raridade] : "var(--hairline)";
  const bgGradient = possui && season
    ? `linear-gradient(160deg, ${season.cor_primaria}22, ${season.cor_secundaria}22)`
    : "rgba(255,255,255,0.02)";

  return (
    <button
      onClick={onClick}
      aria-label={`${possui ? "Ver" : "Bloqueada"} ${LABEL_PERSONAGEM[card.personagem] ?? card.personagem} · ${LABEL_RARIDADE[card.raridade]}`}
      style={{
        position: "relative",
        aspectRatio: "2 / 3",
        borderRadius: 8,
        border: `2px solid ${borderColor}`,
        background: bgGradient,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 8,
        opacity: possui ? 1 : 0.42,
        filter: possui ? "none" : "grayscale(0.7)",
        boxShadow: isNew ? "0 0 16px var(--neon)" : undefined,
        cursor: "pointer",
        color: "var(--ink)",
        textAlign: "left",
        font: "inherit",
      }}
    >
      <div style={{
        fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.14em",
        textTransform: "uppercase", color: season?.cor_primaria ?? "var(--text-dim)",
      }}>
        {season?.nome ?? card.season}
      </div>

      <div style={{
        flex: 1, display: "grid", placeItems: "center",
        overflow: "hidden",
        fontSize: possui ? "1.8rem" : "3rem",
        color: possui ? "var(--text)" : "var(--text-dim)",
      }}>
        {possui ? <PhotocardArt card={card} emojiSize="1.8rem" /> : "?"}
      </div>

      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>
          {LABEL_PERSONAGEM[card.personagem] ?? card.personagem}
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          fontSize: "0.6rem", fontFamily: "var(--font-mono)",
          color: CORES_RARIDADE[card.raridade],
        }}>
          <span>{LABEL_RARIDADE[card.raridade]}</span>
          <span className="subtle">#{String(card.numero_serie).padStart(3, "0")}</span>
        </div>
      </div>

      {possui && estado && estado.quantidade > 1 && (
        <div style={{
          position: "absolute", top: 6, right: 6,
          background: "var(--gold)", color: "var(--surface)",
          borderRadius: 8, fontSize: "0.6rem", padding: "1px 5px", fontWeight: 800,
        }}>×{estado.quantidade}</div>
      )}

      {possui && estado?.favorito && (
        <div style={{ position: "absolute", top: 6, left: 6, fontSize: "0.75rem" }} title="Favorita">★</div>
      )}

      {possui && (card.raridade === "holo" || card.raridade === "signature") && (
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: card.raridade === "signature"
            ? "linear-gradient(115deg, transparent 40%, rgba(255,215,0,0.15) 50%, transparent 60%)"
            : "linear-gradient(115deg, transparent 40%, rgba(200,180,255,0.15) 50%, transparent 60%)",
        }} />
      )}

      {isNew && (
        <div style={{
          position: "absolute", top: 0, left: 0,
          padding: "2px 8px", background: "var(--neon)", color: "var(--surface)",
          fontFamily: "var(--font-mono)", fontSize: "0.58rem",
          letterSpacing: "0.14em", fontWeight: 800, borderBottomRightRadius: 6,
        }}>NEW</div>
      )}
    </button>
  );
}

// v12.4: modal de detalhe da photocard — arte grande + ações (favoritar +
// trocar duplicata). Ao invés de portal, renderiza como overlay fixo.
function CardDetalheModal({
  card, estado, ocupado, onClose, onFavoritar, onTrocarDuplicata,
}: {
  card: Photocard;
  estado: CardEstado | null;
  ocupado: boolean;
  onClose: () => void;
  onFavoritar: (marcar: boolean) => void;
  onTrocarDuplicata: () => void;
}) {
  const possui = estado !== null;
  const season = seasonPorSlug(card.season);
  const cor = CORES_RARIDADE[card.raridade];
  const podeTrocarDuplicata = possui && estado.quantidade > 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.72)",
        display: "grid", placeItems: "center", zIndex: 999, padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="panel"
        style={{
          width: "min(320px, 92vw)", padding: 16, borderLeft: `4px solid ${cor}`,
          display: "flex", flexDirection: "column", gap: 12,
        }}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          style={{
            alignSelf: "flex-end", background: "transparent", border: "none",
            color: "var(--ink-dim)", cursor: "pointer", fontSize: "1.4rem", lineHeight: 1,
            padding: 0, marginTop: -6,
          }}
        >×</button>

        {/* Card grande */}
        <div style={{
          alignSelf: "center", width: 180, aspectRatio: "2 / 3", borderRadius: 12,
          border: `3px solid ${cor}`,
          background: season
            ? `linear-gradient(160deg, ${season.cor_primaria}55, ${season.cor_secundaria}55)`
            : "rgba(20,20,30,0.9)",
          padding: 12, display: "flex", flexDirection: "column", justifyContent: "space-between",
          opacity: possui ? 1 : 0.5, filter: possui ? "none" : "grayscale(0.7)",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: "0.55rem", letterSpacing: "0.16em",
            textTransform: "uppercase", color: season?.cor_primaria ?? "var(--text-dim)",
          }}>{season?.nome ?? card.season}</div>
          <div style={{ flex: 1, display: "grid", placeItems: "center", fontSize: "2.8rem", overflow: "hidden" }}>
            {possui ? <PhotocardArt card={card} emojiSize="2.8rem" /> : "?"}
          </div>
          <div style={{ display: "grid", gap: 3 }}>
            <div style={{ fontSize: "0.9rem", fontWeight: 800 }}>
              {LABEL_PERSONAGEM[card.personagem] ?? card.personagem}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: "0.66rem",
              fontFamily: "var(--font-mono)", color: cor,
            }}>
              <span style={{ textTransform: "uppercase" }}>{LABEL_RARIDADE[card.raridade]}</span>
              <span className="subtle">#{String(card.numero_serie).padStart(3, "0")}</span>
            </div>
          </div>
        </div>

        {/* Flavor + status */}
        <p style={{ margin: 0, fontSize: "0.78rem", fontStyle: "italic", color: "var(--ink-dim)", textAlign: "center" }}>
          &quot;{card.flavor_quote}&quot;
        </p>
        {possui ? (
          <div className="subtle" style={{ fontFamily: "var(--font-mono)", fontSize: "0.72rem", textAlign: "center" }}>
            Tem {estado.quantidade} {estado.quantidade === 1 ? "cópia" : "cópias"} · {estado.favorito ? "★ favorita" : "não favorita"}
          </div>
        ) : (
          <div className="subtle" style={{ fontSize: "0.72rem", textAlign: "center" }}>
            Ainda não desbloqueada. Bata PR ou derrote o boss semanal.
          </div>
        )}

        {/* Ações */}
        {possui && (
          <div style={{ display: "grid", gap: 6 }}>
            <button
              className="btn btn-primary"
              disabled={ocupado}
              onClick={() => onFavoritar(!estado.favorito)}
              style={{ padding: "8px 10px", fontSize: "0.82rem" }}
            >
              {estado.favorito ? "★ Desfavoritar" : "☆ Marcar como favorita"}
            </button>
            <button
              className="btn"
              disabled={ocupado || !podeTrocarDuplicata}
              onClick={onTrocarDuplicata}
              style={{
                padding: "8px 10px", fontSize: "0.82rem",
                background: podeTrocarDuplicata ? "var(--surface)" : "transparent",
                border: `1px solid ${podeTrocarDuplicata ? "var(--gold)" : "var(--hairline)"}`,
                color: podeTrocarDuplicata ? "var(--gold)" : "var(--ink-dim)",
                cursor: podeTrocarDuplicata ? "pointer" : "not-allowed",
              }}
            >
              {podeTrocarDuplicata
                ? `Trocar 1 duplicata por +${SHARDS_POR_DUPLICATA[card.raridade]} shards`
                : "Precisa ter 2+ cópias pra trocar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// emojiConceito foi movido pra PhotocardArt.tsx e usado pelo fallback do
// componente. Este arquivo não usa mais diretamente.
