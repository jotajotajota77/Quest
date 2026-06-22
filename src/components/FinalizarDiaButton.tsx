"use client";

// "Finalizar o dia" — encerramento explícito (ABA pra TDAH). Sem penalidade.
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function FinalizarDiaButton({ finalizado }: { finalizado: boolean }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);

  if (finalizado) {
    return (
      <p className="subtle" style={{ textAlign: "center", marginTop: 12 }}>
        ✓ Dia finalizado. Descanse — amanhã o protagonista te espera.
      </p>
    );
  }

  return (
    <button
      className="btn"
      style={{ width: "100%", marginTop: 12 }}
      disabled={enviando}
      onClick={async () => {
        setEnviando(true);
        await fetch("/api/dia/finalizar", { method: "POST" }).catch(() => {});
        router.refresh();
      }}
    >
      {enviando ? "…" : "Finalizar o dia"}
    </button>
  );
}
