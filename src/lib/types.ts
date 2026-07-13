// Tipos compartilhados do domínio Quest (v9: sistema interno de cutting —
// só Treino + Nutrição).

/** Comportamentos registráveis (1-toque). Nutri tem dois sub-logs. */
export type Comportamento =
  | "treino"
  | "nutri_refeicao"
  | "nutri_agua"
  // Fontes abertas de Stamina (v8) — 1-toque, camada universal (sem motor).
  | "cardio"
  | "volei"
  | "resistencia";

/** Família = a aba/atributo. Nutri agrega refeição + água + cardio/vôlei/resistência. */
export type Familia = "treino" | "nutri";

/** Os dois atributos do jogador (v9). Alimentam um XP/tier ÚNICO. */
export type Atributo = "forca" | "stamina";

export type TipoReforco = "faixa_cheia" | "fallback_local";

/** Ladder de esquemas (só a Nutri usa o motor de fading). */
export type Esquema = "CRF" | "FR2" | "FR3" | "FR5" | "FR8";

export interface Atributos {
  user_id: string;
  forca: number;
  stamina: number;
  elo: number;
  xp: number;
  atualizado_em: string;
}

/** Bônus de personagem: percentual ADITIVO sobre a base. Nunca redireciona. */
export interface BonusPersonagem {
  tipo: "pct";
  valor: number; // 0.25 = +25%
}

/** Imagens de ação/atributo por contexto (urls), todas opcionais. */
export interface AssetsContexto {
  treino?: string;
  nutri?: string;
  atributo?: string;
}

export interface Personagem {
  id: string;
  slug: string;
  nome: string;
  titulo: string | null;
  atributo_foco: Atributo | null;
  comportamento_alvo: Familia | null;
  bonus: BonusPersonagem | null;
  asset_rosto: string | null;
  asset_corpo: string | null;
  assets_contexto: AssetsContexto | null;
  bio: string | null;
  lore: string | null;
  ativo: boolean;
  ordem: number;
  desbloqueado: boolean;
}

/** Objetivo de cutting (v9) — 1 linha por usuário, lazy-criada como Atributos. */
export interface Meta {
  user_id: string;
  bf_inicial: number;
  bf_alvo: number;
  peso_alvo: number;
  data_inicio: string; // date ISO (YYYY-MM-DD)
  data_alvo: string; // date ISO (YYYY-MM-DD)
  prioridades: string[];
  atualizado_em: string;
}

/** Snapshot de corpo_real usado pro cálculo de progresso do goal dashboard. */
export interface CorpoRealPonto {
  ts: string;
  peso: number | null;
  gordura_pct: number | null;
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
  food_id?: string | null;
  kcal?: number | null;
  proteina?: number | null;
  carbs?: number | null;
  gordura?: number | null;
  atividade_id?: string | null;
  peso_esforco?: number | null;
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
  /** Liga ao catálogo (exercicios.id) — traz série/reps/RIR/descanso/cadência. */
  exercicio_id?: string | null;
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

/** Como o áudio entra para este comportamento (assimetria de reforço). Só Nutri. */
export type ModoAudio = "reward";

/** Decisão de reforço devolvida pelo loop central ao cliente. */
export interface DecisaoReforco {
  hitConfirm: true;
  ganho: GainResult;
  atributo: Atributo;
  /** Esquema vigente — só para Nutri (motor de instalação). */
  esquema: Esquema | null;
  /** Faixa a tocar, se houver. */
  musica: SpotifyTrack | null;
  /** 'reward' (Nutri, esmaecível) | null. */
  modoAudio: ModoAudio | null;
  /** Jackpot de comeback (VR extra no retorno após ausência), se disparou. */
  jackpot: { xp: number; rotulo: string } | null;
  logId?: string;
}
