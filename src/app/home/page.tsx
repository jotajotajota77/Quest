// ============================================================
// Home / dashboard — a ESPINHA do loop diário (v2).
// ------------------------------------------------------------
// Alta frequência: tier + progresso + 4 atributos + VOZ contextual do
// protagonista + FOCO do dia (uma coisa, anti-paralisia) + DAILY SPIN +
// entrada do MODO NÉVOA. O registro 1-toque vive nas abas; o corpo real fica
// fora daqui (TRAVA de exposição).
// ============================================================
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  diaDeHoje,
  diasComLogSet,
  diasNevoaSet,
  garantirAtributos,
  personagemDoDia,
  registrosHoje,
  spinDeHoje,
  hojeISO,
} from "@/lib/data";
import { calcularStreak } from "@/lib/engine/streak";
import { mensagemContextual } from "@/lib/voz";
import Scoreboard from "@/components/Scoreboard";
import BottomNav from "@/components/BottomNav";
import FogButton from "@/components/FogButton";
import DailySpin from "@/components/DailySpin";
import LoreButton from "@/components/LoreButton";
import WorldLoreButton from "@/components/WorldLoreButton";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const personagem = await personagemDoDia(user.id);
  if (!personagem) redirect("/hub");

  const [attr, dia, comLog, nevoa, nHoje, spin] = await Promise.all([
    garantirAtributos(user.id),
    diaDeHoje(user.id),
    diasComLogSet(user.id),
    diasNevoaSet(user.id),
    registrosHoje(user.id),
    spinDeHoje(user.id),
  ]);

  const streak = calcularStreak(hojeISO(), comLog, nevoa);
  const voz = mensagemContextual({
    personagem,
    streak,
    fogHoje: dia.fog_mode,
    hora: new Date().getHours(),
    registrosHoje: nHoje,
  });

  return (
    <main className="app-shell">
      {/* Voz contextual / body-doubling — o protagonista fala. */}
      <div
        className="panel"
        style={{
          marginBottom: 16,
          borderLeft: "3px solid var(--neon)",
          display: "flex",
          gap: 12,
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: "1.4rem" }}>🗨️</div>
        <div>
          <div className="lbl">{personagem.nome}</div>
          <div>{voz}</div>
        </div>
      </div>

      <Scoreboard attr={attr} personagem={personagem} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span className="subtle">🔥 Streak: {streak.streak} dia(s)</span>
        <div style={{ display: "flex", gap: 8 }}>
          <LoreButton personagem={personagem} />
          <WorldLoreButton />
        </div>
      </div>

      {/* Foco do dia — UMA coisa (anti-paralisia). O operante frágil (Nutri). */}
      <Link
        href="/nutri"
        className="panel"
        style={{
          display: "block",
          textDecoration: "none",
          marginTop: 12,
          borderColor: "var(--gold)",
        }}
      >
        <div className="lbl">Foco de hoje</div>
        <div style={{ fontWeight: 800, marginTop: 4 }}>
          Nutri — um toque em refeição ou água
        </div>
        <div className="subtle">A âncora do dia. Comece por aqui.</div>
      </Link>

      <DailySpin
        recompensaInicial={
          spin ? { tipo: String(spin.tipo), rotulo: String(spin.rotulo) } : null
        }
      />

      <div style={{ marginTop: 16 }}>
        <FogButton jaEhNevoa={dia.fog_mode} />
      </div>

      <BottomNav />
    </main>
  );
}
