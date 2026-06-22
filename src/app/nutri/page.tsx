// Aba Nutri — 1-toque (piso) + motor de instalação + tela rica (food_db) +
// Fat Loss Coach (tips reais, gated). O 1-toque fica no topo (BehaviorTab); a
// tela de alimentos/macros é o caminho detalhado OPCIONAL.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  categoriasFood,
  coachNutriAtivo,
  listarFoodDb,
  logsNutri30,
  nutriHoje,
  pesoAtual,
} from "@/lib/data";
import { gerarTips } from "@/lib/coach_tips";
import BehaviorTab from "@/components/BehaviorTab";
import NutriDashboard from "@/components/NutriDashboard";
import CoachTips from "@/components/CoachTips";

export default async function NutriPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [ativo, refeicoes, alimentos] = await Promise.all([
    coachNutriAtivo(user.id),
    nutriHoje(user.id),
    listarFoodDb(),
  ]);

  let tips = null;
  if (ativo) {
    const [logs30, peso, catMap] = await Promise.all([
      logsNutri30(user.id),
      pesoAtual(user.id),
      categoriasFood(),
    ]);
    tips = gerarTips(logs30, peso, catMap);
  }

  return (
    <BehaviorTab familia="nutri" coachAtivo={ativo} ocultarHistorico>
      {tips && <CoachTips tips={tips} />}
      <NutriDashboard refeicoes={refeicoes} alimentos={alimentos} />
    </BehaviorTab>
  );
}
