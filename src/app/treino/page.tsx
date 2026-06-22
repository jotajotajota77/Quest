// Aba Treino — camada universal (BehaviorTab) + módulo de treino rico (TRAVA 6).
// O reforço continua só na camada universal; o módulo é tooling (utilidade).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { planoTreino, seriesRecentes } from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";
import TrainingModule from "@/components/TrainingModule";

export default async function TreinoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [plano, series] = await Promise.all([
    planoTreino(user.id),
    seriesRecentes(user.id),
  ]);

  return (
    <BehaviorTab familia="treino">
      <TrainingModule plano={plano} series={series} />
    </BehaviorTab>
  );
}
