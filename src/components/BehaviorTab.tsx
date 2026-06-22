// ============================================================
// Aba de comportamento (Treino / Nutri / Leitura / Dança).
// ------------------------------------------------------------
// Server component genérico parametrizado pela família. Mostra: atributo da
// família, indicador do bônus ativo, botão(ões) de registro 1-toque, conexão
// Spotify (só Nutri) e o histórico do que foi registrado.
// A ASSIMETRIA vem de FAMILIAS[familia] — não há motor unificado.
// ============================================================
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Familia } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import {
  FAMILIAS,
  LABEL_ATRIBUTO,
  LABEL_COMPORTAMENTO,
} from "@/lib/comportamentos";
import { garantirAtributos, historicoFamilia, personagemDoDia } from "@/lib/data";
import LogButtons, { type AcaoLog } from "@/components/LogButtons";
import BottomNav from "@/components/BottomNav";

const CORES_BOTAO: Partial<Record<string, string>> = {
  nutri_agua: "linear-gradient(135deg, var(--neon-2), #0077b6)",
};

export default async function BehaviorTab({
  familia,
  children,
}: {
  familia: Familia;
  children?: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const cfg = FAMILIAS[familia];
  const attr = await garantirAtributos(user.id);
  const personagem = await personagemDoDia(user.id);
  const bonusAtivo = personagem?.comportamento_alvo === familia;
  const historico = await historicoFamilia(user.id, cfg.comportamentos);

  const acoes: AcaoLog[] = cfg.comportamentos.map((c) => ({
    comportamento: c,
    label: LABEL_COMPORTAMENTO[c],
    hit: c === "nutri_agua" ? "GULP!" : "HIT!",
    cor: CORES_BOTAO[c],
  }));

  return (
    <main className="app-shell">
      <div
        className="panel"
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
            {cfg.label}
          </h1>
          <div className="subtle">
            {LABEL_ATRIBUTO[cfg.atributo]}: <strong>{attr[cfg.atributo]}</strong>
            {bonusAtivo ? (
              <span style={{ color: "var(--gold)" }}> · bônus +25% ativo hoje</span>
            ) : (
              <span> · sem bônus hoje</span>
            )}
          </div>
        </div>
        <div className="subtle" style={{ textAlign: "right" }}>
          {cfg.motorInstalacao
            ? "motor de instalação (música + fading)"
            : cfg.spotify === "soundtrack"
              ? "trilha (música como atividade)"
              : "reforço local"}
        </div>
      </div>

      <LogButtons acoes={acoes} />

      {cfg.motorInstalacao && (
        <div style={{ marginTop: 16, textAlign: "center" }}>
          <Link className="nav-link" href="/api/spotify/login">
            Conectar Spotify (música nova-no-sistema)
          </Link>
        </div>
      )}

      {/* Tooling específico da família (ex.: módulo de treino rico). */}
      {children}

      <div style={{ marginTop: 22 }}>
        <h3 style={{ marginBottom: 8 }}>Histórico</h3>
        {historico.length === 0 && (
          <p className="subtle">Nada registrado ainda.</p>
        )}
        {historico.map((l) => (
          <div
            className="panel"
            key={l.id}
            style={{ marginBottom: 8, padding: "10px 14px" }}
          >
            <span className="subtle">
              {new Date(l.ts).toLocaleString("pt-BR")}
            </span>
            <span style={{ marginLeft: 10 }}>
              {LABEL_COMPORTAMENTO[l.comportamento]}
            </span>
          </div>
        ))}
      </div>

      <BottomNav />
    </main>
  );
}
