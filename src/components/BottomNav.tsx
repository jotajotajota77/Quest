// Navegação inferior. As 4 abas de comportamento + Home + Hub. A aba-espelho
// fica como link discreto (opacidade baixa) — nunca convoca (TRAVA).
import Link from "next/link";

const LINKS: { href: string; label: string; dim?: boolean }[] = [
  { href: "/home", label: "Home" },
  { href: "/treino", label: "Treino" },
  { href: "/nutri", label: "Nutri" },
  { href: "/leitura", label: "Leitura" },
  { href: "/danca", label: "Dança" },
  { href: "/hub", label: "Trocar" },
  { href: "/espelho", label: "Espelho", dim: true },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" style={{ flexWrap: "wrap" }}>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          className="nav-link"
          href={l.href}
          style={l.dim ? { opacity: 0.55 } : undefined}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
