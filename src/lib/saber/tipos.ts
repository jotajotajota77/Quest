// ============================================================
// Tipos compartilhados do módulo SABER (Fase 1).
// ============================================================

export type ApostilaSlug = "genero" | "qv_hap";
export type DominioSaber = "genero" | "qv_hap" | "metodo" | "escrita";

export interface Conceito {
  slug: string;
  titulo: string;
  apostila: ApostilaSlug;
  dominio: DominioSaber;
  unidade: string | null;
  tese: string;
  definicao: string | null;
  armadilha: string | null;
  exemplo: string | null;
  criterio: string | null;
  gancho: string | null;
  ano_origem: number | null;
  autor_origem: string | null;
  fronteira: string | null;
}

export type ForcaAresta = "duro" | "macio";

export interface Aresta {
  conceito: string;
  requer: string;
  forca: ForcaAresta;
}

export type Camada = 1 | 2 | 3;

export interface Item {
  id: number;
  conceito: string;
  camada: Camada;
  enunciado: string;
  rubrica: string | null;
}

export interface MasteryConceito {
  conceito: string;
  xp: number;
  nivel: 0 | 1 | 2 | 3;
}

export type OrdemEstudo = "didatica" | "cronologica" | "projeto";

/** Nivel mínimo do requerido pra desbloquear o dependente. */
export const NIVEL_ABRE_DEPENDENTE = 2;
