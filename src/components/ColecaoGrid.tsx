// v12: grid de photocards do usuário (client component).
// Suporta filtro por season, exibe slots vazios (silhueta) do que falta.
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PHOTOCARDS, type Photocard } from "@/lib/photocards";
import { SEASONS, seasonPorSlug } from "@/lib/seasons";
import { usePhotocardDrop } from "@/components/PhotocardDropToast";

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

const LABEL_PERSONAGEM: Record<string, string> = {
  "ryuki-han":     "Ryuki",
  "ji-seok-moon":  "Ji-seok",
  "hujin-kim":     "Hujin",
  "sanhee-park":   "Sanhee",
  "chan-ho-lee":   "Chan-ho",
  "sanha":         "Sanha",
};

export default function ColecaoGrid({ itens, shards }: Props) {
  const [filtroSeason, setFiltroSeason] = useState<string>("todas");
  const [ocultarNaoPossuidas, setOcultar] = useState<boolean>(false);
  const { showDrop, dropOverlay } = usePhotocardDrop();

  // v12 PR3: snapshot dos NEW no mount. Mantemos o badge visível na sessão
  // atual (mesmo depois do POST marcar_visto) pra o usuário achar as cartas.
  const naoVistasIniciais = useMemo(() => {
    const s = new Set<string>();
    for (const i of itens) if (!i.visto) s.add(i.item_id);
    return s;
  }, [itens]);

  const possuidas = useMemo(() => {
    const m = new Map<string, { quantidade: number; favorito: boolean; visto: boolean }>();
    for (const i of itens) {
      m.set(i.item_id, {
        quantidade: i.quantidade,
        favorito: i.favorito,
        visto: i.visto,
      });
    }
    return m;
  }, [itens]);

  // Ao montar, dispara overlay pra CADA drop novo em sequência (max 3, pra
  // não spammar), depois marca todos como vistos no servidor.
  const jaDisparado = useRef(false);
  useEffect(() => {
    if (jaDisparado.current) return;
    jaDisparado.current = true;
    const ids = Array.from(naoVistasIniciais);
    if (ids.length === 0) return;
    // Desfile: mostra a primeira agora, as próximas espaçadas.
    ids.slice(0, 3).forEach((id, i) => {
      setTimeout(() => {
        showDrop({ photocardId: id, header: `NOVA · ${i + 1}/${ids.length}` });
      }, i * 2800);
    });
    // Marca como vistas no servidor (não bloqueante).
    fetch("/api/colecao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "marcar_visto", item_ids: ids }),
    }).catch(() => {});
  }, [naoVistasIniciais, showDrop]);

  const cardsFiltrados = useMemo(() => {
    return PHOTOCARDS.filter((p) => {
      if (filtroSeason !== "todas" && p.season !== filtroSeason) return false;
      if (ocultarNaoPossuidas && !possuidas.has(p.id)) return false;
      return true;
    });
  }, [filtroSeason, possuidas, ocultarNaoPossuidas]);

  const totalPossuidas = itens.length;
  const totalCatalogo = PHOTOCARDS.length;

  return (
    <>
      {dropOverlay}
      {/* Header + stats */}
      <div className="panel" style={{ marginBottom: 12, padding: "10px 12px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
          <div>
            <div className="lbl">Coleção · photocards</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.85rem",
                marginTop: 2,
              }}
            >
              {totalPossuidas} / {totalCatalogo}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="lbl">Shards</div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.9rem",
                color: "var(--gold)",
              }}
            >
              ✦ {shards}
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div
        style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 12,
        }}
      >
        <button
          className="chip"
          onClick={() => setFiltroSeason("todas")}
          style={{
            borderColor: filtroSeason === "todas" ? "var(--neon)" : "var(--panel-border)",
          }}
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
          style={{
            marginLeft: "auto",
            borderColor: ocultarNaoPossuidas ? "var(--gold)" : "var(--panel-border)",
          }}
        >
          {ocultarNaoPossuidas ? "Mostrar todas" : "Só as minhas"}
        </button>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: 10,
        }}
      >
        {cardsFiltrados.map((card) => (
          <PhotocardTile
            key={card.id}
            card={card}
            estado={possuidas.get(card.id) ?? null}
            isNew={naoVistasIniciais.has(card.id)}
          />
        ))}
      </div>

      {cardsFiltrados.length === 0 && (
        <p className="subtle" style={{ textAlign: "center", marginTop: 30 }}>
          Nenhuma photocard nesse filtro. Bata PR ou derrote o boss semanal pra desbloquear.
        </p>
      )}
    </>
  );
}

function PhotocardTile({
  card,
  estado,
  isNew,
}: {
  card: Photocard;
  estado: { quantidade: number; favorito: boolean; visto: boolean } | null;
  isNew: boolean;
}) {
  const possui = estado !== null;
  const season = seasonPorSlug(card.season);
  const borderColor = isNew
    ? "var(--neon)"
    : possui
      ? CORES_RARIDADE[card.raridade]
      : "var(--hairline)";
  const bgGradient = possui && season
    ? `linear-gradient(160deg, ${season.cor_primaria}22, ${season.cor_secundaria}22)`
    : "rgba(255,255,255,0.02)";

  return (
    <div
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
      }}
    >
      {/* Season stamp topo */}
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "0.55rem",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: season?.cor_primaria ?? "var(--text-dim)",
        }}
      >
        {season?.nome ?? card.season}
      </div>

      {/* Espaço da arte — silhueta se não possui */}
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          fontSize: possui ? "1.8rem" : "3rem",
          color: possui ? "var(--text)" : "var(--text-dim)",
        }}
      >
        {possui ? emojiConceito(card.conceito) : "?"}
      </div>

      {/* Rodapé com personagem + raridade */}
      <div style={{ display: "grid", gap: 2 }}>
        <div style={{ fontSize: "0.72rem", fontWeight: 700 }}>
          {LABEL_PERSONAGEM[card.personagem] ?? card.personagem}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: "0.6rem",
            fontFamily: "var(--font-mono)",
            color: CORES_RARIDADE[card.raridade],
          }}
        >
          <span>{LABEL_RARIDADE[card.raridade]}</span>
          <span className="subtle">#{String(card.numero_serie).padStart(3, "0")}</span>
        </div>
      </div>

      {/* Indicador de duplicata */}
      {possui && estado && estado.quantidade > 1 && (
        <div
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            background: "var(--gold)",
            color: "var(--surface)",
            borderRadius: 8,
            fontSize: "0.6rem",
            padding: "1px 5px",
            fontWeight: 800,
          }}
        >
          ×{estado.quantidade}
        </div>
      )}

      {/* Estrela de favorita */}
      {possui && estado?.favorito && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            fontSize: "0.75rem",
          }}
          title="Favorita"
        >
          ★
        </div>
      )}

      {/* Holo/signature accent no fundo */}
      {possui && (card.raridade === "holo" || card.raridade === "signature") && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              card.raridade === "signature"
                ? "linear-gradient(115deg, transparent 40%, rgba(255,215,0,0.15) 50%, transparent 60%)"
                : "linear-gradient(115deg, transparent 40%, rgba(200,180,255,0.15) 50%, transparent 60%)",
          }}
        />
      )}

      {/* v12 PR3: fita NEW pra drops recém-caídos (marcados como visto no
          servidor no mount, mas o badge fica pela sessão pra facilitar achar). */}
      {isNew && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            padding: "2px 8px",
            background: "var(--neon)",
            color: "var(--surface)",
            fontFamily: "var(--font-mono)",
            fontSize: "0.58rem",
            letterSpacing: "0.14em",
            fontWeight: 800,
            borderBottomRightRadius: 6,
          }}
        >
          NEW
        </div>
      )}
    </div>
  );
}

function emojiConceito(conceito: string): string {
  switch (conceito) {
    case "y2k": return "💿";
    case "street": return "🌆";
    case "dark": return "🌑";
    case "fresh": return "🌱";
    case "athlete": return "🏅";
    case "retro": return "📼";
    case "hiphop": return "🎧";
    case "uniform": return "🎖️";
    default: return "✦";
  }
}
