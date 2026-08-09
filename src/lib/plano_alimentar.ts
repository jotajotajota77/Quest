// ============================================================
// Plano alimentar v12.PR3 — cutting 31 dias (10/08 → 09/09/2026).
// ------------------------------------------------------------
// Puro (sem I/O). Rotação fixa por dia da semana. Cada modelo fecha
// ~1.750–1.840 kcal e ~150–161 g de proteína.
//
// v12 PR3 · usuário não come macarrão — Modelo C substituído por
// "Bolonhesa de carne com arroz" (mesma faixa de kcal/prot).
// ============================================================

export interface RefeicaoAlimentar {
  refeicao: "café da manhã" | "almoço" | "lanche da tarde" | "jantar" | "ceia";
  itens: string[];
}

export interface ModeloDia {
  slug: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  nome: string;
  dia_semana_padrao: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  observacao?: string;
  kcal: number;
  proteina_g: number;
  carbo_g: number;
  gordura_g: number;
  refeicoes: RefeicaoAlimentar[];
}

export const MODELOS_ALIMENTARES: ModeloDia[] = [
  {
    slug: "A",
    nome: "Omelete & Frango Clássico",
    dia_semana_padrao: 1, // Segunda — TKD noite
    observacao: "Treino duplo — adicione 1 fruta pré-TKD.",
    kcal: 1830, proteina_g: 158, carbo_g: 197, gordura_g: 46,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "Omelete 2 ovos + 3 claras (couve, tomate, cebola, 1 c. chá óleo) — ~240 g prontos",
        "1 pão francês (50 g)",
        "Café preto sem açúcar",
      ]},
      { refeicao: "almoço", itens: [
        "Peito de frango grelhado 170 g cozido",
        "Arroz branco 100 g cozido",
        "Feijão carioca 120 g cozido",
        "Salada (alface, tomate, pepino, cenoura) 120 g + limão + 1 c. chá azeite",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Sanduíche de atum (pão 50 g + atum em água 80 g + alface/tomate)",
        "1 maçã (130 g)",
      ]},
      { refeicao: "jantar", itens: [
        "Carne moída patinho 100 g refogada + molho de tomate 60 g",
        "Arroz branco 100 g cozido",
        "Legumes refogados (abobrinha, cenoura, chuchu) 150 g + 1 c. chá óleo",
      ]},
      { refeicao: "ceia", itens: [
        "Leite semidesnatado 250 ml",
        "Mamão 120 g",
      ]},
    ],
  },
  {
    slug: "B",
    nome: "Hambúrguer caseiro & Ovos",
    dia_semana_padrao: 6, // Sábado
    kcal: 1829, proteina_g: 151, carbo_g: 201, gordura_g: 42,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "Ovos mexidos (2 ovos + 2 claras, cebolinha, 1 c. chá óleo) — ~180 g",
        "1 pão francês (50 g)",
        "1 laranja (130 g)",
      ]},
      { refeicao: "almoço", itens: [
        "Frango desfiado bem temperado 170 g cozido",
        "Arroz branco 100 g cozido",
        "Feijão carioca 120 g cozido",
        "Salada (repolho, cenoura, tomate) 120 g + limão",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Vitamina (leite 200 ml + banana 100 g + aveia 20 g)",
        "1 ovo cozido",
      ]},
      { refeicao: "jantar", itens: [
        "Hambúrguer caseiro patinho 120 g",
        "1 pão francês (50 g)",
        "Salada/cebola/tomate + 15 g ketchup + 10 g mostarda",
      ]},
      { refeicao: "ceia", itens: [
        "Iogurte natural desnatado 170 g",
        "Mamão 150 g",
      ]},
    ],
  },
  {
    slug: "C",
    nome: "Bolonhesa de carne com arroz (sem macarrão)",
    dia_semana_padrao: 3, // Quarta — TKD noite
    observacao: "Treino duplo — adicione 1 fruta pré-TKD. Substituição do macarrão por arroz mantendo kcal/prot.",
    kcal: 1830, proteina_g: 155, carbo_g: 190, gordura_g: 50,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "3 panquecas de banana e aveia (2 ovos + 3 claras + banana 100 g + aveia 30 g + canela)",
        "Café preto sem açúcar",
      ]},
      { refeicao: "almoço", itens: [
        "Bolonhesa sem massa: carne moída patinho 130 g cozido + molho de tomate 80 g",
        "Arroz branco 100 g cozido (substitui os 120 g de macarrão do plano original)",
        "Salada verde 120 g + limão + 1 c. chá azeite",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Iogurte natural desnatado 170 g + mamão 150 g + aveia 15 g",
        "2 ovos cozidos",
      ]},
      { refeicao: "jantar", itens: [
        "Peito de frango grelhado 170 g cozido",
        "Arroz branco 100 g cozido",
        "Legumes refogados 150 g + 1 c. chá óleo",
      ]},
      { refeicao: "ceia", itens: [
        "Leite semidesnatado 200 ml",
        "1 maçã (130 g)",
      ]},
    ],
  },
  {
    slug: "D",
    nome: "Batata & Sardinha",
    dia_semana_padrao: 4, // Quinta — marmita
    observacao: "Dia de marmita.",
    kcal: 1822, proteina_g: 150, carbo_g: 195, gordura_g: 53,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "Pão integral 2 fatias + ovos mexidos (2 ovos + 2 claras) + requeijão light 15 g",
        "1 laranja (130 g)",
      ]},
      { refeicao: "almoço", itens: [
        "Peito de frango grelhado 180 g cozido",
        "Batata assada 150 g",
        "Feijão carioca 100 g cozido",
        "Salada 120 g + limão + 1 c. chá azeite",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Iogurte natural desnatado 170 g + banana 100 g + aveia 20 g",
      ]},
      { refeicao: "jantar", itens: [
        "Patê de sardinha (1 lata 84 g + 2 ovos) + arroz 80 g + legumes refogados 150 g + 1 c. chá óleo",
      ]},
      { refeicao: "ceia", itens: [
        "Leite semidesnatado 250 ml",
        "Mamão 150 g",
      ]},
    ],
  },
  {
    slug: "E",
    nome: "Galinhada & Wrap de Frango",
    dia_semana_padrao: 0, // Domingo — meal prep
    observacao: "Dia de meal prep.",
    kcal: 1818, proteina_g: 161, carbo_g: 195, gordura_g: 42,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "1 pão francês (50 g) + ovos mexidos (2 ovos + 2 claras)",
        "1 banana (100 g)",
      ]},
      { refeicao: "almoço", itens: [
        "Galinhada fit: arroz 120 g + frango desfiado 130 g + cenoura/cebola/açafrão",
        "Feijão carioca 80 g cozido",
        "Salada 120 g + limão",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Iogurte natural desnatado 170 g + mamão 150 g + aveia 20 g",
        "2 ovos cozidos",
      ]},
      { refeicao: "jantar", itens: [
        "Wrap de frango: pão integral 2 fatias + frango desfiado 160 g + requeijão light 15 g + alface/tomate",
      ]},
      { refeicao: "ceia", itens: [
        "Leite semidesnatado 200 ml",
        "1 maçã (130 g)",
      ]},
    ],
  },
  {
    slug: "F",
    nome: "Cachorro-quente caseiro & Frango",
    dia_semana_padrao: 5, // Sexta — TKD noite + marmita
    observacao: "Treino duplo + marmita.",
    kcal: 1752, proteina_g: 161, carbo_g: 192, gordura_g: 39,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "3 panquecas de banana e aveia (2 ovos + 3 claras + banana 100 g + aveia 30 g)",
        "Café preto sem açúcar",
      ]},
      { refeicao: "almoço", itens: [
        "Peito de frango grelhado 170 g cozido",
        "Arroz branco 90 g cozido",
        "Feijão carioca 120 g cozido",
        "Salada 120 g + limão",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Cachorro-quente fit: 1 pão francês (50 g) + frango desfiado 80 g + molho de tomate 40 g + ketchup/mostarda",
      ]},
      { refeicao: "jantar", itens: [
        "Carne moída patinho 100 g + molho de tomate 60 g",
        "Arroz branco 80 g cozido",
        "Legumes refogados 150 g + 1 c. chá óleo",
      ]},
      { refeicao: "ceia", itens: [
        "Iogurte natural desnatado 170 g",
        "1 maçã (130 g)",
      ]},
    ],
  },
  {
    slug: "G",
    nome: "Atum, Batata-doce & Ovos",
    dia_semana_padrao: 2, // Terça
    kcal: 1733, proteina_g: 149, carbo_g: 195, gordura_g: 44,
    refeicoes: [
      { refeicao: "café da manhã", itens: [
        "Ovos mexidos (2 ovos + 2 claras) + 1 pão francês (50 g) + tomate",
        "1 laranja (130 g)",
      ]},
      { refeicao: "almoço", itens: [
        "Atum em água escorrido 120 g",
        "Arroz branco 90 g cozido",
        "Feijão carioca 100 g cozido",
        "Salada 120 g + limão + 1 c. chá azeite",
      ]},
      { refeicao: "lanche da tarde", itens: [
        "Vitamina (leite 200 ml + banana 100 g + aveia 10 g)",
        "2 ovos cozidos",
      ]},
      { refeicao: "jantar", itens: [
        "Peito de frango grelhado 160 g cozido",
        "Batata-doce assada 150 g",
        "Legumes refogados 150 g + 1 c. chá óleo",
      ]},
      { refeicao: "ceia", itens: [
        "Iogurte natural desnatado 170 g",
        "Mamão 150 g",
      ]},
    ],
  },
];

/** Retorna o modelo alimentar do dia da semana. */
export function modeloDoDia(dow: number): ModeloDia {
  return MODELOS_ALIMENTARES.find((m) => m.dia_semana_padrao === dow) ?? MODELOS_ALIMENTARES[0];
}

/** Metas diárias fixas do cutting. */
export const METAS_CUTTING = {
  kcal: 1800,
  proteina_g: 150,
  carbo_g_min: 185,
  carbo_g_max: 195,
  gordura_g: 50,
  fibra_g_min: 28,
  agua_L_min: 3,
  agua_L_max: 3.5,
  peso_alvo_kg: 63,
  bf_alvo_pct: 14.5,
  janela_inicio: "2026-08-10",
  janela_fim: "2026-09-09",
} as const;
