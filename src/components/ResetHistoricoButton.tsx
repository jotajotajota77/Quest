"use client";

// Botão de apagar histórico (zona de perigo). Apaga registros e séries, mantém
// XP/atributos. Confirmação em dois passos para evitar toque acidental.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetHistoricoButton() {
  const router = useRouter();
  const [confirmar, setConfirmar] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [feito, setFeito] = useState(false);

  async function apagar() {
    setOcupado(true);
    try {
      await fetch("/api/reset", { method: "POST" });
      setFeito(true);
      router.refresh();
    } catch {
      /* silencioso; o usuário pode tentar de novo */
    } finally {
      setOcupado(false);
      setConfirmar(false);
    }
  }

  return (
    <div className="panel" style={{ marginTop: 16, borderColor: "rgba(255,46,136,0.4)" }}>
      <div className="lbl">Zona de perigo</div>
      <p className="subtle" style={{ margin: "4px 0 10px" }}>
        Apaga todos os registros e séries de treino (mantém seu XP e atributos).
        Não dá pra desfazer.
      </p>
      {feito ? (
        <p className="subtle" style={{ color: "var(--good)", margin: 0 }}>
          Histórico apagado. ✓
        </p>
      ) : !confirmar ? (
        <button className="btn" onClick={() => setConfirmar(true)}>
          Apagar histórico
        </button>
      ) : (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            className="btn btn-primary"
            disabled={ocupado}
            onClick={apagar}
          >
            {ocupado ? "Apagando…" : "Confirmar — apagar tudo"}
          </button>
          <button className="btn" disabled={ocupado} onClick={() => setConfirmar(false)}>
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
