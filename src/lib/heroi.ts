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
  const out = [
    ...dePersonagem(protagonista, ctx, true), // 1 + 2
    ...(dono && dono.id !== protagonista?.id ? dePersonagem(dono, ctx, true) : []), // 3 + 4
  ];
  return [...new Set(out)];
}
