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

  const { data: roster } = await supabase
    .from("personagens")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  return (
    <main className="app-shell">
      <CharacterSelect roster={(roster ?? []) as Personagem[]} />
    </main>
  );
}
