"use client";

// ============================================================
// Mundo VHYX — lore do universo como IDENTIDADE (não engine diária). (CORTADO:
// narrativa como motor). Acesso opcional por clique; nada disto entrega
// recompensa diária — é só pertencimento/identidade do roster.
// ============================================================

import { useState } from "react";

const SECOES: { titulo: string; texto: string }[] = [
  {
    titulo: "A Era — 2087",
    texto:
      "Dezesseis anos após o Colapso (2071). As Nações Federadas reergueram a ordem sobre vigilância total. Entre as cidades-controle e os Subúrbios Lentos, a rotina virou campo de batalha silencioso.",
  },
  {
    titulo: "CADEIA",
    texto:
      "O programa de captura das Nações Federadas — promete 'restaurar' quem desvia do padrão. Cada célula (CADEIA-1, CADEIA-7…) caça os que ainda respondem por conta própria.",
  },
  {
    titulo: "Operadores VHYX",
    texto:
      "A resistência. Não lutam com armas — lutam com constância. Cada Operador instala um hábito que o sistema não consegue prever: Zyan (Iron Core) na força, Kai (Cardio Knight) no fôlego, Luan (Dance Magician) no ritmo, Dhavos (Beast Warden) no vínculo e na sabedoria.",
  },
  {
    titulo: "Antagonistas",
    texto:
      "Directora Vela Crowne (CADEIA-1) assinou ordens que ninguém devia assinar. Tenente Yoshikawa (CADEIA-7) opera implantes 'pelo bem'. Marshal Baum desenhou o Anti-Flow para quebrar quem dança. Todos apostam que você desiste primeiro.",
  },
  {
    titulo: "A regra do mundo",
    texto:
      "Aqui, recolher-se não é derrota (modo névoa). Voltar é vitória. O streak é emocional — e o ferro, como diz Zyan, não negocia: só responde.",
  },
];

export default function WorldLoreButton() {
  const [aberto, setAberto] = useState(false);
  return (
    <>
      <button className="nav-link" onClick={() => setAberto(true)}>
        Mundo VHYX
      </button>
      {aberto && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 60,
            padding: 18,
          }}
          onClick={() => setAberto(false)}
        >
          <div
            className="panel"
            style={{ maxWidth: 460, maxHeight: "82vh", overflowY: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="title-fight" style={{ margin: "0 0 8px" }}>
              Mundo VHYX
            </h3>
            {SECOES.map((s) => (
              <div key={s.titulo} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, color: "var(--neon-2)" }}>
                  {s.titulo}
                </div>
                <p className="subtle" style={{ margin: "4px 0 0" }}>
                  {s.texto}
                </p>
              </div>
            ))}
            <button
              className="btn"
              style={{ width: "100%", marginTop: 4 }}
              onClick={() => setAberto(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
