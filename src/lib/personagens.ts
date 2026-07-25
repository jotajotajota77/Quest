// ============================================================
// Rótulos amigáveis pros novos campos v10 de personagens (mestres).
// ------------------------------------------------------------
// domínio (guardado pelo mestre) e faixa canônica (o "rank do boss").
// ============================================================

export const LABEL_DOMINIO: Record<string, string> = {
  bracos: "Braços",
  abs: "Abs / Core",
  pernas: "Pernas",
  danca: "Dança",
  taekwondo: "Taekwondo",
  avatar: "Trainee",
};

/** Faixa canônica → rótulo curto pra exibição. */
export const LABEL_FAIXA: Record<string, string> = {
  branca_10kup: "Branca · 10º kup",
  amarela_9kup: "Amarela · 9º kup",
  amarela_ponta_verde_8kup: "Amarela ponta verde · 8º kup",
  verde_7kup: "Verde · 7º kup",
  verde_6kup: "Verde · 6º kup",
  verde_azul_5kup: "Verde ponta azul · 5º kup",
  verde_ponta_azul_5kup: "Verde ponta azul · 5º kup",
  azul_4kup: "Azul · 4º kup",
  azul_ponta_vermelha_3kup: "Azul ponta vermelha · 3º kup",
  vermelha_2kup: "Vermelha · 2º kup",
  vermelha_ponta_preta_1kup: "Vermelha ponta preta · 1º kup",
  preta_1dan: "Preta · 1º dan",
  preta_2dan: "Preta · 2º dan",
  preta_3dan: "Preta · 3º dan",
  preta_4dan: "Preta · 4º dan",
};

/** Cor CSS da faixa (usa vars do belt-ladder token). */
export function corDaFaixa(faixa: string | null | undefined): string {
  if (!faixa) return "var(--belt-white)";
  if (faixa.startsWith("preta")) return "var(--belt-black)";
  if (faixa.startsWith("vermelha")) return "var(--belt-red)";
  if (faixa.startsWith("azul")) return "var(--belt-blue)";
  if (faixa.startsWith("verde")) return "var(--belt-green)";
  if (faixa.startsWith("amarela")) return "var(--belt-yellow)";
  return "var(--belt-white)";
}
