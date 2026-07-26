// ============================================================
// Dicas do dia — a "fala" que o personagem dono da aba te dá ao abrir a foto.
// Camada de IDENTIDADE/coaching (não é engine de reforço). Determinística pela
// data: a mesma dica o dia todo, rotaciona a cada dia (como as quests).
// ============================================================

import type { ContextoHero } from "@/lib/heroi";

const DICAS: Record<ContextoHero, string[]> = {
  home: [
    "Constância vence intensidade. Faz UMA coisa hoje e deixa o resto seguir.",
    "O sistema conta com a sua desistência. Registra uma vez e quebra a previsão.",
    "Você não precisa de vontade — precisa de um gatilho. Abre a aba e toca.",
    "Dia ruim também conta. Aparecer no modo névoa já é vitória.",
    "Disciplina é lembrar do que você quer mais. Hoje, escolhe o difícil pequeno.",
    "Cada registro é um território que o sistema não mapeia. Marca o seu.",
  ],
  treino: [
    "Carga não é tudo: técnica limpa hoje é PR amanhã. Controla a descida.",
    "Falhou uma série? Anota mesmo assim — o histórico é quem te treina.",
    "Aquecimento é parte do treino, não enrolação. Prepara a articulação.",
    "Não treina pra cansar, treina pra progredir. Bate o set anterior.",
    "Descanso é treino também. Usa o timer e respeita o relógio.",
    "Bora no básico pesado: composto primeiro, isolado depois.",
  ],
  nutri: [
    "Proteína em toda refeição. É o tijolo que segura o resto.",
    "Comeu junk? Registra sem culpa — dado honesto é o que te ajusta.",
    "Fome de tarde? Vê se bebeu água e comeu proteína no almoço.",
    "Défice vem da dieta, não do cardio. Cardio é ferramenta, não muleta.",
    "Meta não é perfeição: é a média da semana. Hoje conta pra ela.",
    "Planeja a próxima refeição agora — decisão tomada não cansa depois.",
  ],
  taekwondo: [
    "Kihap não é grito — é decisão que sai pelo pulmão.",
    "Guarda alta, pé leve, cabeça fria. A faixa vem depois.",
    "Chute alto é vaidade; chute certo é economia.",
    "O sabum ensina, a esteira testa. Aparece pra testar.",
    "Poomsae sem alma vira dança. Coloca intenção em cada movimento.",
  ],
  danca: [
    "Isolação primeiro. O corpo aprende antes da coreografia.",
    "Erre no espelho, acerte no palco. Repetição limpa o gesto.",
    "Presença > perfeição. Cansaço mostra, hesitação afunda.",
    "Ouve a música 3× antes de dançar. O corpo já tá coreografando.",
    "Filma. O que você acha que faz e o que o corpo faz são coisas diferentes.",
  ],
  quests: [
    "Reconhecimento não é recompensa. É espelho.",
    "Sidequest fechada vale mais que meta ambiciosa aberta.",
    "O sistema soma o que você fez. Você conta o que faltou.",
    "Uma quest por vez. Muitas metas paralelas viram nenhuma.",
    "Anota o que fez, mesmo se pouco. XP passivo é XP real.",
  ],
};

/** A dica que o personagem te dá hoje (estável no dia, rotaciona por data). */
export function dicaDoDia(ctx: ContextoHero, dataISO: string): string {
  const pool = DICAS[ctx] ?? DICAS.home;
  let h = 0;
  for (const ch of dataISO + ctx) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return pool[h % pool.length];
}
