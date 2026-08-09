// Aba Treino — camada universal (BehaviorTab) + módulo de treino rico (TRAVA 6).
// O reforço continua só na camada universal; o módulo é tooling (utilidade).
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  carregarMasteryMusculo,
  listarExercicios,
  perfilDe,
  planoTreino,
  seriesDeHoje,
  seriesRecentes,
  seriesUltimosDias,
  sessoesDeHoje,
} from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";
import TrainingModule from "@/components/TrainingModule";
import PerfilTreino from "@/components/PerfilTreino";
import ObjetivosTreino from "@/components/ObjetivosTreino";
import HistoricoTreino from "@/components/HistoricoTreino";
import AquecimentoLog, { type AquecimentoRow } from "@/components/AquecimentoLog";
import TrainingRaid from "@/components/TrainingRaid";
import MasteryCard from "@/components/MasteryCard";

export default async function TreinoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [plano, series, hoje, sessoes, perfil, biblioteca, historicoSeries, masteries, { data: aquecRaw }] = await Promise.all([
    planoTreino(user.id),
    seriesRecentes(user.id),
    seriesDeHoje(user.id),
    sessoesDeHoje(user.id),
    perfilDe(user.id),
    listarExercicios(),
    seriesUltimosDias(user.id),
    carregarMasteryMusculo(user.id),
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
      <TrainingRaid plano={plano} seriesHoje={hoje} />
      <TrainingModule
        plano={plano}
        series={series}
        seriesHoje={hoje}
        sessoesHoje={sessoes}
        biblioteca={biblioteca}
      />
      <MasteryCard masteries={masteries} />
      <HistoricoTreino series={historicoSeries} />
      <AquecimentoLog historico={historicoAquec} />
    </BehaviorTab>
  );
}
