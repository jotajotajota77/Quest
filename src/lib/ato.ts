// ============================================================
// Sistema de ATOS (v11.3) — narrativa RPG do cutting até 09/09.
// ------------------------------------------------------------
// Divide os ~45 dias em 3 atos com nome dramático + arco + boss no fim.
// Cada ato define o "tom" narrativo mostrado na home e no /plano.
// ============================================================

export interface Ato {
  numero: 1 | 2 | 3;
  nome: string;              // "O Despertar do Trainee"
  subtitulo: string;         // "Ato 1 — 3 semanas de base"
  arco: string;              // parágrafo narrativo curto
  data_inicio: string;       // YYYY-MM-DD
  data_fim: string;          // YYYY-MM-DD
  boss_nome: string;         // ex: "Sombra da Preguiça"
  boss_arco: string;         // narrativa do boss
  cor_tema: string;          // CSS var
  emoji: string;
}

export const ATOS: Ato[] = [
  {
    numero: 1,
    nome: "O Despertar do Trainee",
    subtitulo: "Ato 1 · construção da base",
    arco:
      "Você acabou de entrar no dojang. O sabum não te olha ainda. As faixas estão limpas na parede. Só existe uma coisa: repetir até o corpo lembrar. Constrói disciplina antes de peso.",
    data_inicio: "2026-07-26",
    data_fim: "2026-08-16",
    boss_nome: "Sombra da Preguiça",
    boss_arco:
      "A voz que sussurra 'amanhã'. Vencê-la é aparecer 6 dias na semana. Simples. Difícil.",
    cor_tema: "var(--calm)",
    emoji: "🌱",
  },
  {
    numero: 2,
    nome: "A Sombra do Sabum",
    subtitulo: "Ato 2 · calibragem sob pressão",
    arco:
      "O sabum começou a te notar. Agora o volume aperta. Cada série pesa mais que a anterior. O corpo pede pra parar; a técnica pede pra continuar. É nesse ato que a faixa muda de cor.",
    data_inicio: "2026-08-17",
    data_fim: "2026-08-31",
    boss_nome: "O Espelho Duvidoso",
    boss_arco:
      "Ele mostra o que você quer não ver — as semanas médias, os dias fracos. Vencê-lo é bater PR em 2 exercícios na mesma semana.",
    cor_tema: "var(--gold)",
    emoji: "⚔️",
  },
  {
    numero: 3,
    nome: "O Palco Final",
    subtitulo: "Ato 3 · taper + prova",
    arco:
      "9 dias. O cutting termina em corpo mostrado. Taper controlado, dieta afiada, dança pra soltar, TKD pra afiar. Você não é mais o trainee — é o mestre da sua faixa.",
    data_inicio: "2026-09-01",
    data_fim: "2026-09-09",
    boss_nome: "Você (versão 09/09)",
    boss_arco:
      "O último boss é o V-taper cumprido. Bater 13% BF é o kihap final.",
    cor_tema: "var(--kihap)",
    emoji: "🔥",
  },
];

/** Retorna o ato ativo dado uma data ISO (YYYY-MM-DD). */
export function atoAtual(dataISO: string): Ato {
  for (const a of ATOS) {
    if (dataISO >= a.data_inicio && dataISO <= a.data_fim) return a;
  }
  // Antes do ato 1: retorna ato 1. Depois do ato 3: retorna ato 3.
  return dataISO < ATOS[0].data_inicio ? ATOS[0] : ATOS[ATOS.length - 1];
}

/** Dias corridos até o fim do ato atual. */
export function diasNoAto(ato: Ato, hojeISO: string): number {
  const [hy, hm, hd] = hojeISO.split("-").map(Number);
  const [fy, fm, fd] = ato.data_fim.split("-").map(Number);
  const inicio = Date.UTC(hy, hm - 1, hd);
  const fim = Date.UTC(fy, fm - 1, fd);
  return Math.max(0, Math.floor((fim - inicio) / 86_400_000));
}

/** Progresso (0-100%) dentro do ato. */
export function progressoAto(ato: Ato, hojeISO: string): number {
  const [iy, im, id] = ato.data_inicio.split("-").map(Number);
  const [fy, fm, fd] = ato.data_fim.split("-").map(Number);
  const [hy, hm, hd] = hojeISO.split("-").map(Number);
  const inicio = Date.UTC(iy, im - 1, id);
  const fim = Date.UTC(fy, fm - 1, fd);
  const hoje = Date.UTC(hy, hm - 1, hd);
  const total = fim - inicio;
  if (total <= 0) return 100;
  const pct = ((hoje - inicio) / total) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}
