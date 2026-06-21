"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "enviando" | "enviado" | "erro">(
    "idle",
  );

  async function enviarLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    const supabase = createClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${appUrl}/auth/callback` },
    });
    setStatus(error ? "erro" : "enviado");
  }

  return (
    <main className="app-shell" style={{ maxWidth: 440, paddingTop: 80 }}>
      <h1 className="title-fight" style={{ fontSize: "2.6rem", margin: 0 }}>
        Quest
      </h1>
      <p className="subtle" style={{ marginTop: 6 }}>
        Entre para começar. Um link mágico chega no seu e-mail.
      </p>

      <form onSubmit={enviarLink} className="panel" style={{ marginTop: 24 }}>
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: 14,
            borderRadius: 12,
            border: "1px solid var(--panel-border)",
            background: "rgba(0,0,0,0.25)",
            color: "var(--text)",
            fontSize: "1rem",
          }}
        />
        <button
          className="btn btn-primary"
          style={{ width: "100%", marginTop: 12 }}
          disabled={status === "enviando"}
        >
          {status === "enviando" ? "Enviando…" : "Enviar link mágico"}
        </button>
        {status === "enviado" && (
          <p className="subtle" style={{ color: "var(--good)" }}>
            Link enviado. Confira seu e-mail.
          </p>
        )}
        {status === "erro" && (
          <p className="subtle" style={{ color: "var(--neon)" }}>
            Algo falhou. Tente de novo.
          </p>
        )}
      </form>
    </main>
  );
}
