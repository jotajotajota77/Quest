// Hub de seleção — primeira tela pós-login (TRAVA de UX). Carrega o roster
// ativo e entrega ao componente cliente. V1: 1 personagem placeholder de Stamina.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Personagem } from "@/lib/types";
import CharacterSelect from "@/components/CharacterSelect";

export default async function HubPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // v10: Hub em 2 fases (identidade → mestres). Sanha aparece na Fase 1
  //   (identidade do jogador) e no Espelho; NÃO entra no grid de mestres.
  const [{ data: roster }, { data: avatar }] = await Promise.all([
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
  ]);

  return (
    <main className="app-shell">
      <CharacterSelect
        roster={(roster ?? []) as Personagem[]}
        avatar={(avatar as Personagem | null) ?? null}
      />
    </main>
  );
}
