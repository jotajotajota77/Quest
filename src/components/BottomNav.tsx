// Navegação inferior. NÃO inclui a aba-espelho como chamariz visual de
// destaque — o espelho fica como link discreto, nunca convoca (TRAVA).
import Link from "next/link";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Link className="nav-link" href="/home">
        Home
      </Link>
      <Link className="nav-link" href="/hub">
        Trocar personagem
      </Link>
      {/* Aba-espelho: acessível só por clique explícito, sem ênfase. */}
      <Link className="nav-link" href="/espelho" style={{ opacity: 0.65 }}>
        Espelho
      </Link>
    </nav>
  );
}
