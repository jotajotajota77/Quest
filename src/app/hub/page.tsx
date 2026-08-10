// Hub de seleção — primeira tela pós-login (TRAVA de UX). Carrega o roster
// ativo e entrega ao componente cliente. V1: 1 personagem placeholder de Stamina.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Personagem } from "@/lib/types";
import CharacterSelect from "@/components/CharacterSelect";
import { garantirProgressoDominio } from "@/lib/data";

export default async function HubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // v12.6: hub agora mostra TODOS os personagens jogáveis (jogavel=true) no
  // grid — inclusive o Sanha (que continua também na Fase 1 como ritual de
  // identidade). Isso permite selecionar Sanha como mestre do dia, além de
  // Min e futuros novos personagens. Os 5 boss-conceito (jogavel=false via
  // migration 0026) ficam de fora automaticamente.
  const [{ data: roster }, { data: avatar }, progressos] = await Promise.all([
    supabase
      .from("personagens")
      .select("*")
      .eq("ativo", true)
      .eq("jogavel", true)
      .order("ordem", { ascending: true }),
    supabase
      .from("personagens")
      .select("*")
      .eq("avatar_jogador", true)
      .maybeSingle(),
    garantirProgressoDominio(user.id),
  ]);

  return (
    <main className="app-shell">
      <CharacterSelect
        roster={(roster ?? []) as Personagem[]}
        avatar={(avatar as Personagem | null) ?? null}
        progressos={progressos}
      />
    </main>
  );
}
