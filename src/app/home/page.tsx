// Home — campo de alta frequência: placar + registro 1 toque.
// O corpo real NÃO aparece aqui (TRAVA de exposição). Nada de formulários
// além do registro. Pós-login o usuário chega aqui VINDO do hub.
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirAtributos, personagemDoDia } from "@/lib/data";
import Scoreboard from "@/components/Scoreboard";
import LogButton from "@/components/LogButton";
import BottomNav from "@/components/BottomNav";

export default async function HomePage({
  searchParams,
}: {
  searchParams: { spotify?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const attr = await garantirAtributos(user.id);
  const personagem = await personagemDoDia(user.id);

  // Sem protagonista do dia → volta ao hub (TRAVA de UX: hub primeiro).
  if (!personagem) redirect("/hub");

  return (
    <main className="app-shell">
      <Scoreboard
        attr={{
          stamina: attr?.stamina ?? 0,
          elo: attr?.elo ?? 1,
          xp: attr?.xp ?? 0,
        }}
        personagem={personagem}
      />

      <LogButton />

      <div style={{ marginTop: 18, textAlign: "center" }}>
        {searchParams.spotify === "ok" && (
          <p className="subtle" style={{ color: "var(--good)" }}>
            Spotify conectado.
          </p>
        )}
        {searchParams.spotify === "erro" && (
          <p className="subtle" style={{ color: "var(--neon)" }}>
            Falha ao conectar o Spotify — o reforço local segue funcionando.
          </p>
        )}
        <Link className="nav-link" href="/api/spotify/login">
          Conectar Spotify (música nova-no-sistema)
        </Link>
      </div>

      <BottomNav />
    </main>
  );
}
