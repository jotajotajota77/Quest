"use client";

// Formulário do espelho. Input deliberado, raro, simples. NÃO é convocado:
// só existe porque o usuário abriu a aba por conta própria (TRAVA).
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function MirrorForm() {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [campos, setCampos] = useState({
    peso: "",
    cintura: "",
    gordura_pct: "",
    descricao: "",
    estado_corporal: "",
  });

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await fetch("/api/corpo-real", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          peso: campos.peso ? Number(campos.peso) : undefined,
          cintura: campos.cintura ? Number(campos.cintura) : undefined,
          gordura_pct: campos.gordura_pct
            ? Number(campos.gordura_pct)
            : undefined,
          descricao: campos.descricao || undefined,
          estado_corporal: campos.estado_corporal || undefined,
        }),
      });
      setCampos({
        peso: "",
        cintura: "",
        gordura_pct: "",
        descricao: "",
        estado_corporal: "",
      });
      router.refresh();
    } finally {
      setSalvando(false);
    }
  }

  // Labels de estado corporal ANTI-AVERSIVOS — nunca termos julgadores.
  const ESTADOS = ["Recarga", "Lean", "Atlético", "Construção", "Manutenção"];

  const input = (
    name: keyof typeof campos,
    placeholder: string,
    type = "number",
  ) => (
    <input
      type={type}
      step="any"
      placeholder={placeholder}
      value={campos[name]}
      onChange={(e) => setCampos((c) => ({ ...c, [name]: e.target.value }))}
      style={{
        width: "100%",
        padding: 12,
        borderRadius: 10,
        border: "1px solid var(--panel-border)",
        background: "rgba(0,0,0,0.25)",
        color: "var(--text)",
        marginBottom: 10,
      }}
    />
  );

  return (
    <form onSubmit={salvar} className="panel" style={{ marginTop: 16 }}>
      {input("peso", "Peso (kg)")}
      {input("cintura", "Cintura (cm)")}
      {input("gordura_pct", "Gordura corporal (%)")}
      <div className="lbl" style={{ marginBottom: 6 }}>
        Estado (sem julgamento)
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {ESTADOS.map((e) => (
          <button
            key={e}
            type="button"
            className="nav-link"
            style={{
              borderColor:
                campos.estado_corporal === e ? "var(--neon)" : "var(--panel-border)",
            }}
            onClick={() =>
              setCampos((c) => ({
                ...c,
                estado_corporal: c.estado_corporal === e ? "" : e,
              }))
            }
          >
            {e}
          </button>
        ))}
      </div>
      <textarea
        placeholder="Descrição livre do corpo real…"
        value={campos.descricao}
        onChange={(e) =>
          setCampos((c) => ({ ...c, descricao: e.target.value }))
        }
        rows={3}
        style={{
          width: "100%",
          padding: 12,
          borderRadius: 10,
          border: "1px solid var(--panel-border)",
          background: "rgba(0,0,0,0.25)",
          color: "var(--text)",
        }}
      />
      <button
        className="btn btn-primary"
        style={{ width: "100%", marginTop: 10 }}
        disabled={salvando}
      >
        {salvando ? "Salvando…" : "Registrar corpo real"}
      </button>
    </form>
  );
}
