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

  // v12.7: hub tem fase única. Sanha entra no roster (jogavel=true) e é
  // selecionado como qualquer outro. A fase de identidade "Entrar no dojang"
  // foi removida — passou a ser fricção desnecessária.
  const [{ data: roster }, progressos] = await Promise.all([
    supabase
      .from("personagens")
      .select("*")
      .eq("ativo", true)
      .eq("jogavel", true)
      .order("ordem", { ascending: true }),
    garantirProgressoDominio(user.id),
  ]);

  return (
    <main className="app-shell">
      <CharacterSelect
        roster={(roster ?? []) as Personagem[]}
        progressos={progressos}
      />
    </main>
  );
}
