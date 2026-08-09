// v12: página da coleção — photocards do jogador + filtros por season.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { carregarColecao, seasonDoJogador } from "@/lib/data";
import BottomNav from "@/components/BottomNav";
import ColecaoGrid from "@/components/ColecaoGrid";
import SeasonBadge from "@/components/SeasonBadge";

export default async function ColecaoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [itens, season, { data: attrRow }] = await Promise.all([
    carregarColecao(user.id),
    seasonDoJogador(user.id),
    supabase
      .from("atributos")
      .select("shards")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const shards = (attrRow?.shards as number) ?? 0;

  const photocardsDoUsuario = itens
    .filter((i) => i.tipo === "photocard")
    .map((i) => ({
      item_id: i.item_id,
      quantidade: i.quantidade,
      favorito: i.favorito,
    }));

  return (
    <main className="app-shell">
      <SeasonBadge season={season} />
      <div className="panel" style={{ marginBottom: 14, borderLeft: "3px solid var(--gold)" }}>
        <h1 className="title-fight" style={{ fontSize: "1.8rem", margin: 0 }}>
          Coleção
        </h1>
        <p className="subtle" style={{ marginTop: 4, fontSize: "0.78rem" }}>
          Photocards desbloqueadas por PR, boss semanal e quests. Slots vazios
          mostram o que ainda falta da season.
        </p>
      </div>
      <ColecaoGrid itens={photocardsDoUsuario} shards={shards} />
      <BottomNav />
    </main>
  );
}
