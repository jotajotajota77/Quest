// Aba Treino — camada universal (BehaviorTab) + módulo de treino rico (TRAVA 6).
// O reforço continua só na camada universal; o módulo é tooling (utilidade).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  planoTreino,
  seriesDeHoje,
  seriesRecentes,
  sessoesDeHoje,
} from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";
import TrainingModule from "@/components/TrainingModule";

export default async function TreinoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [plano, series, hoje, sessoes] = await Promise.all([
    planoTreino(user.id),
    seriesRecentes(user.id),
    seriesDeHoje(user.id),
    sessoesDeHoje(user.id),
  ]);

  return (
    <BehaviorTab familia="treino" ocultarHistorico>
      <TrainingModule
        plano={plano}
        series={series}
        seriesHoje={hoje}
        sessoesHoje={sessoes}
      />
    </BehaviorTab>
  );
}
