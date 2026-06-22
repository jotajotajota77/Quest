// Protocolo diário — config + cálculo. Trackers leves alimentam %/streak do
// protocolo, NÃO os 4 atributos (TRAVA: tracking ≠ lista de decisões).
import type { Familia } from "@/lib/types";
import { FAMILIAS_ORDEM } from "@/lib/comportamentos";

export const AGUA_META = 8;

export interface TrackersLeves {
  agua_count: number;
  sono_ok: boolean;
  passos_ok: boolean;
  sem_alcool: boolean;
}

export const TRACKERS_DEFAULT: TrackersLeves = {
  agua_count: 0,
  sono_ok: false,
  passos_ok: false,
  sem_alcool: false,
};

/** Quantos dos 4 trackers leves estão completos. */
export function trackersFeitos(t: TrackersLeves): number {
  return (
    (t.agua_count >= AGUA_META ? 1 : 0) +
    (t.sono_ok ? 1 : 0) +
    (t.passos_ok ? 1 : 0) +
    (t.sem_alcool ? 1 : 0)
  );
}

/** Total de itens do protocolo: 4 núcleo + 4 trackers leves. */
export const N_PROTOCOLO = FAMILIAS_ORDEM.length + 4;

export function pctProtocolo(nucleo: Set<Familia>, t: TrackersLeves): number {
  const feitos = nucleo.size + trackersFeitos(t);
  return Math.round((feitos / N_PROTOCOLO) * 100);
}
