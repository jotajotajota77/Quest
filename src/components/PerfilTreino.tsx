"use client";

// Descrição de perfil + dicas de treino personalizadas. O usuário escreve
// objetivo/nível/limitações/contexto; as dicas se adaptam ao vivo (pura função)
// e o texto salvo também alimenta a Análise IA. Tooling — não é reforço.
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { gerarDicasTreino } from "@/lib/dicas_treino";

export default function PerfilTreino({
  descricaoInicial,
}: {
  descricaoInicial: string;
}) {
  const router = useRouter();
  const [descricao, setDescricao] = useState(descricaoInicial);
  const [salvo, setSalvo] = useState(descricaoInicial);
  const [ocupado, setOcupado] = useState(false);

  // Dicas atualizam AO VIVO conforme o texto (feedback imediato).
  const dicas = useMemo(() => gerarDicasTreino(descricao), [descricao]);
  const mudou = descricao !== salvo;

  async function salvar() {
    setOcupado(true);
    try {
      await fetch("/api/perfil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao }),
      });
      setSalvo(descricao);
      router.refresh();
    } catch {
      /* segue; o usuário pode tentar de novo */
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div style={{ marginTop: 18 }}>
      <div className="panel">
        <div className="lbl">Seu perfil de treino</div>
        <p className="subtle" style={{ margin: "4px 0 8px" }}>
          Escreva objetivo, nível, limitações e contexto. As dicas abaixo se
          adaptam ao que você escrever.
        </p>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          placeholder="Ex.: Quero hipertrofia, sou intermediário, tenho dor no ombro e treino 4x na academia."
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 10,
            border: "1px solid var(--panel-border)",
            background: "rgba(0,0,0,0.25)",
            color: "var(--text)",
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <button
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          disabled={ocupado || !mudou}
          onClick={salvar}
        >
          {ocupado ? "Salvando…" : mudou ? "Salvar perfil" : "Salvo ✓"}
        </button>
      </div>

      {dicas.length > 0 && (
        <div className="panel" style={{ marginTop: 12, borderColor: "var(--neon-2)" }}>
          <div className="lbl">
            Dicas pra você{descricao.trim() ? " · do seu perfil" : ""}
          </div>
          <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
            {dicas.map((d) => (
              <li key={d} className="subtle" style={{ marginBottom: 6 }}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
