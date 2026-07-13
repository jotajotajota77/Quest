"use client";

// Barra de abas inferior (fixa). As 2 famílias (Treino/Nutri) + Home, mais
// utilidades (Trocar, Espelho). A aba atual fica MARCADA (cor + fundo).
// Espelho é discreto — nunca convoca (TRAVA). Vira tab bar de app, não
// pílulas soltas.
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; ico: string; dim?: boolean }[] = [
  { href: "/home", label: "Home", ico: "🏠" },
  { href: "/treino", label: "Treino", ico: "🏋️" },
  { href: "/nutri", label: "Nutri", ico: "🍎" },
  { href: "/hub", label: "Trocar", ico: "🔄" },
  { href: "/espelho", label: "Espelho", ico: "🪞", dim: true },
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
            <span className="tab-ico">{l.ico}</span>
            <span className="tab-lbl">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
