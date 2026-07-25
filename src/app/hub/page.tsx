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

  // v10: Hub em 2 fases (identidade → mestres). Sanha aparece na Fase 1
  //   (identidade do jogador) e no Espelho; NÃO entra no grid de mestres.
  // v10.2: também carregamos o progresso por domínio pra mostrar seu kup
  //   atual vs a faixa canônica de cada mestre.
  const [{ data: roster }, { data: avatar }, progressos] = await Promise.all([
    supabase
      .from("personagens")
      .select("*")
      .eq("ativo", true)
      .eq("avatar_jogador", false)
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
