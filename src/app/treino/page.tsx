// Aba Treino — camada universal (BehaviorTab) + módulo de treino rico (TRAVA 6).
// O reforço continua só na camada universal; o módulo é tooling (utilidade).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  listarExercicios,
  perfilDe,
  planoTreino,
  seriesDeHoje,
  seriesRecentes,
  sessoesDeHoje,
} from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";
import TrainingModule from "@/components/TrainingModule";
import PerfilTreino from "@/components/PerfilTreino";
import ObjetivosTreino from "@/components/ObjetivosTreino";
import AquecimentoLog, { type AquecimentoRow } from "@/components/AquecimentoLog";

export default async function TreinoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [plano, series, hoje, sessoes, perfil, biblioteca, { data: aquecRaw }] = await Promise.all([
    planoTreino(user.id),
    seriesRecentes(user.id),
    seriesDeHoje(user.id),
    sessoesDeHoje(user.id),
    perfilDe(user.id),
    listarExercicios(),
    supabase
      .from("logs_aquecimento")
      .select("id, ts, tipo, descricao, duracao_min")
      .eq("user_id", user.id)
      .order("ts", { ascending: false })
      .limit(20),
  ]);
  const historicoAquec = (aquecRaw ?? []) as AquecimentoRow[];

  return (
    <BehaviorTab familia="treino">
      <ObjetivosTreino />
      <PerfilTreino descricaoInicial={perfil ?? ""} />
      <TrainingModule
        plano={plano}
        series={series}
        seriesHoje={hoje}
        sessoesHoje={sessoes}
        biblioteca={biblioteca}
      />
      <AquecimentoLog historico={historicoAquec} />
    </BehaviorTab>
  );
}
