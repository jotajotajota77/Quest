// Tipos compartilhados do domínio Quest.
//
// V1 só tem o comportamento 'dieta'. Os demais ficam previstos no tipo para o
// código já nascer extensível, mas estão INERTES (sem motor ligado) no V1.

export type Comportamento = "dieta"; // V2: | "treino" | "leitura" | "danca"

export type TipoLogDieta = "refeicao" | "hidratacao";

export type TipoReforco = "faixa_cheia" | "fallback_local";

/** Ladder de esquemas de reforço, do mais denso (CRF) ao mais magro. */
export type Esquema = "CRF" | "FR2" | "FR3" | "FR5" | "FR8";

export interface Atributos {
  user_id: string;
  stamina: number;
  elo: number;
  xp: number;
  estado_personagem: Record<string, unknown>;
  atualizado_em: string;
}

/** Bônus de personagem: SEMPRE aditivo. Nunca redireciona/subtrai a base. */
export interface BonusPersonagem {
  tipo: "aditivo";
  magnitude: number;
}

export interface Personagem {
  id: string;
  nome: string;
  atributo_foco: string; // 'stamina'
  comportamento_alvo: Comportamento;
  bonus: BonusPersonagem;
  asset_rosto: string | null;
  asset_corpo: string | null;
  lore: string | null;
  ativo: boolean;
  ordem: number;
}

export interface ScheduleState {
  user_id: string;
  comportamento: Comportamento;
  esquema_atual: Esquema;
  nivel_afinamento: number;
  ultima_transicao: string;
}

export interface LogDietaLatencia {
  id: string;
  user_id: string;
  ts: string;
  tipo: TipoLogDieta;
  latencia_seg: number;
}

export interface SpotifyTrack {
  id: string;
  uri: string;
  nome: string;
  artistas: string;
  capa: string | null;
}

/** Decisão de reforço devolvida pelo loop central ao cliente. */
export interface DecisaoReforco {
  /** Hit-confirm local SEMPRE dispara — independe de rede. O cliente já tocou. */
  hitConfirm: true;
  /** Ganho aplicado ao placar (base protegida + bônus aditivo). */
  ganho: GainResult;
  /** Se o esquema atual manda tocar música agora, a faixa nova-no-sistema vem aqui. */
  musica: SpotifyTrack | null;
  /** Esquema vigente após a reavaliação do fading. */
  esquema: Esquema;
}

export interface GainResult {
  base: number; // base protegida do comportamento (nunca depende do personagem)
  bonus: number; // camada aditiva do personagem do dia (>= 0)
  total: number; // base + bonus
}
