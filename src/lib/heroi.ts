// ============================================================
// Imagens contextuais do personagem — regra de exibição com fallback gracioso.
// ------------------------------------------------------------
// v10.2: quando um MESTRE está selecionado no hub, TODAS as abas mostram só
// imagens dele (na pose que combina com o contexto) + o avatar do jogador
// (Sanha) como reserva. Não puxa mais o "dono do atributo" — evita mostrar
// mestre não escolhido.
//
// Ordem de tentativa (o componente cai pra silhueta se todas falharem):
//   1. Mestre do dia na POSE do contexto (kihap, palco, treino…)
//   2. Mestre do dia — retrato/corpo neutro
//   3. Sanha na mesma pose do contexto
//   4. Sanha — retrato/corpo neutro
// ============================================================
import type { Familia, Personagem } from "@/lib/types";
import { imagemPose, poseParaDominio, type PoseKey } from "@/lib/personagens";

export type ContextoHero = Familia | "home" | "taekwondo" | "danca" | "quests";

/** Pose que combina com o contexto/aba. */
function poseParaContexto(ctx: ContextoHero): PoseKey {
  switch (ctx) {
    case "treino":
      return "treino";
    case "nutri":
      return "corpo";
    case "taekwondo":
      return "kihap";
    case "danca":
      return "palco";
    case "quests":
      return "vitoria";
    case "home":
    default:
      return "corpo";
  }
}

function candidatosDePersonagem(
  p: Personagem | null,
  ctx: ContextoHero,
): string[] {
  if (!p) return [];
  const out: string[] = [];
  // Pose do contexto primeiro
  out.push(imagemPose(p.slug, poseParaContexto(ctx)));
  // Pose do domínio do próprio mestre (só faz sentido se ele tem domínio)
  if (p.dominio) out.push(imagemPose(p.slug, poseParaDominio(p.dominio)));
  // Retrato / corpo neutro (assets_contexto + campos legados)
  const a = p.assets_contexto ?? {};
  if (ctx !== "home" && ctx !== "taekwondo" && ctx !== "danca" && ctx !== "quests") {
    const legado = a[ctx as Familia];
    if (legado) out.push(legado);
  }
  if (a.atributo) out.push(a.atributo);
  if (p.asset_corpo) out.push(p.asset_corpo);
  if (p.asset_rosto) out.push(p.asset_rosto);
  out.push(imagemPose(p.slug, "corpo"));
  out.push(imagemPose(p.slug, "rosto"));
  return out;
}

/** v10.2: candidatos do hero = mestre do dia + Sanha (fallback). */
export function candidatosHero(
  ctx: ContextoHero,
  mestre: Personagem | null,
  avatar: Personagem | null = null,
): string[] {
  const out = [
    ...candidatosDePersonagem(mestre, ctx),
    ...candidatosDePersonagem(avatar, ctx),
  ];
  return [...new Set(out)];
}
