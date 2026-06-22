// ============================================================
// Imagens contextuais do personagem — regra de exibição com fallback gracioso.
// ------------------------------------------------------------
// Ordem (parametrizável trocando a sequência abaixo):
//   1. protagonista do dia no contexto da aba (acao-<ctx>)
//   2. imagem de atributo/genérica do protagonista
//   3. dono do atributo no contexto
//   4. dono do atributo (atributo/corpo) → senão placeholder neutro
// Devolve uma lista ORDENADA de URLs candidatas; o componente tenta na ordem
// e cai no placeholder se nenhuma carregar (nunca quebra layout).
// ============================================================

import type { Familia, Personagem } from "@/lib/types";

export type ContextoHero = Familia | "home";

function dePersonagem(
  p: Personagem | null,
  ctx: ContextoHero,
  incluirContexto: boolean,
): string[] {
  if (!p) return [];
  const a = p.assets_contexto ?? {};
  const out: string[] = [];
  if (incluirContexto && ctx !== "home" && a[ctx]) out.push(a[ctx]!);
  if (a.atributo) out.push(a.atributo);
  if (p.asset_corpo) out.push(p.asset_corpo);
  if (p.asset_rosto) out.push(p.asset_rosto);
  return out;
}

export function candidatosHero(
  ctx: ContextoHero,
  protagonista: Personagem | null,
  dono: Personagem | null,
): string[] {
  // HOME: o protagonista do dia (presença única do dia).
  if (ctx === "home") {
    return [...new Set(dePersonagem(protagonista, ctx, false))];
  }
  // ABAS: o DONO do atributo lidera (cada aba mostra um personagem diferente,
  // no contexto da família) — evita repetir a mesma foto em todas as telas.
  // O protagonista do dia entra como fallback se o dono não tiver imagem.
  const out = [
    ...dePersonagem(dono, ctx, true),
    ...(protagonista && protagonista.id !== dono?.id
      ? dePersonagem(protagonista, ctx, true)
      : []),
  ];
  return [...new Set(out)];
}
