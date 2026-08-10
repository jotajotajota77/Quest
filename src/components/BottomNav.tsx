"use client";

// Barra de abas inferior (fixa). As 2 famílias (Treino/Nutri) + Home, mais
// utilidades (Trocar, Espelho). A aba atual fica MARCADA (cor + fundo).
// Espelho é discreto — nunca convoca (TRAVA). Vira tab bar de app, não
// pílulas soltas.
//
// v12.4: emojis substituídos por SVGs stroke-based (NavIcons). currentColor
// pega a cor da tab automaticamente (ativo = kihap, dim = ink-dim).
import Link from "next/link";
import { usePathname } from "next/navigation";
import NavIcon, { type NavIconKey } from "@/components/NavIcons";

// v12.5: /quests saiu do BottomNav — QuestsCard na /home vira o único
// ponto de acesso primário. Rota /quests continua funcional pra links
// antigos, só perdeu a aba fixa.
const LINKS: { href: string; label: string; ico: NavIconKey; dim?: boolean }[] = [
  { href: "/home", label: "Home", ico: "home" },
  { href: "/programa", label: "Plano", ico: "plano" },
  { href: "/treino", label: "Treino", ico: "treino" },
  { href: "/nutri", label: "Nutri", ico: "nutri" },
  { href: "/taekwondo", label: "TKD", ico: "tkd" },
  { href: "/danca", label: "Dança", ico: "danca" },
  { href: "/colecao", label: "Deck", ico: "deck" },
  { href: "/hub", label: "Trocar", ico: "trocar", dim: true },
  { href: "/espelho", label: "Espelho", ico: "espelho", dim: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="tabbar">
      {LINKS.map((l) => {
        const ativo = pathname === l.href || pathname?.startsWith(l.href + "/");
        return (
          <Link
            key={l.href}
            className={`tab${ativo ? " active" : ""}${l.dim ? " dim" : ""}`}
            href={l.href}
          >
            <span className="tab-ico" style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <NavIcon ico={l.ico} />
            </span>
            <span className="tab-lbl">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
