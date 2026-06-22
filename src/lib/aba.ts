// Educação ABA (opt-in via long-press) + flavor temático dos bônus.
// O "porquê" científico fica ESCONDIDO atrás de um long-press — sem atrito pra
// quem não quer. O flavor temático é COSMÉTICO (texto do hit-confirm), para não
// virar min-max: a magnitude do bônus segue igual pros 4 (seleção por identidade).
import type { Comportamento, Familia } from "@/lib/types";

export const ABA_PORQUE: Record<Familia, string> = {
  nutri:
    "Operante frágil: reforço imediato (hit-confirm) + música nova-no-sistema instalam o hábito e combatem habituação. CRF agora; o fading só rareia quando você estabiliza.",
  treino:
    "Operante forte: só a camada universal reforça. O tooling (plano, PR, timer) é alavanca de Premack — a atividade que você já curte te traz pro app.",
  leitura:
    "Sem música aqui (competiria com ler). O reforço é por identidade: cada leitura desbloqueia um fragmento do mundo VHYX.",
  danca:
    "Reforçador intrínseco: a música É a atividade (trilha), não recompensa que esmaece. A maestria da coreografia é o ganho.",
};

/** Flavor temático do hit-confirm por comportamento (cosmético). */
export const HIT_TEMATICO: Record<Comportamento, string> = {
  treino: "IRON!",
  nutri_refeicao: "HIT!",
  nutri_agua: "GULP!",
  leitura: "INSIGHT!",
  danca: "FLOW!",
};
