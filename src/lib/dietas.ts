// ============================================================
// Modelos de dieta prontos (v4 afinamento) — análogo aos PRESETS de treino.
// ------------------------------------------------------------
// Cada modelo já vem com as refeições e os alimentos listados; o usuário só
// AJUSTA as gramas e registra. Reduz o custo de preenchimento (anti-atrito,
// ADHD). Não é validador nem cardápio fechado: é um ponto de partida editável.
// Os foodId referenciam ids reais do food_db (migration 0006).
// ============================================================

export interface ItemDieta {
  foodId: string;
  gramas: number; // porção padrão (editável na tela)
}

export interface RefeicaoModelo {
  nome: string;
  itens: ItemDieta[];
}

export interface ModeloDieta {
  id: string;
  nome: string;
  descricao: string;
  refeicoes: RefeicaoModelo[];
}

export const MODELOS_DIETA: ModeloDieta[] = [
  {
    id: "cutting",
    nome: "Cutting / Definição",
    descricao: "Alta proteína, calorias controladas (~1900 kcal). Para secar mantendo músculo.",
    refeicoes: [
      {
        nome: "Café",
        itens: [
          { foodId: "ovo", gramas: 100 },
          { foodId: "aveia", gramas: 40 },
          { foodId: "banana", gramas: 100 },
        ],
      },
      {
        nome: "Almoço",
        itens: [
          { foodId: "frango_peito", gramas: 150 },
          { foodId: "arroz", gramas: 120 },
          { foodId: "feijao", gramas: 80 },
          { foodId: "brocolis", gramas: 100 },
        ],
      },
      {
        nome: "Lanche",
        itens: [
          { foodId: "whey", gramas: 30 },
          { foodId: "pasta_amendoim", gramas: 15 },
        ],
      },
      {
        nome: "Janta",
        itens: [
          { foodId: "patinho", gramas: 130 },
          { foodId: "batata_doce", gramas: 150 },
          { foodId: "alface", gramas: 50 },
          { foodId: "tomate", gramas: 50 },
        ],
      },
    ],
  },
  {
    id: "manutencao",
    nome: "Manutenção",
    descricao: "Equilíbrio de macros (~2200 kcal). Para manter peso e performar bem.",
    refeicoes: [
      {
        nome: "Café",
        itens: [
          { foodId: "pao_integral", gramas: 60 },
          { foodId: "ovo", gramas: 100 },
          { foodId: "iogurte_natural", gramas: 150 },
          { foodId: "banana", gramas: 100 },
        ],
      },
      {
        nome: "Almoço",
        itens: [
          { foodId: "frango_peito", gramas: 150 },
          { foodId: "arroz", gramas: 150 },
          { foodId: "feijao", gramas: 100 },
          { foodId: "cenoura", gramas: 80 },
        ],
      },
      {
        nome: "Lanche",
        itens: [
          { foodId: "maca", gramas: 130 },
          { foodId: "castanha_para", gramas: 20 },
        ],
      },
      {
        nome: "Janta",
        itens: [
          { foodId: "tilapia", gramas: 150 },
          { foodId: "batata", gramas: 180 },
          { foodId: "brocolis", gramas: 100 },
        ],
      },
    ],
  },
  {
    id: "bulking",
    nome: "Bulking leve / Ganho",
    descricao: "Superávit calórico (~2700 kcal). Para ganhar massa com ganho de gordura mínimo.",
    refeicoes: [
      {
        nome: "Café",
        itens: [
          { foodId: "aveia", gramas: 60 },
          { foodId: "whey", gramas: 30 },
          { foodId: "banana", gramas: 120 },
          { foodId: "pasta_amendoim", gramas: 20 },
        ],
      },
      {
        nome: "Almoço",
        itens: [
          { foodId: "file_mignon", gramas: 160 },
          { foodId: "arroz", gramas: 200 },
          { foodId: "feijao", gramas: 120 },
        ],
      },
      {
        nome: "Lanche",
        itens: [
          { foodId: "pao_integral", gramas: 80 },
          { foodId: "ovo", gramas: 100 },
        ],
      },
      {
        nome: "Janta",
        itens: [
          { foodId: "frango_peito", gramas: 180 },
          { foodId: "macarrao", gramas: 150 },
          { foodId: "azeite", gramas: 10 },
        ],
      },
      {
        nome: "Ceia",
        itens: [
          { foodId: "iogurte_natural", gramas: 170 },
          { foodId: "granola", gramas: 30 },
        ],
      },
    ],
  },
];
