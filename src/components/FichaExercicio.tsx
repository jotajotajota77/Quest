// Ficha de exercício — bloco compartilhado entre a Biblioteca (descoberta) e
// o card de sessão do Treino (v9: mostra a prescrição do programa embutido
// junto da observação técnica, sem duplicar JSX entre os dois lugares).
import type { ExercicioBib } from "@/lib/data";

export function FichaLinha({
  rotulo,
  texto,
  cor,
}: {
  rotulo: string;
  texto: string | null;
  cor?: string;
}) {
  if (!texto) return null;
  return (
    <div style={{ marginBottom: 6 }}>
      <span style={{ fontWeight: 800, color: cor ?? "var(--text)" }}>{rotulo}: </span>
      <span className="subtle">{texto}</span>
    </div>
  );
}

export function FichaCompleta({
  ex,
}: {
  ex: Pick<ExercicioBib, "musculos" | "execucao" | "cue" | "erro_comum" | "variacoes">;
}) {
  return (
    <div style={{ fontSize: "0.8rem", lineHeight: 1.45 }}>
      <FichaLinha rotulo="Músculos" texto={ex.musculos.join(", ")} />
      <FichaLinha rotulo="Execução" texto={ex.execucao} />
      <FichaLinha rotulo="Cue" texto={ex.cue} cor="var(--neon-2)" />
      <FichaLinha rotulo="Erro comum" texto={ex.erro_comum} cor="var(--neon)" />
      <FichaLinha rotulo="Variações" texto={ex.variacoes.join(" · ")} />
    </div>
  );
}

/** Linha compacta série×reps · RIR · descanso · cadência (programa embutido). */
export function ProgramaLinha({
  ex,
}: {
  ex: Pick<ExercicioBib, "series" | "reps" | "rir" | "descanso" | "cadencia">;
}) {
  if (!ex.series && !ex.reps) return null;
  const partes = [
    ex.series && ex.reps ? `${ex.series}×${ex.reps}` : ex.series || ex.reps,
    ex.rir ? `RIR ${ex.rir}` : null,
    ex.descanso ? `desc ${ex.descanso}` : null,
    ex.cadencia ? `cad ${ex.cadencia}` : null,
  ].filter(Boolean);
  return (
    <div className="subtle" style={{ fontSize: "0.72rem", marginTop: 4 }}>
      {partes.join(" · ")}
    </div>
  );
}
