// ============================================================
// /saga — narrativa do Ato + Boss persistente da semana.
// ------------------------------------------------------------
// v12.4: extraído da /home pra aliviar o overload. A /home ficou com
// 15+ blocos e o BossBattle competia com o Goal Dashboard por atenção.
// Aqui é a página onde o usuário vem quando quer olhar a batalha em si.
// ============================================================
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BottomNav from "@/components/BottomNav";
import AtoHeader from "@/components/AtoHeader";
import BossBattle from "@/components/BossBattle";
import {
  hojeISO,
  bossProgressoDaSemana,
  carregarBossEstado,
  rosterDesbloqueado,
} from "@/lib/data";
import { atoAtual } from "@/lib/ato";

export default async function SagaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [bossProg, roster, bossEstado] = await Promise.all([
    bossProgressoDaSemana(user.id),
    rosterDesbloqueado(),
    carregarBossEstado(user.id),
  ]);
  const bossMestre = roster.find((p) => p.slug === bossProg.boss.mestre_slug) ?? null;
  const ato = atoAtual(hojeISO());

  return (
    <main className="app-shell" style={{ paddingBottom: 120 }}>
      <div style={{ padding: "12px 0 6px", borderBottom: "1px solid var(--hairline)", marginBottom: 16 }}>
        <div className="lbl" style={{ color: "var(--kihap)", letterSpacing: "0.18em" }}>
          ⚔️ SAGA
        </div>
        <h1 className="title-fight" style={{ fontSize: "1.7rem", margin: "2px 0 4px", textTransform: "uppercase" }}>
          Ato + Boss da semana
        </h1>
        <p className="subtle" style={{ fontSize: "0.82rem", margin: 0 }}>
          Narrativa do cutting + progresso do boss persistente. Cada série,
          sessão TKD e dança logada credita dano automaticamente.
        </p>
      </div>

      <AtoHeader ato={ato} hojeISO={hojeISO()} />
      <BossBattle progresso={bossProg} mestre={bossMestre} estado={bossEstado} />

      <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
        <p className="subtle" style={{ fontSize: "0.78rem", margin: "0 0 10px" }}>
          Ver mais:
        </p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <Link href="/home" className="chip">← Home</Link>
          <Link href="/treino" className="chip">Registrar série →</Link>
          <Link href="/colecao" className="chip">Coleção 🎴</Link>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
