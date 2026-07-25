// Educação ABA (opt-in via long-press) + flavor temático dos bônus.
// O "porquê" científico fica ESCONDIDO atrás de um long-press — sem atrito pra
// quem não quer. O flavor temático é COSMÉTICO (texto do hit-confirm), para não
// virar min-max: a magnitude do bônus segue igual pros 2 (seleção por identidade).
import type { Comportamento, Familia } from "@/lib/types";

export const ABA_PORQUE: Record<Familia, string> = {
  nutri:
    "Operante frágil: reforço imediato (hit-confirm) + música nova-no-sistema instalam o hábito e combatem habituação. CRF agora; o fading só rareia quando você estabiliza.",
  treino:
    "Operante forte: só a camada universal reforça. O tooling (plano, PR, timer) é alavanca de Premack — a atividade que você já curte te traz pro app.",
};

/** Flavor temático do hit-confirm por comportamento (cosmético). v10: KR/TKD. */
export const HIT_TEMATICO: Record<Comportamento, string> = {
  treino: "KIHAP!",         // 기합 — o grito do treino
  nutri_refeicao: "화이팅!", // fighting — o padrão do refeição/água
  nutri_agua: "물!",         // mul — água
  cardio: "STAGE!",         // vibe idol de palco
  volei: "SET!",
  resistencia: "SPARRING!", // 겨루기 — TKD
};
