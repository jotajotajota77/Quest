"use client";

// Imagem de personagem com fallback para a inicial. Enquanto o asset real não
// estiver em public/personagens/<slug>/, o retrato/corpo cai no placeholder de
// letra sem quebrar a UI.
import { useState } from "react";

export function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

export default function CharacterImage({
  src,
  nome,
  className,
  fallbackSize = "2.4rem",
}: {
  src: string | null;
  nome: string;
  className?: string;
  fallbackSize?: string;
}) {
  const [erro, setErro] = useState(false);
  if (!src || erro) {
    return (
      <span className="roster-face-fallback" style={{ fontSize: fallbackSize }}>
        {inicial(nome)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={nome}
      className={className}
      onError={() => setErro(true)}
    />
  );
}
