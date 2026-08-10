// ============================================================
// Rótulos amigáveis pros novos campos v10 de personagens (mestres).
// ------------------------------------------------------------
// domínio (guardado pelo mestre) e faixa canônica (o "rank do boss").
// Também: convenção de path pras poses ilustradas de cada mestre.
// ============================================================

/** Pose ilustrada por contexto — arquivos ficam em
 *  /personagens/<slug>/pose_<pose>.png. Fallback gracioso (CharacterImage
 *  cai na inicial se a imagem não existir). */
export type PoseKey =
  | "rosto"     // portrait/rosto — existente (rosto.png)
  | "corpo"     // full-body neutra — existente (corpo.png)
  | "treino"    // pose de treino (musculação, halter, foco força)
  | "palco"     // pose idol/palco (dança, presença, luz de show)
  | "kihap"     // pose de kihap/luta (taekwondo, kicking stance)
  | "sparring"  // pose de sparring TKD (guarda + rotação — mestre OU Sanha)
  | "vitoria"   // pose vitória (PR, streak marco, mestre desafiável)
  | "espelho";  // pose corpo frontal (só usada pro Sanha na aba Espelho)

const NOMES_ARQUIVO: Record<PoseKey, string> = {
  rosto: "rosto.png",
  corpo: "corpo.png",
  treino: "pose_treino.png",
  palco: "pose_palco.png",
  kihap: "pose_kihap.png",
  sparring: "pose_sparring.png",
  vitoria: "pose_vitoria.png",
  espelho: "pose_espelho.png",
};

export function imagemPose(slug: string, pose: PoseKey): string {
  return `/personagens/${slug}/${NOMES_ARQUIVO[pose]}`;
}

/**
 * v12.4: cascata pra <CharacterImage srcs>. Se a pose preferida não existir
 * (ex: pose_vitoria ainda não desenhada), cai em kihap → treino → corpo →
 * rosto antes de mostrar a letra inicial. Uso: srcs={posesCascata(slug, "vitoria")}.
 */
export function posesCascata(slug: string, preferida: PoseKey): string[] {
  const ordem: PoseKey[] = [preferida, "kihap", "treino", "corpo", "rosto"];
  const visto = new Set<PoseKey>();
  return ordem
    .filter((p) => {
      if (visto.has(p)) return false;
      visto.add(p);
      return true;
    })
    .map((p) => imagemPose(slug, p));
}

/** Pose que combina com o domínio do mestre — usada no hero da home. */
export function poseParaDominio(dominio: string | null | undefined): PoseKey {
  switch (dominio) {
    case "upper":
    case "lower":
    case "abs":
      return "treino";
    case "danca":
      return "palco";
    case "taekwondo":
      return "kihap";
    default:
      return "corpo";
  }
}

export const LABEL_DOMINIO: Record<string, string> = {
  upper: "Upper",              // peito, costas, ombros, braços (prioridade peito superior)
  lower: "Lower",              // pernas, glúteo, posterior
  abs: "Abs / Core",
  danca: "Dança",
  taekwondo: "Taekwondo",
  avatar: "Trainee",
  // Aliases retro-compat pra qualquer row ainda com o nome antigo:
  bracos: "Upper",
  pernas: "Lower",
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

/** Foco de hoje derivado do mestre escolhido (o domínio direciona o dia). */
export interface FocoDoMestre {
  dominio: string;
  titulo: string;      // ex.: "Braços · treino de push/pull"
  descricao: string;   // ex.: "Ryuki te chama. Supino, remada, elevações."
  href: string;        // rota primária pra abrir o foco
}

export function focoDoMestre(mestre: {
  nome: string;
  dominio: string | null;
} | null): FocoDoMestre {
  const nome = mestre?.nome ?? "O sabum";
  const dominio = mestre?.dominio ?? "avatar";
  switch (dominio) {
    case "upper":
    case "bracos": // retro-compat pra rows antigas
      return {
        dominio,
        titulo: "Upper · peito + costas + ombros",
        descricao: `${nome} te chama. Prioridade peito superior — supino inclinado, puxada aberta, elevação lateral.`,
        href: "/treino",
      };
    case "abs":
      return {
        dominio,
        titulo: "Abs · core com carga",
        descricao: `${nome} te chama. Crunch na polia, prancha, elevação de pernas — controle absoluto.`,
        href: "/treino",
      };
    case "lower":
    case "pernas": // retro-compat
      return {
        dominio,
        titulo: "Lower · pernas + posterior",
        descricao: `${nome} te chama. Agachamento, leg press, stiff — base firme.`,
        href: "/treino",
      };
    case "danca":
      return {
        dominio,
        titulo: "Dança K-pop · presença",
        descricao: `${nome} te chama. Sortear uma coreografia e dançar por 1-2 faixas.`,
        href: "/nutri",
      };
    case "taekwondo":
      return {
        dominio,
        titulo: "Taekwondo · dojang",
        descricao: `${nome} te chama. Aquecimento + corda + sparring ou hapkido.`,
        href: "/treino",
      };
    default:
      return {
        dominio,
        titulo: "Foco livre",
        descricao: "Escolha um mestre no hub pra direcionar o dia.",
        href: "/hub",
      };
  }
}

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
