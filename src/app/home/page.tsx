// Home / dashboard — alta frequência: 4 atributos + Elo + progresso +
// protagonista do dia. Só placar rápido; o registro 1-toque vive nas abas.
// O corpo real NÃO aparece aqui (TRAVA de exposição).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { garantirAtributos, personagemDoDia } from "@/lib/data";
import Scoreboard from "@/components/Scoreboard";
import BottomNav from "@/components/BottomNav";

export default async function HomePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const personagem = await personagemDoDia(user.id);
  // Sem protagonista do dia → hub primeiro (TRAVA de UX).
  if (!personagem) redirect("/hub");

  const attr = await garantirAtributos(user.id);

  return (
    <main className="app-shell">
      <Scoreboard attr={attr} personagem={personagem} />
      <p className="subtle" style={{ textAlign: "center", marginTop: 8 }}>
        Toque num atributo para abrir a aba e registrar.
      </p>
      <BottomNav />
    </main>
  );
}
