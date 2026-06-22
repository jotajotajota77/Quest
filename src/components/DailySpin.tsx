"use client";

// Daily Spin — reforço de razão variável, 1×/dia. A surpresa é o ponto.
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Recompensa {
  tipo: string;
  rotulo: string;
}

export default function DailySpin({
  recompensaInicial,
}: {
  recompensaInicial: Recompensa | null;
}) {
  const router = useRouter();
  const [recompensa, setRecompensa] = useState<Recompensa | null>(
    recompensaInicial,
  );
  const [girando, setGirando] = useState(false);

  async function girar() {
    setGirando(true);
    try {
      const res = await fetch("/api/spin", { method: "POST" });
      if (res.ok) {
        const { recompensa: r } = await res.json();
        setRecompensa(r);
        router.refresh();
      }
    } finally {
      setGirando(false);
    }
  }

  return (
    <div className="panel" style={{ textAlign: "center", marginTop: 16 }}>
      <div className="lbl" style={{ marginBottom: 8 }}>
        Giro do dia
      </div>
      {recompensa ? (
        <div className="title-fight" style={{ fontSize: "1.2rem" }}>
          🎁 {recompensa.rotulo}
        </div>
      ) : (
        <button
          className="btn btn-primary"
          style={{ width: "100%" }}
          onClick={girar}
          disabled={girando}
        >
          {girando ? "Girando…" : "Girar (1×/dia)"}
        </button>
      )}
    </div>
  );
}
