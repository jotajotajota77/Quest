// ============================================================
// Dicas de treino EXPANDIDAS e personalizadas pela descrição de perfil.
// Pura função (sem rede, sem IA): detecta palavras-chave do perfil (objetivo,
// nível, limitação, contexto) e monta uma lista de dicas relevantes. Sempre
// completa com fundamentos. A Análise IA (Claude) é a camada extra por cima.
// ============================================================

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const FUNDAMENTOS = [
  "Sobrecarga progressiva: tente bater o peso OU as reps do registro anterior.",
  "Técnica antes de carga — amplitude completa e descida controlada (2–3s).",
  "Registre toda série, até as ruins; o histórico é o que guia o ajuste.",
  "Compostos pesados primeiro, isoladores depois.",
];

const POR_OBJETIVO: Record<string, string[]> = {
  hipertrofia: [
    "Mire 10–20 séries por grupo muscular na semana, na faixa de 6–15 reps.",
    "Leve a maioria das séries a 1–3 reps da falha (RIR 1–3).",
    "Use isoladores pra 'finalizar' o músculo depois do composto.",
    "Proteína em 1.6–2.2 g/kg — músculo precisa de matéria-prima.",
  ],
  forca: [
    "Trabalhe pesado em 3–6 reps nos grandes compostos.",
    "Descanse 3–5 min entre séries pesadas — força precisa de recuperação total.",
    "Progrida pouco e sempre: +2.5–5 kg quando bater as reps-alvo.",
    "Aqueça com séries de aproximação até a carga de trabalho.",
  ],
  emagrecer: [
    "Treino preserva músculo; o déficit calórico é quem queima gordura — mantenha a carga.",
    "Não troque musculação por só cardio: peso na barra protege a massa magra.",
    "Densidade: reduza descanso ou use bi-sets pra gastar mais em menos tempo.",
    "Passos/caminhada no resto do dia somam mais que cardio sofrido pontual.",
  ],
  resistencia: [
    "Reps altas (15–25) e descansos curtos (30–60s) treinam resistência.",
    "Circuitos e super-séries elevam o condicionamento sem perder força.",
    "Inclua core e unilaterais pra estabilidade.",
  ],
};

const POR_NIVEL: Record<string, string[]> = {
  iniciante: [
    "Iniciante: foque em aprender o movimento — full-body 3x/semana já progride muito.",
    "Você ganha carga quase toda semana: aproveite a 'sorte de iniciante'.",
    "Constância > complexidade. Nada de técnicas avançadas ainda.",
  ],
  intermediario: [
    "Intermediário: a progressão alonga — pense em ciclos de semanas, não dia a dia.",
    "Comece a variar exercícios e faixas de rep pra furar platôs.",
  ],
  avancado: [
    "Avançado: gerencie fadiga com deload a cada 4–8 semanas.",
    "Periodize volume/intensidade; PR vem de planejamento, não de 'ir com tudo' sempre.",
  ],
};

const POR_LIMITACAO: Record<string, string[]> = {
  joelho: [
    "Joelho sensível: amplitude sem dor, agachamento na caixa e fortaleça posterior/glúteo.",
  ],
  ombro: [
    "Ombro sensível: pegada neutra/halteres, evite trás da nuca e fortaleça o manguito (face pull).",
  ],
  lombar: [
    "Lombar sensível: caprice na técnica do terra/agachamento, fortaleça o core e use variações apoiadas.",
  ],
  lesao: [
    "Com dor: trabalhe na amplitude indolor, reduza carga e progrida aos poucos — não empurre a dor.",
  ],
};

const POR_CONTEXTO: Record<string, string[]> = {
  casa: [
    "Em casa: explore reps altas, cadência lenta e unilaterais pra compensar pouca carga.",
    "Elásticos, mochila com peso e isometria aumentam a dificuldade sem equipamento.",
  ],
  tempo: [
    "Pouco tempo: 2–3 compostos pesados e corte o supérfluo — 30 min bem feitos rendem.",
    "Super-séries de músculos opostos treinam mais em menos tempo.",
  ],
};

const GATILHOS: Record<string, { tabela: Record<string, string[]>; chave: string; termos: string[] }[]> = {};
// (mapa montado abaixo)

interface Regra {
  termos: string[];
  dicas: string[];
}

const REGRAS: Regra[] = [
  { termos: ["hipertrofia", "massa", "muscul", "crescer", "volume"], dicas: POR_OBJETIVO.hipertrofia },
  { termos: ["forca", "força", "forte", "powerlifting", "1rm", "maximo", "máximo"], dicas: POR_OBJETIVO.forca },
  { termos: ["emagrec", "secar", "perder peso", "definic", "cutting", "gordura"], dicas: POR_OBJETIVO.emagrecer },
  { termos: ["resistencia", "resistência", "condicionamento", "folego", "fôlego", "cardio", "aerobic"], dicas: POR_OBJETIVO.resistencia },
  { termos: ["iniciante", "comecando", "começando", "novato", "nunca treinei", "comecei agora"], dicas: POR_NIVEL.iniciante },
  { termos: ["intermediario", "intermediário"], dicas: POR_NIVEL.intermediario },
  { termos: ["avancado", "avançado", "experiente", "veterano", "anos de treino"], dicas: POR_NIVEL.avancado },
  { termos: ["joelho"], dicas: POR_LIMITACAO.joelho },
  { termos: ["ombro"], dicas: POR_LIMITACAO.ombro },
  { termos: ["lombar", "coluna", "hernia", "hérnia", "lower back"], dicas: POR_LIMITACAO.lombar },
  { termos: ["lesao", "lesão", "dor", "machuc"], dicas: POR_LIMITACAO.lesao },
  { termos: ["casa", "home", "sem academia", "sem equipamento"], dicas: POR_CONTEXTO.casa },
  { termos: ["pouco tempo", "sem tempo", "corrido", "30 min", "tempo curto", "rapido", "rápido"], dicas: POR_CONTEXTO.tempo },
];

/** Lista de dicas de treino personalizada pela descrição de perfil. */
export function gerarDicasTreino(descricao: string | null | undefined): string[] {
  const d = norm(descricao ?? "");
  const out: string[] = [];
  const add = (arr: string[]) => {
    for (const t of arr) if (!out.includes(t)) out.push(t);
  };

  if (d.trim()) {
    for (const r of REGRAS) {
      if (r.termos.some((t) => d.includes(norm(t)))) add(r.dicas);
    }
  }

  add(FUNDAMENTOS); // completa (e cobre o caso de nada casar)
  return out.slice(0, 8);
}
