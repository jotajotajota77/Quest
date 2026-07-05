"use client";

// Biblioteca viva de exercícios (v8) — camada opt-in de EXPLORAR (o registro
// segue 1-toque em outro lugar). Busca + filtros (grupo/equipamento/casa) +
// descoberta ("sugerir") + ficha detalhada (músculos, execução, cue, erro,
// variações). "+ Adicionar" põe no plano do split atual.
import { useMemo, useState } from "react";
import type { ExercicioBib } from "@/lib/data";

export default function BibliotecaExercicios({
  exercicios,
  onAdd,
  onClose,
}: {
  exercicios: ExercicioBib[];
  onAdd: (nome: string, grupo: string) => void;
  onClose: () => void;
}) {
  const [busca, setBusca] = useState("");
  const [grupo, setGrupo] = useState<string | null>(null);
  const [soCasa, setSoCasa] = useState(false);
  const [aberto, setAberto] = useState<string | null>(null); // id da ficha aberta
  const [destaque, setDestaque] = useState<string | null>(null);

  const grupos = useMemo(
    () => [...new Set(exercicios.map((e) => e.grupo_muscular))],
    [exercicios],
  );

  const lista = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return exercicios.filter(
      (e) =>
        (!grupo || e.grupo_muscular === grupo) &&
        (!soCasa || e.casa_ok) &&
        (q === "" ||
          e.nome.toLowerCase().includes(q) ||
          e.musculos.some((m) => m.toLowerCase().includes(q))),
    );
  }, [exercicios, busca, grupo, soCasa]);

  function sugerir() {
    if (lista.length === 0) return;
    const e = lista[Math.floor(Math.random() * lista.length)];
    setAberto(e.id);
    setDestaque(e.id);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, padding: 14 }}
      onClick={onClose}
    >
      <div className="panel" style={{ maxWidth: 460, width: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <h3 style={{ margin: 0 }}>Biblioteca de exercícios</h3>
          <button className="nav-link" style={{ padding: "6px 10px", fontSize: "0.75rem" }} onClick={sugerir}>
            🎲 Sugerir
          </button>
        </div>

        <input
          placeholder="Buscar por nome ou músculo…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={inputStyle}
        />
        <div className="chips-row" style={{ marginTop: 8 }}>
          <button className="chip" style={chipStyle(!grupo)} onClick={() => setGrupo(null)}>todos</button>
          {grupos.map((g) => (
            <button key={g} className="chip" style={chipStyle(grupo === g)} onClick={() => setGrupo(g)}>{g}</button>
          ))}
        </div>
        <label className="subtle" style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: "0.75rem", cursor: "pointer" }}>
          <input type="checkbox" checked={soCasa} onChange={(e) => setSoCasa(e.target.checked)} />
          só dá pra fazer em casa (sem máquina)
        </label>

        <div style={{ overflowY: "auto", marginTop: 10, flex: 1 }}>
          {lista.length === 0 && (
            <p className="subtle">
              Nada aqui. (Se a lista estiver toda vazia, rode a migration 0013.)
            </p>
          )}
          {lista.map((e) => {
            const open = aberto === e.id;
            return (
              <div
                key={e.id}
                className="panel"
                style={{ padding: 12, marginBottom: 8, borderColor: destaque === e.id ? "var(--neon)" : "var(--panel-border)" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={() => setAberto(open ? null : e.id)}
                    style={{ background: "none", border: "none", color: "var(--text)", fontWeight: 800, textAlign: "left", cursor: "pointer", flex: 1 }}
                  >
                    {e.nome} {open ? "▲" : "▾"}
                  </button>
                  <button className="btn btn-primary" style={{ padding: "6px 12px" }} onClick={() => onAdd(e.nome, e.grupo_muscular)}>
                    +
                  </button>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  <span className="muscle-badge">{e.grupo_muscular}</span>
                  {e.equipamento && <span className="muscle-badge">{e.equipamento}</span>}
                  {e.casa_ok && <span className="muscle-badge" style={{ color: "var(--good)" }}>casa</span>}
                </div>

                {open && (
                  <div style={{ marginTop: 10, fontSize: "0.8rem", lineHeight: 1.45 }}>
                    <Ficha rotulo="Músculos" texto={e.musculos.join(", ")} />
                    <Ficha rotulo="Execução" texto={e.execucao} />
                    <Ficha rotulo="Cue" texto={e.cue} cor="var(--neon-2)" />
                    <Ficha rotulo="Erro comum" texto={e.erro_comum} cor="var(--neon)" />
                    <Ficha rotulo="Variações" texto={e.variacoes.join(" · ")} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn" style={{ width: "100%", marginTop: 10 }} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

function Ficha({ rotulo, texto, cor }: { rotulo: string; texto: string | null; cor?: string }) {
  if (!texto) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontWeight: 800, color: cor ?? "var(--text)" }}>{rotulo}: </span>
      <span className="subtle">{texto}</span>
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
  marginTop: 10,
};
const chipStyle = (ativo: boolean): React.CSSProperties => ({
  borderColor: ativo ? "var(--neon)" : "var(--panel-border)",
  color: ativo ? "var(--neon)" : "var(--text-dim)",
});
