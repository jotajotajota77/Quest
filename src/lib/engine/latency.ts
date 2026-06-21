// ============================================================
// Latência e variabilidade — captura 100% PASSIVA. (TRAVA)
// ------------------------------------------------------------
// Latência = tempo entre o "zero" da refeição e o registro.
//   * O zero é CONFIGURÁVEL. V1: zero = início do dia local do log.
//     (Alternativa prevista: relativo a janelas de refeição planejadas — V2.)
//   * Tudo é derivado do timestamp do log. Nenhum input do usuário.
// Variabilidade = dispersão da latência numa janela móvel.
// ============================================================

export type ZeroRefeicao =
  | { tipo: "inicio_do_dia" }
  // V2: janela de refeição planejada. Estrutura prevista, inerte no V1.
  | { tipo: "janela_planejada"; minutosDoDia: number[] };

const ZERO_PADRAO: ZeroRefeicao = { tipo: "inicio_do_dia" };

/** Latência em minutos de um registro, dado o zero configurado. */
export function latenciaMin(ts: Date, zero: ZeroRefeicao = ZERO_PADRAO): number {
  if (zero.tipo === "inicio_do_dia") {
    const meiaNoite = new Date(ts);
    meiaNoite.setHours(0, 0, 0, 0);
    return (ts.getTime() - meiaNoite.getTime()) / 60000;
  }
  // janela_planejada: latência relativa ao marco de refeição mais próximo
  // que já passou (ou o início do dia, se nenhum passou ainda).
  const minutosDoDia = ts.getHours() * 60 + ts.getMinutes();
  const marcos = [...zero.minutosDoDia].sort((a, b) => a - b);
  let ref = 0;
  for (const m of marcos) if (m <= minutosDoDia) ref = m;
  return minutosDoDia - ref;
}

export interface SinalEstabilidade {
  n: number;
  mediaLatenciaMin: number;
  /** Dispersão (desvio-padrão amostral, em minutos). Menor = mais estável. */
  variabilidadeMin: number;
}

/** Resume a janela móvel de latências num sinal de estabilidade. */
export function sinalEstabilidade(latencias: number[]): SinalEstabilidade {
  const n = latencias.length;
  if (n === 0) return { n: 0, mediaLatenciaMin: 0, variabilidadeMin: 0 };
  const media = latencias.reduce((a, b) => a + b, 0) / n;
  if (n === 1) return { n, mediaLatenciaMin: media, variabilidadeMin: 0 };
  const varAmostral =
    latencias.reduce((a, b) => a + (b - media) ** 2, 0) / (n - 1);
  return { n, mediaLatenciaMin: media, variabilidadeMin: Math.sqrt(varAmostral) };
}
