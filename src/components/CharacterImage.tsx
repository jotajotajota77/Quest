"use client";

// Imagem de personagem com fallback para a inicial. Enquanto o asset real não
// estiver em public/personagens/<slug>/, o retrato/corpo cai no placeholder de
// letra sem quebrar a UI.
//
// v10.3: aceita `srcs` (array) além de `src` — tenta cada url em ordem, cai na
// próxima em onError. Só mostra a letra quando TODAS falham. Útil pra quando
// uma pose (ex.: vitoria) não existe pro personagem — cai em rosto/corpo antes
// de mostrar letra.
import { useState } from "react";

export function inicial(nome: string): string {
  return nome.trim().charAt(0).toUpperCase() || "?";
}

export default function CharacterImage({
  src,
  srcs,
  nome,
  className,
  fallbackSize = "2.4rem",
}: {
  src?: string | null;
  srcs?: (string | null | undefined)[];
  nome: string;
  className?: string;
  fallbackSize?: string;
}) {
  // Monta a lista de candidatos: srcs primeiro, depois src legado. Descarta
  // nulls/undefined/vazios.
  const candidatos = [
    ...(srcs ?? []).filter((s): s is string => !!s),
    ...(src ? [src] : []),
  ];
  const [i, setI] = useState(0);
  const atual = candidatos[i];

  if (!atual) {
    return (
      <span className="roster-face-fallback" style={{ fontSize: fallbackSize }}>
        {inicial(nome)}
      </span>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={atual}
      alt={nome}
      className={className}
      onError={() => setI((n) => n + 1)}
    />
  );
}
