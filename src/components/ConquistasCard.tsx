// ============================================================
// ConquistasCard — grid de badges. Mostra unlocked (colorido) + locked
// (opaco com progresso). Server component: recebe as duas listas prontas.
// ============================================================
import type { Conquista, CategoriaConquista, ConquistaComProgresso } from "@/lib/conquistas";
import { LABEL_CATEGORIA } from "@/lib/conquistas";

interface Props {
  unlocked: Conquista[];
  locked: ConquistaComProgresso[];
  novas?: Conquista[];
}

export default function ConquistasCard({ unlocked, locked, novas = [] }: Props) {
  const total = unlocked.length + locked.length;
  const novasSet = new Set(novas.map((n) => n.id));

  // Agrupa por categoria
  type Item = { titulo: string; icone: string; descricao: string; id: string; locked: boolean; progresso?: { atual: number; alvo: number } | null };
  const porCategoria: Record<CategoriaConquista, Item[]> = {
    streak: [],
    musculacao: [],
    tkd: [],
    danca: [],
    faixa: [],
    meta: [],
    ritual: [],
  };
  for (const c of unlocked) porCategoria[c.categoria].push({ titulo: c.titulo, icone: c.icone, descricao: c.descricao, id: c.id, locked: false });
  for (const c of locked) porCategoria[c.categoria].push({ titulo: c.titulo, icone: c.icone, descricao: c.descricao, id: c.id, locked: true, progresso: c.progresso });

  return (
    <div className="panel" style={{ marginBottom: 14, borderLeft: "3px solid var(--gold)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div className="lbl">Conquistas · {unlocked.length}/{total}</div>
        {novas.length > 0 && (
          <span
            className="pr-badge"
            style={{
              color: "var(--good)",
              fontFamily: "var(--font-mono)",
              fontSize: "0.7rem",
            }}
          >
            ✨ {novas.length} nova{novas.length === 1 ? "" : "s"}
          </span>
        )}
      </div>

      {(Object.keys(porCategoria) as CategoriaConquista[]).map((cat) => {
        const itens = porCategoria[cat];
        if (itens.length === 0) return null;
        return (
          <div key={cat} style={{ marginTop: 12 }}>
            <div
              className="subtle"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "0.66rem",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                marginBottom: 6,
              }}
            >
              {LABEL_CATEGORIA[cat]}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: 8,
              }}
            >
              {itens.map((c) => {
                const isNova = novasSet.has(c.id);
                const locked = c.locked;
                const progresso = c.progresso;
                return (
                  <div
                    key={c.id}
                    title={`${c.titulo} — ${c.descricao}`}
                    style={{
                      padding: 8,
                      borderRadius: 10,
                      border: `1px solid ${locked ? "var(--hairline)" : isNova ? "var(--good)" : "var(--gold)"}`,
                      background: locked
                        ? "transparent"
                        : isNova
                          ? "color-mix(in srgb, var(--good) 12%, transparent)"
                          : "color-mix(in srgb, var(--gold) 10%, transparent)",
                      opacity: locked ? 0.45 : 1,
                      display: "grid",
                      gap: 2,
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: "1.6rem", lineHeight: 1 }}>{c.icone}</div>
                    <div
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        color: locked ? "var(--text-dim)" : "var(--text)",
                      }}
                    >
                      {c.titulo}
                    </div>
                    <div
                      className="subtle"
                      style={{
                        fontSize: "0.6rem",
                        lineHeight: 1.2,
                        color: locked ? "var(--text-dim)" : "var(--text-dim)",
                      }}
                    >
                      {locked && progresso
                        ? `${progresso.atual}/${progresso.alvo}`
                        : c.descricao.length > 40
                          ? c.descricao.slice(0, 40) + "…"
                          : c.descricao}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
