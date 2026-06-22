"use client";

// ============================================================
// Registro rico de LEITURA — livro, páginas e tempo (v4 afinamento).
// O 1-toque (BehaviorTab) continua sendo o piso; este formulário é o caminho
// detalhado OPCIONAL. Registrar aqui também cria um log de `leitura` → conta
// pro reforço (Sabedoria + hit-confirm) e pros fragmentos do mundo.
// ============================================================

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { LogRow } from "@/lib/types";
import { useHitConfirm } from "@/components/HitConfirm";

export default function LeituraForm({
  recentes,
  totalPaginas,
  totalMinutos,
}: {
  recentes: LogRow[];
  totalPaginas: number;
  totalMinutos: number;
}) {
  const router = useRouter();
  const { fire, overlay } = useHitConfirm();
  const [livro, setLivro] = useState("");
  const [paginas, setPaginas] = useState("");
  const [minutos, setMinutos] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function registrar() {
    if (ocupado) return;
    setOcupado(true);
    fire("LEITURA!");
    try {
      await fetch("/api/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comportamento: "leitura",
          livro: livro.trim() || undefined,
          paginas: paginas ? Number(paginas) : undefined,
          minutos: minutos ? Number(minutos) : undefined,
        }),
      });
    } catch {
      /* reforço local já ocorreu */
    }
    setLivro("");
    setPaginas("");
    setMinutos("");
    router.refresh();
    setOcupado(false);
  }

  return (
    <div style={{ marginTop: 18 }}>
      {overlay}

      <div className="panel" style={{ borderColor: "var(--neon-2)" }}>
        <div className="lbl" style={{ marginBottom: 8 }}>
          Registrar leitura · livro, páginas e tempo
        </div>
        <input
          placeholder="Livro (ex.: Hábitos Atômicos)"
          value={livro}
          onChange={(e) => setLivro(e.target.value)}
          style={inputStyle}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            type="number"
            inputMode="numeric"
            placeholder="páginas"
            value={paginas}
            onChange={(e) => setPaginas(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            aria-label="páginas lidas"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="minutos"
            value={minutos}
            onChange={(e) => setMinutos(e.target.value)}
            style={{ ...inputStyle, flex: 1 }}
            aria-label="minutos de leitura"
          />
        </div>
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 10 }}
          disabled={ocupado}
          onClick={registrar}
        >
          Registrar leitura
        </button>
      </div>

      {(totalPaginas > 0 || totalMinutos > 0) && (
        <div className="stat-row" style={{ marginTop: 12, gridTemplateColumns: "repeat(2, 1fr)" }}>
          <div className="stat">
            <div className="num">{totalPaginas}</div>
            <div className="lbl">páginas lidas</div>
          </div>
          <div className="stat">
            <div className="num">{totalMinutos}</div>
            <div className="lbl">minutos lendo</div>
          </div>
        </div>
      )}

      {recentes.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <h3 style={{ marginBottom: 8 }}>Sessões recentes</h3>
          {recentes.map((l) => (
            <div className="meal-card" key={l.id}>
              <div>
                <div style={{ fontWeight: 700 }}>{l.livro || "Leitura"}</div>
                <div className="subtle" style={{ fontSize: "0.72rem" }}>
                  {[
                    l.paginas != null ? `${l.paginas} pág` : null,
                    l.minutos != null ? `${l.minutos} min` : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") ||
                    new Date(l.ts).toLocaleString("pt-BR")}
                </div>
              </div>
              <span className="subtle" style={{ fontSize: "0.7rem" }}>
                {new Date(l.ts).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 10,
  borderRadius: 10,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
};
