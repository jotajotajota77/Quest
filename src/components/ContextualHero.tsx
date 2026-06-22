"use client";

// Hero contextual do personagem (em ação / representando o atributo). Tenta os
// candidatos na ordem e cai num placeholder neutro se nenhum carregar — nunca
// quebra o layout. (Imagens são populadas depois; ver convenção em README.)
import { useState } from "react";

export default function ContextualHero({
  candidatos,
  nome,
  altura = 200,
}: {
  candidatos: string[];
  nome: string;
  altura?: number;
}) {
  const [i, setI] = useState(0);
  const src = candidatos[i];

  return (
    <div
      className="hero-contexto"
      style={{ height: altura }}
      aria-label={`${nome} em ação`}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={nome} onError={() => setI((n) => n + 1)} />
      ) : (
        <div className="hero-silhueta">
          <span>{nome}</span>
        </div>
      )}
    </div>
  );
}
