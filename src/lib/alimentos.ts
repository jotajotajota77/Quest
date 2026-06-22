// ============================================================
// Banco de alimentos — montado do zero. Macros por 100g.
// Usado pela tela Nutri (replicando o design do app antigo: chips de categoria
// + lista de alimentos + porção). O registro detalhado é OPCIONAL: o 1-toque
// segue sendo o piso (TRAVA 1).
// ============================================================

export type CategoriaAlimento =
  | "proteina"
  | "carbo"
  | "vegetal"
  | "fruta"
  | "gordura"
  | "doce";

export interface Alimento {
  id: string;
  nome: string;
  cat: CategoriaAlimento;
  kcal: number; // por 100g
  p: number; // proteína g/100g
  c: number; // carbo g/100g
  g: number; // gordura g/100g
}

export const CATEGORIAS: { key: CategoriaAlimento; label: string; cor: string }[] = [
  { key: "proteina", label: "Proteína", cor: "#4dd0e1" },
  { key: "carbo", label: "Carbo", cor: "#ffb74d" },
  { key: "vegetal", label: "Vegetal", cor: "#81c784" },
  { key: "fruta", label: "Fruta", cor: "#f06292" },
  { key: "gordura", label: "Gordura", cor: "#fff176" },
  { key: "doce", label: "Doce", cor: "#ff8a80" },
];

export const FOOD_DB: Alimento[] = [
  // ── Proteína ──
  { id: "frango", nome: "Peito de frango grelhado", cat: "proteina", kcal: 165, p: 31, c: 0, g: 3.6 },
  { id: "ovo", nome: "Ovo inteiro", cat: "proteina", kcal: 155, p: 13, c: 1.1, g: 11 },
  { id: "clara", nome: "Clara de ovo", cat: "proteina", kcal: 52, p: 11, c: 0.7, g: 0.2 },
  { id: "patinho", nome: "Patinho (carne magra)", cat: "proteina", kcal: 187, p: 28, c: 0, g: 8 },
  { id: "tilapia", nome: "Tilápia", cat: "proteina", kcal: 128, p: 26, c: 0, g: 2.7 },
  { id: "salmao", nome: "Salmão", cat: "proteina", kcal: 208, p: 20, c: 0, g: 13 },
  { id: "atum", nome: "Atum em água", cat: "proteina", kcal: 116, p: 26, c: 0, g: 1 },
  { id: "whey", nome: "Whey protein (scoop ~30g)", cat: "proteina", kcal: 380, p: 80, c: 7, g: 6 },
  { id: "iogurte", nome: "Iogurte natural", cat: "proteina", kcal: 61, p: 3.5, c: 4.7, g: 3.3 },
  { id: "cottage", nome: "Queijo cottage", cat: "proteina", kcal: 98, p: 11, c: 3.4, g: 4.3 },
  { id: "tofu", nome: "Tofu", cat: "proteina", kcal: 76, p: 8, c: 1.9, g: 4.8 },
  // ── Carbo ──
  { id: "arroz", nome: "Arroz branco cozido", cat: "carbo", kcal: 130, p: 2.7, c: 28, g: 0.3 },
  { id: "arroz_int", nome: "Arroz integral cozido", cat: "carbo", kcal: 111, p: 2.6, c: 23, g: 0.9 },
  { id: "batata", nome: "Batata cozida", cat: "carbo", kcal: 86, p: 1.7, c: 20, g: 0.1 },
  { id: "batata_doce", nome: "Batata-doce cozida", cat: "carbo", kcal: 86, p: 1.6, c: 20, g: 0.1 },
  { id: "macarrao", nome: "Macarrão cozido", cat: "carbo", kcal: 158, p: 5.8, c: 31, g: 0.9 },
  { id: "aveia", nome: "Aveia em flocos", cat: "carbo", kcal: 389, p: 17, c: 66, g: 7 },
  { id: "pao", nome: "Pão integral", cat: "carbo", kcal: 247, p: 13, c: 41, g: 3.4 },
  { id: "tapioca", nome: "Tapioca", cat: "carbo", kcal: 358, p: 0, c: 89, g: 0 },
  { id: "feijao", nome: "Feijão cozido", cat: "carbo", kcal: 76, p: 4.8, c: 14, g: 0.5 },
  { id: "lentilha", nome: "Lentilha cozida", cat: "carbo", kcal: 116, p: 9, c: 20, g: 0.4 },
  // ── Vegetal ──
  { id: "brocolis", nome: "Brócolis", cat: "vegetal", kcal: 34, p: 2.8, c: 7, g: 0.4 },
  { id: "alface", nome: "Alface", cat: "vegetal", kcal: 15, p: 1.4, c: 2.9, g: 0.2 },
  { id: "tomate", nome: "Tomate", cat: "vegetal", kcal: 18, p: 0.9, c: 3.9, g: 0.2 },
  { id: "cenoura", nome: "Cenoura", cat: "vegetal", kcal: 41, p: 0.9, c: 10, g: 0.2 },
  { id: "espinafre", nome: "Espinafre", cat: "vegetal", kcal: 23, p: 2.9, c: 3.6, g: 0.4 },
  { id: "abobrinha", nome: "Abobrinha", cat: "vegetal", kcal: 17, p: 1.2, c: 3.1, g: 0.3 },
  { id: "pepino", nome: "Pepino", cat: "vegetal", kcal: 16, p: 0.7, c: 3.6, g: 0.1 },
  // ── Fruta ──
  { id: "banana", nome: "Banana", cat: "fruta", kcal: 89, p: 1.1, c: 23, g: 0.3 },
  { id: "maca", nome: "Maçã", cat: "fruta", kcal: 52, p: 0.3, c: 14, g: 0.2 },
  { id: "morango", nome: "Morango", cat: "fruta", kcal: 32, p: 0.7, c: 7.7, g: 0.3 },
  { id: "laranja", nome: "Laranja", cat: "fruta", kcal: 47, p: 0.9, c: 12, g: 0.1 },
  { id: "abacaxi", nome: "Abacaxi", cat: "fruta", kcal: 50, p: 0.5, c: 13, g: 0.1 },
  { id: "mamao", nome: "Mamão", cat: "fruta", kcal: 43, p: 0.5, c: 11, g: 0.3 },
  { id: "uva", nome: "Uva", cat: "fruta", kcal: 69, p: 0.7, c: 18, g: 0.2 },
  // ── Gordura ──
  { id: "abacate", nome: "Abacate", cat: "gordura", kcal: 160, p: 2, c: 9, g: 15 },
  { id: "azeite", nome: "Azeite (colher ~13g)", cat: "gordura", kcal: 884, p: 0, c: 0, g: 100 },
  { id: "amendoim", nome: "Pasta de amendoim", cat: "gordura", kcal: 588, p: 25, c: 20, g: 50 },
  { id: "castanha", nome: "Castanha-do-pará", cat: "gordura", kcal: 656, p: 14, c: 12, g: 66 },
  { id: "queijo", nome: "Queijo muçarela", cat: "gordura", kcal: 280, p: 28, c: 3.1, g: 17 },
  // ── Doce (registro honesto, sem julgamento) ──
  { id: "chocolate", nome: "Chocolate ao leite", cat: "doce", kcal: 535, p: 7.6, c: 59, g: 30 },
  { id: "sorvete", nome: "Sorvete", cat: "doce", kcal: 207, p: 3.5, c: 24, g: 11 },
  { id: "refri", nome: "Refrigerante", cat: "doce", kcal: 42, p: 0, c: 11, g: 0 },
  { id: "biscoito", nome: "Biscoito recheado", cat: "doce", kcal: 480, p: 6, c: 70, g: 20 },
];

// Metas diárias (default; ajustáveis no futuro). Placar, não validador.
export const META_KCAL = 2200;
export const META_PROTEINA = 150;
export const META_CARBO = 230;
export const META_GORDURA = 70;

/** Escala os macros de um alimento para uma porção em gramas. */
export function escalar(a: Alimento, gramas: number) {
  const f = gramas / 100;
  return {
    kcal: Math.round(a.kcal * f),
    p: Math.round(a.p * f),
    c: Math.round(a.c * f),
    g: Math.round(a.g * f),
  };
}
