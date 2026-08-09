// ============================================================
// Engine — Boss Persistente (v12). Puro, sem I/O.
// ------------------------------------------------------------
// Estende bossDaSemana com persistência semanal. Diferença crítica:
// se o boss NÃO for derrotado numa semana, o dano acumulado (só o
// EXCESSO, se derrotou) ou o dano PARCIAL vira "dano_carregado_anterior"
// da semana seguinte — o próximo boss começa com menos HP.
//
// Regra escolhida (opção "b" do design):
// - Se derrotou: XP creditado; próxima semana começa limpa.
// - Se NÃO derrotou: o dano dado à semana atual vira crédito de HP na
//   próxima. Não teto: se você deu 200 dano num boss de 400, o próximo
//   começa com HP-200 (mínimo 20% do HP total pra não zerar loot).
// ============================================================

export interface BossEstadoDB {
  user_id: string;
  semana_iso: string;
  mestre_slug: string;
  hp_total: number;
  dano_creditado: number;
  dano_carregado_anterior: number;
  derrotado_em: string | null;
  recompensa_creditada: boolean;
}

/** Dano efetivo do jogador nesta semana (dano dado + carregado). */
export function danoEfetivo(estado: {
  dano_creditado: number;
  dano_carregado_anterior: number;
}): number {
  return estado.dano_creditado + estado.dano_carregado_anterior;
}

/** HP restante = max(0, hp_total - danoEfetivo). */
export function hpRestante(estado: BossEstadoDB): number {
  return Math.max(0, estado.hp_total - danoEfetivo(estado));
}

/** Está derrotado se danoEfetivo >= hp_total. */
export function estaDerrotado(estado: BossEstadoDB): boolean {
  return danoEfetivo(estado) >= estado.hp_total;
}

/**
 * Calcula quanto dano carrega pra próxima semana quando este boss NÃO foi
 * derrotado. Piso mínimo: 20% do HP total do próximo boss. Não pode passar
 * disso pra evitar snowball infinito.
 */
export function calcularCarryOver(
  danoNestaSemana: number,
  hpProximaSemana: number,
): number {
  // Só carrega o QUE VOCÊ FEZ, não HP faltando.
  // Mas nunca deixa a semana seguinte com HP abaixo de 20% do total original
  // (pra que sempre exista boss pra bater).
  const tetoCarry = Math.floor(hpProximaSemana * 0.8);
  return Math.min(danoNestaSemana, tetoCarry);
}

/** Recompensa XP pelo boss derrotado. Fixa por hora. */
export const XP_RECOMPENSA_BOSS = 150;

/** Bonus de shards ao derrotar boss (independente de photocard). */
export const SHARDS_BONUS_BOSS = 3;
