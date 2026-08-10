// ============================================================
// NavIcons — 10 SVGs stroke-based pra BottomNav (v12.4).
// ------------------------------------------------------------
// Substituem os emojis. `currentColor` + stroke consistente (1.75px)
// deixam todos com peso visual similar. Se quiser trocar por outra
// arte, só editar o path do componente correspondente.
// ============================================================

export type NavIconKey =
  | "home"
  | "plano"
  | "treino"
  | "nutri"
  | "tkd"
  | "danca"
  | "quests"
  | "deck"
  | "trocar"
  | "espelho";

const BASE_PROPS: React.SVGProps<SVGSVGElement> = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};

/** Home — casa simples. */
function IconHome() {
  return (
    <svg {...BASE_PROPS}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  );
}

/** Plano — calendário com dia marcado (kihap dot no canto). */
function IconPlano() {
  return (
    <svg {...BASE_PROPS}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="16" cy="15" r="1.4" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Treino — halter horizontal. */
function IconTreino() {
  return (
    <svg {...BASE_PROPS}>
      <path d="M6.5 8v8M9 6v12M15 6v12M17.5 8v8" />
      <path d="M9 12h6" />
      <path d="M3.5 10v4M20.5 10v4" />
    </svg>
  );
}

/** Nutri — maçã com cabinho + folha. */
function IconNutri() {
  return (
    <svg {...BASE_PROPS}>
      <path d="M12 8c-2.5-2-6 .5-6 4 0 3.5 2 8 6 8s6-4.5 6-8c0-3.5-3.5-6-6-4Z" />
      <path d="M12 8V5" />
      <path d="M12 5c1-1.2 2.5-1.5 3.5-1-.3 1.5-1.7 2.7-3.5 2.5" />
    </svg>
  );
}

/** TKD — pé em chute (dolyo). Silhueta simplificada. */
function IconTkd() {
  return (
    <svg {...BASE_PROPS}>
      <circle cx="9" cy="5" r="2" />
      <path d="M9 7v5l4 1" />
      <path d="M13 13 21 9" />
      <path d="M9 12l-4 4 3 4" />
    </svg>
  );
}

/** Dança — figura em pose (braço acima, quadril lateral). */
function IconDanca() {
  return (
    <svg {...BASE_PROPS}>
      <circle cx="13" cy="4.5" r="1.8" />
      <path d="M13 6.5v4l-4 2 3 3-2 6" />
      <path d="M13 10.5l4 2-1 4" />
      <path d="M13 6.5c-1.5-1-3-2-3-2" />
    </svg>
  );
}

/** Quests — pergaminho com checkmark. */
function IconQuests() {
  return (
    <svg {...BASE_PROPS}>
      <path d="M6 3h10a3 3 0 0 1 3 3v14l-2-1.5L15 20l-2-1.5L11 20l-2-1.5L7 20l-2-1.5V6a3 3 0 0 1 1-3Z" />
      <path d="M9 9l2 2 4-4" />
    </svg>
  );
}

/** Deck (Coleção) — pilha de cards. */
function IconDeck() {
  return (
    <svg {...BASE_PROPS}>
      <rect x="5" y="7" width="10" height="14" rx="1.5" />
      <path d="M8 5h9a1.5 1.5 0 0 1 1.5 1.5V18" />
      <path d="M11 4h9a1.5 1.5 0 0 1 1.5 1.5V16" opacity="0.55" />
    </svg>
  );
}

/** Trocar — setas circulando (refresh/swap). */
function IconTrocar() {
  return (
    <svg {...BASE_PROPS}>
      <path d="M4 12a8 8 0 0 1 14-5.3" />
      <path d="M18 3v4h-4" />
      <path d="M20 12a8 8 0 0 1-14 5.3" />
      <path d="M6 21v-4h4" />
    </svg>
  );
}

/** Espelho — oval com reflexo em diagonal. */
function IconEspelho() {
  return (
    <svg {...BASE_PROPS}>
      <ellipse cx="12" cy="11" rx="6" ry="8" />
      <path d="M12 19v3M9 22h6" />
      <path d="M9.5 6.5c-1 1.5-1.5 3-1.5 4.5" opacity="0.55" />
    </svg>
  );
}

const ICONES: Record<NavIconKey, () => React.JSX.Element> = {
  home: IconHome,
  plano: IconPlano,
  treino: IconTreino,
  nutri: IconNutri,
  tkd: IconTkd,
  danca: IconDanca,
  quests: IconQuests,
  deck: IconDeck,
  trocar: IconTrocar,
  espelho: IconEspelho,
};

export default function NavIcon({ ico }: { ico: NavIconKey }) {
  const C = ICONES[ico];
  return <C />;
}
