// Tipos compartilhados do domínio Quest (app completo: 4 comportamentos).

/** Comportamentos registráveis (1-toque). Nutri tem dois sub-logs. */
export type Comportamento =
  | "treino"
  | "nutri_refeicao"
  | "nutri_agua"
  | "leitura"
  | "danca";

/** Família = a aba/atributo. Nutri agrega refeição + água. */
export type Familia = "treino" | "nutri" | "leitura" | "danca";

/** Os quatro atributos do jogador. Alimentam um Elo ÚNICO. */
export type Atributo = "forca" | "stamina" | "sabedoria" | "destreza";

export type TipoReforco = "faixa_cheia" | "fallback_local";

/** Ladder de esquemas (só a Nutri usa o motor de fading). */
export type Esquema = "CRF" | "FR2" | "FR3" | "FR5" | "FR8";

export interface Atributos {
  user_id: string;
  forca: number;
  stamina: number;
  sabedoria: number;
  destreza: number;
  elo: number;
  xp: number;
  atualizado_em: string;
}

/** Bônus de personagem: percentual ADITIVO sobre a base. Nunca redireciona. */
export interface BonusPersonagem {
  tipo: "pct";
  valor: number; // 0.25 = +25%
}

export interface Personagem {
  id: string;
  slug: string;
  nome: string;
  titulo: string | null;
  atributo_foco: Atributo;
  comportamento_alvo: Familia;
  bonus: BonusPersonagem;
  asset_rosto: string | null;
  asset_corpo: string | null;
  bio: string | null;
  lore: string | null;
  ativo: boolean;
  ordem: number;
}

export interface ScheduleState {
  user_id: string;
  comportamento: Familia;
  esquema_atual: Esquema;
  nivel_afinamento: number;
  ultima_transicao: string;
}

export interface LogRow {
  id: string;
  user_id: string;
  ts: string;
  comportamento: Comportamento;
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  nome: string;
  artistas: string;
  capa: string | null;
}

export interface GainResult {
  base: number; // base protegida do comportamento (independe do personagem)
  bonus: number; // camada aditiva (+25%) do protagonista do dia, se favorece
  total: number;
}

export interface TreinoExercicio {
  id: string;
  user_id: string;
  nome: string;
  grupo_muscular: string | null;
  split: string | null;
  ordem: number;
  custom: boolean;
}

export interface TreinoSerie {
  id: string;
  user_id: string;
  exercicio_id: string | null;
  nome: string;
  peso: number | null;
  reps: number | null;
  ts: string;
  is_pr: boolean;
}

/** Como o áudio entra para este comportamento (assimetria de reforço). */
export type ModoAudio = "reward" | "trilha";

/** Decisão de reforço devolvida pelo loop central ao cliente. */
export interface DecisaoReforco {
  hitConfirm: true;
  ganho: GainResult;
  atributo: Atributo;
  /** Esquema vigente — só para Nutri (motor de instalação). */
  esquema: Esquema | null;
  /** Faixa a tocar, se houver. */
  musica: SpotifyTrack | null;
  /** 'reward' (Nutri, esmaecível) | 'trilha' (Dança, não esmaece) | null. */
  modoAudio: ModoAudio | null;
  /** Jackpot de comeback (VR extra no retorno após ausência), se disparou. */
  jackpot: { xp: number; rotulo: string } | null;
  logId?: string;
}
