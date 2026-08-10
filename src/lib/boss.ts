// ============================================================
// Sistema de BOSS BATTLE semanal (v11.3) — RPG mechanic.
// ------------------------------------------------------------
// Cada semana tem um "boss" (mestre) que dispara um desafio cumulativo.
// O jogador tem 7 dias pra reduzir o HP do boss zerando as metas de:
//   séries de musculação + quests TKD + sessões de dança + logs nutri.
// Se derrotar, ganha XP grande + achievement + título temporário.
// ============================================================

export interface Boss {
  semana_iso: string;         // ex: "2026-W31" (ISO week)
  mestre_slug: string;        // qual mestre é o boss essa semana
  nome_boss: string;          // "Chan-ho, O Sabum" | "Sombra do Cardio" etc.
  emoji: string;
  arco: string;               // pitch narrativo curto
  hp_total: number;           // soma das metas
  metas: {
    series: number;           // séries de musculação
    tkd: number;              // quests TKD marcadas
    danca: number;            // sessões de dança logadas
    nutri: number;            // registros nutri
  };
  xp_recompensa: number;
  cor_tema: string;
}

// v12.5: rotação de boss desacoplada dos mestres jogáveis. Os 5 abaixo
// são antagonistas fictícios (personagens.jogavel=false via migration 0026).
// Cada um tem uma estética / arco específico + ajuste nas metas semanais.
// Arte NULL por enquanto — CharacterImage cai na letra inicial via cascata.
const MESTRES_ROTA = [
  {
    slug: "sombra-do-cardio",
    nome_boss: "Sombra do Cardio",
    emoji: "🌫",
    arco: "Ela cresce nos dias parados. Ou você anda, ou ela toma tua sala.",
    cor_tema: "var(--calm)",
    ajuste: { series: 0, tkd: 0, danca: +2, nutri: +4 },
  },
  {
    slug: "escala-falsa",
    nome_boss: "Escala Falsa",
    emoji: "📉",
    arco: "O peso oscila sem gordura mudar. Ela adora te tirar do foco na terça.",
    cor_tema: "var(--belt-yellow)",
    ajuste: { series: +5, tkd: 0, danca: 0, nutri: +2 },
  },
  {
    slug: "sabum-da-meia-noite",
    nome_boss: "Sabum da Meia-Noite",
    emoji: "🌙",
    arco: "Faixa preta rasgada, luz branca fria. Rouba sono, cobra performance de manhã.",
    cor_tema: "var(--kihap)",
    ajuste: { series: 0, tkd: +3, danca: 0, nutri: +1 },
  },
  {
    slug: "halter-fantasma",
    nome_boss: "Halter Fantasma",
    emoji: "👻",
    arco: "A barra fica leve mas você não cresce. Técnica quebrou — precisa ser confrontada.",
    cor_tema: "var(--lilac)",
    ajuste: { series: +12, tkd: 0, danca: 0, nutri: 0 },
  },
  {
    slug: "ceia-do-prazer",
    nome_boss: "Ceia do Prazer",
    emoji: "🍷",
    arco: "Mesa barroca de sabor. Cada colher a mais é vitória dela.",
    cor_tema: "var(--gold)",
    ajuste: { series: 0, tkd: 0, danca: 0, nutri: +6 },
  },
];

/** Gera o boss da semana determinística por semana ISO. */
export function bossDaSemana(dataISO: string): Boss {
  const semana = semanaISO(dataISO);
  // Hash da semana → índice rotativo
  let h = 0;
  for (const c of semana) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const rota = MESTRES_ROTA[h % MESTRES_ROTA.length];

  const base = { series: 40, tkd: 3, danca: 2, nutri: 12 };
  const metas = {
    series: base.series + rota.ajuste.series,
    tkd: base.tkd + rota.ajuste.tkd,
    danca: base.danca + rota.ajuste.danca,
    nutri: base.nutri + rota.ajuste.nutri,
  };
  const hp_total = metas.series + metas.tkd * 3 + metas.danca * 5 + metas.nutri;

  return {
    semana_iso: semana,
    mestre_slug: rota.slug,
    nome_boss: rota.nome_boss,
    emoji: rota.emoji,
    arco: rota.arco,
    hp_total,
    metas,
    xp_recompensa: 150,
    cor_tema: rota.cor_tema,
  };
}

/** Semana ISO (YYYY-Www) — ex: 2026-W31. */
export function semanaISO(dataISO: string): string {
  const [y, m, d] = dataISO.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // ISO week calculation
  const dayNum = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dt.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(
    ((dt.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7,
  );
  return `${dt.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** Data ISO do começo (segunda) e fim (domingo) da semana. */
export function limitesSemanaISO(semana: string): { inicio: string; fim: string } {
  const [yStr, wStr] = semana.split("-W");
  const year = Number(yStr);
  const week = Number(wStr);
  // Jan 4 sempre cai na semana 1 (ISO)
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const dayNum = jan4.getUTCDay() || 7;
  const monday1 = new Date(jan4);
  monday1.setUTCDate(jan4.getUTCDate() - (dayNum - 1));
  const monday = new Date(monday1);
  monday.setUTCDate(monday1.getUTCDate() + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    inicio: monday.toISOString().slice(0, 10),
    fim: sunday.toISOString().slice(0, 10),
  };
}

export interface BossProgresso {
  boss: Boss;
  series_feitas: number;
  tkd_feitas: number;
  danca_feitas: number;
  nutri_feitas: number;
  hp_restante: number;
  pct_hp: number;              // 0..100 (100 = full HP boss, 0 = derrotado)
  derrotado: boolean;
}

/** Calcula o progresso da batalha dados os números feitos na semana. */
export function calcularBossProgresso(
  boss: Boss,
  atuais: { series: number; tkd: number; danca: number; nutri: number },
): BossProgresso {
  const s = Math.min(atuais.series, boss.metas.series);
  const t = Math.min(atuais.tkd, boss.metas.tkd);
  const d = Math.min(atuais.danca, boss.metas.danca);
  const n = Math.min(atuais.nutri, boss.metas.nutri);
  const dano = s + t * 3 + d * 5 + n;
  const hp_restante = Math.max(0, boss.hp_total - dano);
  const pct_hp = Math.round((hp_restante / boss.hp_total) * 100);
  return {
    boss,
    series_feitas: atuais.series,
    tkd_feitas: atuais.tkd,
    danca_feitas: atuais.danca,
    nutri_feitas: atuais.nutri,
    hp_restante,
    pct_hp,
    derrotado: hp_restante === 0,
  };
}
