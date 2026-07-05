// Aba Nutri — 1-toque (piso) + motor de instalação + tela rica (food_db) +
// Fat Loss Coach (tips reais, gated). O 1-toque fica no topo (BehaviorTab); a
// tela de alimentos/macros é o caminho detalhado OPCIONAL.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  categoriasFood,
  coachNutriAtivo,
  foodsPorIds,
  logsNutri30,
  nutriHoje,
  pesoAtual,
} from "@/lib/data";
import { MODELOS_DIETA } from "@/lib/dietas";
import { gerarTips } from "@/lib/coach_tips";
import BehaviorTab from "@/components/BehaviorTab";
import NutriDashboard from "@/components/NutriDashboard";
import CoachTips from "@/components/CoachTips";
import AtividadesStamina from "@/components/AtividadesStamina";

// ids referenciados pelos modelos de dieta (carregados p/ exibir/registrar).
const IDS_MODELO = [
  ...new Set(
    MODELOS_DIETA.flatMap((m) =>
      m.refeicoes.flatMap((r) => r.itens.map((i) => i.foodId)),
    ),
  ),
];

export default async function NutriPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [ativo, refeicoes] = await Promise.all([
    coachNutriAtivo(user.id),
    nutriHoje(user.id),
  ]);

  // Catálogo grande é por busca server-side: aqui só os foods dos modelos +
  // os nomes dos alimentos registrados hoje.
  const idsHoje = refeicoes
    .map((r) => r.food_id)
    .filter((x): x is string => !!x);
  const [alimentosModelo, alimentosHoje] = await Promise.all([
    foodsPorIds(IDS_MODELO),
    foodsPorIds(idsHoje),
  ]);
  const nomesHoje = Object.fromEntries(
    alimentosHoje.map((a) => [a.id, a.nome]),
  );

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
      <AtividadesStamina />
      <NutriDashboard
        refeicoes={refeicoes}
        alimentosModelo={alimentosModelo}
        nomesHoje={nomesHoje}
      />
    </BehaviorTab>
  );
}
