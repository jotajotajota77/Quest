"use client";

// Error boundary global — mostra a mensagem real do erro pra ajudar debug.
// Em produção normalmente essa info fica escondida; aqui mostramos pra o
// operante conseguir mandar o erro pro Claude.
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Quest] server error:", error);
  }, [error]);

  return (
    <main className="app-shell">
      <div
        className="panel"
        style={{ marginTop: 40, borderLeft: "3px solid var(--neon)" }}
      >
        <h2 className="title-fight" style={{ fontSize: "1.4rem", margin: 0 }}>
          Erro no app
        </h2>
        <p className="subtle" style={{ marginTop: 8, fontSize: "0.82rem" }}>
          {error.message || "Erro inesperado."}
        </p>
        {error.digest && (
          <p
            className="subtle"
            style={{
              marginTop: 8,
              fontFamily: "var(--font-mono)",
              fontSize: "0.72rem",
            }}
          >
            digest: {error.digest}
          </p>
        )}
        <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={reset}>
            Tentar de novo
          </button>
          <a href="/home" className="nav-link" style={{ alignSelf: "center" }}>
            Ir pra Home
          </a>
        </div>
      </div>
    </main>
  );
}
