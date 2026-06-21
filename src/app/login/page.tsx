"use client";

// Login por e-mail + senha. Sem envio de e-mail → sem rate limit, instantâneo.
// App de um usuário só: "Criar conta" na primeira vez, "Entrar" depois.
// Requer no Supabase: Authentication → Providers → Email com "Confirm email"
// DESLIGADO (assim o signUp já devolve sessão na hora).
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [status, setStatus] = useState<"idle" | "indo">("idle");
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function autenticar(modo: "entrar" | "criar") {
    setStatus("indo");
    setErro(null);
    setInfo(null);
    const supabase = createClient();

    const fn =
      modo === "entrar"
        ? supabase.auth.signInWithPassword({ email, password: senha })
        : supabase.auth.signUp({ email, password: senha });

    const { data, error } = await fn;
    if (error) {
      setErro(error.message);
      setStatus("idle");
      return;
    }
    // Se "Confirm email" estiver ligado, o signUp não cria sessão na hora.
    if (modo === "criar" && !data.session) {
      setInfo(
        "Conta criada, mas falta confirmar o e-mail. Desligue 'Confirm email' no Supabase e tente Entrar.",
      );
      setStatus("idle");
      return;
    }
    router.push("/hub");
    router.refresh();
  }

  return (
    <main className="app-shell" style={{ maxWidth: 440, paddingTop: 80 }}>
      <h1 className="title-fight" style={{ fontSize: "2.6rem", margin: 0 }}>
        Quest
      </h1>
      <p className="subtle" style={{ marginTop: 6 }}>
        Entre com e-mail e senha. Primeira vez? Crie a conta.
      </p>

      <form
        className="panel"
        style={{ marginTop: 24 }}
        onSubmit={(e) => {
          e.preventDefault();
          autenticar("entrar");
        }}
      >
        <input
          type="email"
          required
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <input
          type="password"
          required
          minLength={6}
          placeholder="senha (mín. 6)"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          style={{ ...inputStyle, marginTop: 10 }}
        />

        <div className="log-row" style={{ marginTop: 12 }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={status === "indo"}
          >
            {status === "indo" ? "…" : "Entrar"}
          </button>
          <button
            type="button"
            className="btn"
            disabled={status === "indo"}
            onClick={() => autenticar("criar")}
          >
            Criar conta
          </button>
        </div>

        {erro && (
          <p className="subtle" style={{ color: "var(--neon)", marginTop: 10 }}>
            {erro}
          </p>
        )}
        {info && (
          <p className="subtle" style={{ color: "var(--gold)", marginTop: 10 }}>
            {info}
          </p>
        )}
      </form>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid var(--panel-border)",
  background: "rgba(0,0,0,0.25)",
  color: "var(--text)",
  fontSize: "1rem",
};
