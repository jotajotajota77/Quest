// Aba Nutri — camada universal + motor de instalação (no /api/log) + COACH
// gated (afinamento). O coach só aparece quando o operante da Nutri fortalece.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { coachNutriAtivo, resumoMacrosNutri } from "@/lib/data";
import BehaviorTab from "@/components/BehaviorTab";

export default async function NutriPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const ativo = await coachNutriAtivo(user.id);
  const resumo = ativo ? await resumoMacrosNutri(user.id) : null;

  return (
    <BehaviorTab familia="nutri" coachAtivo={ativo}>
      {ativo && (
        <div className="panel" style={{ marginTop: 18, borderColor: "var(--gold)" }}>
          <div className="lbl">Coach da Nutri (ativo)</div>
          <p className="subtle" style={{ margin: "4px 0 8px" }}>
            O operante fortaleceu — agora dá pra anexar macros (opcional) ao
            registrar. O 1-toque continua sendo o piso.
          </p>
          {resumo && resumo.nComMacros > 0 ? (
            <div className="subtle">
              Últimos 7 dias: {resumo.nComMacros} registro(s) com macro · média{" "}
              <strong>{resumo.mediaKcal} kcal</strong> ·{" "}
              <strong>{resumo.mediaProteina} g</strong> proteína.
            </div>
          ) : (
            <div className="subtle">
              Ainda sem macros anexados — quando quiser, registre e preencha.
            </div>
          )}
        </div>
      )}
    </BehaviorTab>
  );
}
